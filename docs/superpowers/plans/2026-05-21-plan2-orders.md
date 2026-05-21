# Orders System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the complete order marketplace — publish, browse, apply, manage, and complete orders with OPC ability tags and full status machine.

**Architecture:** Server Actions for all mutations. `/orders` uses server-side filtering via searchParams. Order status transitions are enforced in actions with role checks. Points awarded via a shared `awardPoints()` helper written in this plan.

**Tech Stack:** Next.js 15 App Router, Prisma, Server Actions, Tailwind CSS, NextAuth v5 (`auth()` helper).

---

## File Map

```
prisma/
  schema.prisma                         # Add tags String[] to Order; migrate
src/
  lib/
    points.ts                           # awardPoints(userId, delta, reason) helper
  actions/
    orders.ts                           # createOrder, updateOrder, closeOrder, completeOrder
    applications.ts                     # applyToOrder, acceptApplication, rejectApplication
  components/
    orders/
      OrderCard.tsx                     # Single order card (used in list + dashboard)
      OrderFilters.tsx                  # Left-side filter panel (client component)
      ApplyForm.tsx                     # Apply modal/form inside order detail
      ApplicationList.tsx               # List of applicants (visible to order author)
  app/
    orders/
      page.tsx                          # /orders — marketplace list (replace stub)
      new/
        page.tsx                        # /orders/new — publish form (replace stub)
      [id]/
        page.tsx                        # /orders/[id] — detail + apply
        edit/
          page.tsx                      # /orders/[id]/edit — edit form
    dashboard/
      layout.tsx                        # Dashboard layout (auth guard)
      orders/
        page.tsx                        # /dashboard/orders — my orders (2 tabs)
  __tests__/
    actions/
      orders.test.ts                    # Unit tests for order actions
      applications.test.ts              # Unit tests for application actions
    lib/
      points.test.ts                    # Unit tests for awardPoints
```

---

## Task 1: Schema Migration — Add tags to Order

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add `tags` field to Order model**

Open `prisma/schema.prisma`. In the `Order` model, add after the `rejectReason` line:

```prisma
tags         String[]
```

The full Order model should now look like:

```prisma
model Order {
  id           String      @id @default(cuid())
  title        String
  description  String      @db.Text
  amount       Decimal     @db.Decimal(12, 2)
  category     String
  tags         String[]
  status       OrderStatus @default(DRAFT)
  deadline     DateTime?
  authorId     String
  rejectReason String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  author       User               @relation(fields: [authorId], references: [id])
  applications OrderApplication[]
}
```

- [ ] **Step 2: Run migration**

```bash
npx prisma migrate dev --name add-order-tags
```

Expected: `✓ Generated Prisma Client` and new migration folder created.

- [ ] **Step 3: Commit**

```bash
git add prisma/
git commit -m "feat: add tags field to Order model"
```

---

## Task 2: Points Helper

**Files:**
- Create: `src/lib/points.ts`
- Create: `src/__tests__/lib/points.test.ts`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/lib/points.test.ts
import { awardPoints } from "@/lib/points"
import { db } from "@/lib/db"

jest.mock("@/lib/db", () => ({
  db: {
    user: { update: jest.fn() },
    pointLog: { create: jest.fn() },
  },
}))

describe("awardPoints", () => {
  beforeEach(() => jest.clearAllMocks())

  it("updates user points and creates a log entry", async () => {
    await awardPoints("user1", 100, "完成订单")
    expect((db.user.update as jest.Mock)).toHaveBeenCalledWith({
      where: { id: "user1" },
      data: { points: { increment: 100 } },
    })
    expect((db.pointLog.create as jest.Mock)).toHaveBeenCalledWith({
      data: { userId: "user1", delta: 100, reason: "完成订单" },
    })
  })
})
```

- [ ] **Step 2: Run test to confirm fail**

```bash
npx jest src/__tests__/lib/points.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/points'`

- [ ] **Step 3: Create `src/lib/points.ts`**

```typescript
// src/lib/points.ts
import { db } from "@/lib/db"

export async function awardPoints(userId: string, delta: number, reason: string) {
  await Promise.all([
    db.user.update({ where: { id: userId }, data: { points: { increment: delta } } }),
    db.pointLog.create({ data: { userId, delta, reason } }),
  ])
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx jest src/__tests__/lib/points.test.ts --no-coverage
```

Expected: PASS — 1 test passes.

- [ ] **Step 5: Commit**

```bash
git add src/lib/points.ts src/__tests__/lib/points.test.ts
git commit -m "feat: add awardPoints helper with PointLog"
```

---

## Task 3: Order Server Actions

**Files:**
- Create: `src/actions/orders.ts`
- Create: `src/__tests__/actions/orders.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/__tests__/actions/orders.test.ts
import { createOrder, closeOrder, completeOrder } from "@/actions/orders"
import { db } from "@/lib/db"
import { auth } from "@/auth"

jest.mock("@/lib/db", () => ({
  db: { order: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() } },
}))
jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }))

const mockAuth = auth as jest.Mock

describe("createOrder", () => {
  it("returns error when not authenticated", async () => {
    mockAuth.mockResolvedValue(null)
    const fd = new FormData()
    const result = await createOrder(fd)
    expect(result?.error).toBe("未登录")
  })

  it("returns error when role is not BIZ_OPC", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "OPC" } })
    const fd = new FormData()
    const result = await createOrder(fd)
    expect(result?.error).toBe("仅商务OPC可发布订单")
  })
})

describe("closeOrder", () => {
  it("returns error when not the author", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u2", role: "BIZ_OPC" } })
    ;(db.order.findUnique as jest.Mock).mockResolvedValue({ id: "o1", authorId: "u1", status: "RECRUITING" })
    const result = await closeOrder("o1")
    expect(result?.error).toBe("无权操作")
  })
})
```

- [ ] **Step 2: Run to confirm fail**

```bash
npx jest src/__tests__/actions/orders.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/actions/orders'`

- [ ] **Step 3: Create `src/actions/orders.ts`**

```typescript
// src/actions/orders.ts
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { awardPoints } from "@/lib/points"

const ORDER_TAGS = ["AI开发", "内容创作", "财税咨询", "设计", "运营", "法律", "其他"] as const

export async function createOrder(formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "未登录" }
  if (session.user.role !== "BIZ_OPC") return { error: "仅商务OPC可发布订单" }

  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const category = String(formData.get("category") ?? "").trim()
  const amount = parseFloat(String(formData.get("amount") ?? "0"))
  const deadlineStr = String(formData.get("deadline") ?? "")
  const tags = formData.getAll("tags").map(String).filter((t) => ORDER_TAGS.includes(t as typeof ORDER_TAGS[number]))

  if (!title || !description || !category || amount <= 0) return { error: "请填写所有必填项" }

  await db.order.create({
    data: {
      title,
      description,
      category,
      tags,
      amount,
      deadline: deadlineStr ? new Date(deadlineStr) : null,
      authorId: session.user.id,
      status: "PENDING_REVIEW",
    },
  })

  revalidatePath("/orders")
  return { success: true }
}

export async function updateOrder(orderId: string, formData: FormData) {
  const session = await auth()
  if (!session?.user) return { error: "未登录" }

  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) return { error: "订单不存在" }
  if (order.authorId !== session.user.id) return { error: "无权操作" }
  if (!["DRAFT", "PENDING_REVIEW", "REJECTED"].includes(order.status)) return { error: "当前状态不可编辑" }

  const title = String(formData.get("title") ?? "").trim()
  const description = String(formData.get("description") ?? "").trim()
  const category = String(formData.get("category") ?? "").trim()
  const amount = parseFloat(String(formData.get("amount") ?? "0"))
  const deadlineStr = String(formData.get("deadline") ?? "")
  const tags = formData.getAll("tags").map(String).filter((t) => ORDER_TAGS.includes(t as typeof ORDER_TAGS[number]))

  await db.order.update({
    where: { id: orderId },
    data: { title, description, category, tags, amount, deadline: deadlineStr ? new Date(deadlineStr) : null, status: "PENDING_REVIEW" },
  })

  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}

export async function closeOrder(orderId: string) {
  const session = await auth()
  if (!session?.user) return { error: "未登录" }

  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) return { error: "订单不存在" }
  if (order.authorId !== session.user.id) return { error: "无权操作" }
  if (!["RECRUITING", "PENDING_REVIEW"].includes(order.status)) return { error: "当前状态不可关闭" }

  await db.order.update({ where: { id: orderId }, data: { status: "CLOSED" } })
  revalidatePath("/dashboard/orders")
  return { success: true }
}

export async function completeOrder(orderId: string) {
  const session = await auth()
  if (!session?.user) return { error: "未登录" }

  const order = await db.order.findUnique({
    where: { id: orderId },
    include: { applications: { where: { status: "ACCEPTED" } } },
  })
  if (!order) return { error: "订单不存在" }
  if (order.authorId !== session.user.id) return { error: "无权操作" }
  if (order.status !== "IN_PROGRESS") return { error: "仅进行中的订单可标记完成" }

  await db.order.update({ where: { id: orderId }, data: { status: "COMPLETED" } })

  for (const app of order.applications) {
    await awardPoints(app.applicantId, 100, "完成订单")
  }

  revalidatePath("/dashboard/orders")
  return { success: true }
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npx jest src/__tests__/actions/orders.test.ts --no-coverage
```

Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/actions/orders.ts src/__tests__/actions/orders.test.ts
git commit -m "feat: add order server actions with role guards and point awards"
```

---

## Task 4: Application Server Actions

**Files:**
- Create: `src/actions/applications.ts`
- Create: `src/__tests__/actions/applications.test.ts`

- [ ] **Step 1: Write failing tests**

```typescript
// src/__tests__/actions/applications.test.ts
import { applyToOrder, acceptApplication } from "@/actions/applications"
import { db } from "@/lib/db"
import { auth } from "@/auth"

jest.mock("@/lib/db", () => ({
  db: {
    order: { findUnique: jest.fn() },
    orderApplication: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
  },
}))
jest.mock("@/auth", () => ({ auth: jest.fn() }))
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }))

const mockAuth = auth as jest.Mock

describe("applyToOrder", () => {
  it("returns error when already applied", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "OPC" } })
    ;(db.order.findUnique as jest.Mock).mockResolvedValue({ id: "o1", status: "RECRUITING", authorId: "u2" })
    ;(db.orderApplication.findUnique as jest.Mock).mockResolvedValue({ id: "a1" })
    const result = await applyToOrder("o1", "理由")
    expect(result?.error).toBe("已报名该订单")
  })

  it("returns error when applying to own order", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1", role: "OPC" } })
    ;(db.order.findUnique as jest.Mock).mockResolvedValue({ id: "o1", status: "RECRUITING", authorId: "u1" })
    ;(db.orderApplication.findUnique as jest.Mock).mockResolvedValue(null)
    const result = await applyToOrder("o1", "理由")
    expect(result?.error).toBe("不能报名自己发布的订单")
  })
})

describe("acceptApplication", () => {
  it("returns error when not the order author", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u2", role: "BIZ_OPC" } })
    ;(db.orderApplication.findUnique as jest.Mock).mockResolvedValue({
      id: "a1",
      order: { authorId: "u1", status: "RECRUITING" },
    })
    const result = await acceptApplication("a1")
    expect(result?.error).toBe("无权操作")
  })
})
```

- [ ] **Step 2: Run to confirm fail**

```bash
npx jest src/__tests__/actions/applications.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/actions/applications'`

- [ ] **Step 3: Create `src/actions/applications.ts`**

```typescript
// src/actions/applications.ts
"use server"

import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function applyToOrder(orderId: string, reason: string) {
  const session = await auth()
  if (!session?.user) return { error: "未登录" }

  const order = await db.order.findUnique({ where: { id: orderId } })
  if (!order) return { error: "订单不存在" }
  if (order.status !== "RECRUITING") return { error: "该订单不在招募中" }
  if (order.authorId === session.user.id) return { error: "不能报名自己发布的订单" }

  const existing = await db.orderApplication.findUnique({
    where: { orderId_applicantId: { orderId, applicantId: session.user.id } },
  })
  if (existing) return { error: "已报名该订单" }

  if (!reason.trim()) return { error: "请填写报名理由" }

  await db.orderApplication.create({
    data: { orderId, applicantId: session.user.id, reason: reason.trim() },
  })

  revalidatePath(`/orders/${orderId}`)
  return { success: true }
}

export async function acceptApplication(applicationId: string) {
  const session = await auth()
  if (!session?.user) return { error: "未登录" }

  const app = await db.orderApplication.findUnique({
    where: { id: applicationId },
    include: { order: true },
  })
  if (!app) return { error: "报名记录不存在" }
  if (app.order.authorId !== session.user.id) return { error: "无权操作" }
  if (app.order.status !== "RECRUITING") return { error: "订单已不在招募中" }

  await Promise.all([
    db.orderApplication.update({ where: { id: applicationId }, data: { status: "ACCEPTED" } }),
    db.order.update({ where: { id: app.orderId }, data: { status: "IN_PROGRESS" } }),
  ])

  revalidatePath(`/orders/${app.orderId}`)
  return { success: true }
}

export async function rejectApplication(applicationId: string) {
  const session = await auth()
  if (!session?.user) return { error: "未登录" }

  const app = await db.orderApplication.findUnique({
    where: { id: applicationId },
    include: { order: true },
  })
  if (!app) return { error: "报名记录不存在" }
  if (app.order.authorId !== session.user.id) return { error: "无权操作" }

  await db.orderApplication.update({ where: { id: applicationId }, data: { status: "REJECTED" } })
  revalidatePath(`/orders/${app.orderId}`)
  return { success: true }
}
```

- [ ] **Step 4: Run tests to confirm pass**

```bash
npx jest src/__tests__/actions/applications.test.ts --no-coverage
```

Expected: PASS — 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/actions/applications.ts src/__tests__/actions/applications.test.ts
git commit -m "feat: add application server actions (apply, accept, reject)"
```

---

## Task 5: OrderCard + OrderFilters Components

**Files:**
- Create: `src/components/orders/OrderCard.tsx`
- Create: `src/components/orders/OrderFilters.tsx`

- [ ] **Step 1: Create `src/components/orders/OrderCard.tsx`**

```typescript
// src/components/orders/OrderCard.tsx
import Link from "next/link"
import { OrderStatus } from "@prisma/client"

const STATUS_LABELS: Record<OrderStatus, { label: string; color: string }> = {
  DRAFT:          { label: "草稿",   color: "bg-gray-100 text-gray-600" },
  PENDING_REVIEW: { label: "待审核", color: "bg-amber-100 text-amber-700" },
  RECRUITING:     { label: "招募中", color: "bg-green-100 text-green-700" },
  IN_PROGRESS:    { label: "进行中", color: "bg-blue-100 text-blue-700" },
  COMPLETED:      { label: "已完成", color: "bg-slate-100 text-slate-600" },
  REJECTED:       { label: "已拒绝", color: "bg-red-100 text-red-700" },
  CLOSED:         { label: "已关闭", color: "bg-gray-100 text-gray-500" },
}

interface OrderCardProps {
  id: string
  title: string
  authorName: string | null
  authorId: string
  amount: number
  category: string
  tags: string[]
  applicationCount: number
  deadline: Date | null
  status: OrderStatus
}

export function OrderCard({ id, title, authorName, authorId, amount, category, tags, applicationCount, deadline, status }: OrderCardProps) {
  const { label, color } = STATUS_LABELS[status]

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 hover:border-indigo-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/orders/${id}`} className="font-semibold text-slate-900 hover:text-indigo-600 line-clamp-1">
              {title}
            </Link>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{label}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <span key={tag} className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{tag}</span>
            ))}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-lg font-bold text-slate-900">¥{amount.toLocaleString("zh-CN")}</div>
          <div className="text-xs text-slate-500">{category}</div>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
        <Link href={`/profile/${authorId}`} className="hover:text-indigo-600">{authorName ?? "匿名"}</Link>
        <span>{applicationCount} 人报名</span>
        {deadline && <span>截止 {new Date(deadline).toLocaleDateString("zh-CN")}</span>}
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Create `src/components/orders/OrderFilters.tsx`**

```typescript
// src/components/orders/OrderFilters.tsx
"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useCallback } from "react"

const TAGS = ["AI开发", "内容创作", "财税咨询", "设计", "运营", "法律", "其他"]
const CATEGORIES = ["互联网", "电商", "教育", "金融", "医疗", "制造", "其他行业"]
const AMOUNT_RANGES = [
  { label: "1万以下", value: "0-10000" },
  { label: "1–5万",  value: "10000-50000" },
  { label: "5–10万", value: "50000-100000" },
  { label: "10万以上", value: "100000-" },
]

export function OrderFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const setParam = useCallback((key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === null || value === "") {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    params.delete("page")
    router.push(`${pathname}?${params.toString()}`)
  }, [router, pathname, searchParams])

  const activeTag = searchParams.get("tag") ?? ""
  const activeCategory = searchParams.get("category") ?? ""
  const activeAmount = searchParams.get("amount") ?? ""

  return (
    <aside className="w-full lg:w-56 shrink-0">
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">能力标签</p>
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setParam("tag", activeTag === tag ? null : tag)}
                className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                  activeTag === tag ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-indigo-50"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">行业分类</p>
          <div className="space-y-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setParam("category", activeCategory === cat ? null : cat)}
                className={`block w-full rounded px-3 py-1.5 text-left text-sm transition-colors ${
                  activeCategory === cat ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">金额范围</p>
          <div className="space-y-1">
            {AMOUNT_RANGES.map((r) => (
              <button
                key={r.value}
                onClick={() => setParam("amount", activeAmount === r.value ? null : r.value)}
                className={`block w-full rounded px-3 py-1.5 text-left text-sm transition-colors ${
                  activeAmount === r.value ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/orders/
git commit -m "feat: add OrderCard and OrderFilters components"
```

---

## Task 6: Orders Marketplace Page (`/orders`)

**Files:**
- Modify: `src/app/orders/page.tsx`

- [ ] **Step 1: Replace stub with full marketplace page**

```typescript
// src/app/orders/page.tsx
import { Suspense } from "react"
import Link from "next/link"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { OrderCard } from "@/components/orders/OrderCard"
import { OrderFilters } from "@/components/orders/OrderFilters"

interface SearchParams { tag?: string; category?: string; amount?: string; sort?: string; q?: string }

async function OrderList({ searchParams }: { searchParams: SearchParams }) {
  const { tag, category, amount, sort, q } = searchParams

  const amountFilter: { gte?: number; lte?: number } = {}
  if (amount) {
    const [min, max] = amount.split("-")
    if (min) amountFilter.gte = parseFloat(min)
    if (max) amountFilter.lte = parseFloat(max)
  }

  const orders = await db.order.findMany({
    where: {
      status: "RECRUITING",
      ...(tag ? { tags: { has: tag } } : {}),
      ...(category ? { category } : {}),
      ...(amount ? { amount: amountFilter } : {}),
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
    },
    include: { author: { select: { id: true, name: true } }, _count: { select: { applications: true } } },
    orderBy: sort === "amount" ? { amount: "desc" } : sort === "applications" ? { applications: { _count: "asc" } } : { createdAt: "desc" },
  })

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center text-slate-500">
        暂无符合条件的订单
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map((o) => (
        <OrderCard
          key={o.id}
          id={o.id}
          title={o.title}
          authorName={o.author.name}
          authorId={o.author.id}
          amount={Number(o.amount)}
          category={o.category}
          tags={o.tags}
          applicationCount={o._count.applications}
          deadline={o.deadline}
          status={o.status}
        />
      ))}
    </div>
  )
}

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth()
  const sp = await searchParams

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">订单广场</h1>
        {session?.user.role === "BIZ_OPC" && (
          <Link href="/orders/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            发布订单
          </Link>
        )}
      </div>

      {/* Search + Sort bar */}
      <form className="mb-6 flex gap-3">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="搜索订单标题..."
          className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
        />
        <select
          name="sort"
          defaultValue={sp.sort ?? ""}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">最新发布</option>
          <option value="amount">金额最高</option>
          <option value="applications">报名最少</option>
        </select>
        <button type="submit" className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
          搜索
        </button>
      </form>

      <div className="flex gap-6 items-start">
        <Suspense fallback={null}>
          <OrderFilters />
        </Suspense>
        <div className="flex-1 min-w-0">
          <Suspense fallback={<div className="text-slate-500 text-sm">加载中...</div>}>
            <OrderList searchParams={sp} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/orders/page.tsx
git commit -m "feat: build orders marketplace with filtering and search"
```

---

## Task 7: New Order Form (`/orders/new`)

**Files:**
- Modify: `src/app/orders/new/page.tsx`

- [ ] **Step 1: Replace stub with full form**

```typescript
// src/app/orders/new/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createOrder } from "@/actions/orders"

const TAGS = ["AI开发", "内容创作", "财税咨询", "设计", "运营", "法律", "其他"]
const CATEGORIES = ["互联网", "电商", "教育", "金融", "医疗", "制造", "其他行业"]

export default function NewOrderPage() {
  const router = useRouter()
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev
    )
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    selectedTags.forEach((t) => fd.append("tags", t))
    const result = await createOrder(fd)
    setPending(false)
    if (result?.error) { setError(result.error); return }
    router.push("/dashboard/orders")
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">发布订单</h1>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">标题 *</label>
          <input name="title" required maxLength={80} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" placeholder="简短描述需求" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">详细描述 *</label>
          <textarea name="description" required rows={6} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 resize-none" placeholder="详细说明需求背景、交付标准和时间要求" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">行业分类 *</label>
            <select name="category" required className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none">
              <option value="">请选择</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">预算金额（元）*</label>
            <input name="amount" type="number" min="1" required className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" placeholder="0" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">截止日期</label>
          <input name="deadline" type="date" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">OPC 能力标签（最多5个）</label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <button
                type="button"
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                  selectedTags.includes(tag) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-indigo-50"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {pending ? "提交中..." : "提交审核"}
        </button>
        <p className="text-xs text-center text-slate-500">提交后进入审核队列，管理员通过后对外公开</p>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/orders/new/page.tsx
git commit -m "feat: add new order form with tag selection"
```

---

## Task 8: Order Detail Page (`/orders/[id]`)

**Files:**
- Create: `src/app/orders/[id]/page.tsx`
- Create: `src/components/orders/ApplyForm.tsx`
- Create: `src/components/orders/ApplicationList.tsx`

- [ ] **Step 1: Create `src/components/orders/ApplyForm.tsx`**

```typescript
// src/components/orders/ApplyForm.tsx
"use client"

import { useState } from "react"
import { applyToOrder } from "@/actions/applications"

export function ApplyForm({ orderId }: { orderId: string }) {
  const [reason, setReason] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [pending, setPending] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError("")
    const result = await applyToOrder(orderId, reason)
    setPending(false)
    if (result?.error) { setError(result.error); return }
    setSuccess(true)
  }

  if (success) {
    return <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-700">报名成功！等待发布方审核。</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={4}
        maxLength={300}
        placeholder="简述您的相关经验和优势（最多300字）"
        className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm resize-none focus:outline-none focus:border-indigo-500"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-slate-400">{reason.length}/300</span>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <button
        type="submit"
        disabled={pending || !reason.trim()}
        className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {pending ? "提交中..." : "提交报名"}
      </button>
    </form>
  )
}
```

- [ ] **Step 2: Create `src/components/orders/ApplicationList.tsx`**

```typescript
// src/components/orders/ApplicationList.tsx
"use client"

import Link from "next/link"
import { acceptApplication, rejectApplication } from "@/actions/applications"
import { ApplicationStatus } from "@prisma/client"

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  PENDING: "待处理",
  ACCEPTED: "已接受",
  REJECTED: "已拒绝",
}

interface Application {
  id: string
  reason: string
  status: ApplicationStatus
  createdAt: Date
  applicant: { id: string; name: string | null; points: number }
}

export function ApplicationList({ applications, isAuthor }: { applications: Application[]; isAuthor: boolean }) {
  if (applications.length === 0) {
    return <p className="text-sm text-slate-500">暂无报名</p>
  }

  return (
    <div className="space-y-3">
      {applications.map((app) => (
        <div key={app.id} className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <Link href={`/profile/${app.applicant.id}`} className="font-medium text-slate-900 hover:text-indigo-600 text-sm">
                  {app.applicant.name ?? "匿名"}
                </Link>
                <span className="text-xs text-slate-400">{app.applicant.points} 积分</span>
                <span className="text-xs text-slate-500">{STATUS_LABELS[app.status]}</span>
              </div>
              <p className="mt-1 text-sm text-slate-600 line-clamp-3">{app.reason}</p>
            </div>
            {isAuthor && app.status === "PENDING" && (
              <div className="flex gap-2 shrink-0">
                <form action={acceptApplication.bind(null, app.id)}>
                  <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">接受</button>
                </form>
                <form action={rejectApplication.bind(null, app.id)}>
                  <button className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50">拒绝</button>
                </form>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/app/orders/[id]/page.tsx`**

```typescript
// src/app/orders/[id]/page.tsx
import { notFound } from "next/navigation"
import Link from "next/link"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { ApplyForm } from "@/components/orders/ApplyForm"
import { ApplicationList } from "@/components/orders/ApplicationList"
import { closeOrder, completeOrder } from "@/actions/orders"

const STATUS_LABELS: Record<string, string> = {
  DRAFT: "草稿", PENDING_REVIEW: "待审核", RECRUITING: "招募中",
  IN_PROGRESS: "进行中", COMPLETED: "已完成", REJECTED: "已拒绝", CLOSED: "已关闭",
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params
  const session = await auth()

  const order = await db.order.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, name: true, email: true } },
      applications: {
        include: { applicant: { select: { id: true, name: true, points: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  })

  if (!order) notFound()

  const isAuthor = session?.user.id === order.authorId
  const hasApplied = session ? order.applications.some((a) => a.applicantId === session.user.id) : false
  const canApply = session && !isAuthor && order.status === "RECRUITING" && !hasApplied

  const myApplication = session ? order.applications.find((a) => a.applicantId === session.user.id) : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main content */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl font-bold text-slate-900">{order.title}</h1>
              <span className="shrink-0 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
                {STATUS_LABELS[order.status]}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {order.tags.map((tag) => (
                <span key={tag} className="rounded bg-indigo-50 px-2 py-0.5 text-xs text-indigo-700">{tag}</span>
              ))}
            </div>

            <div className="mt-4 prose prose-sm max-w-none text-slate-600 whitespace-pre-wrap">
              {order.description}
            </div>
          </div>

          {/* Applications section */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="font-semibold text-slate-900 mb-4">
              {isAuthor ? `报名列表（${order.applications.length}）` : "报名"}
            </h2>

            {canApply && <ApplyForm orderId={order.id} />}
            {myApplication && !isAuthor && (
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-700">
                您已报名，当前状态：{myApplication.status === "PENDING" ? "待审核" : myApplication.status === "ACCEPTED" ? "已接受" : "已拒绝"}
              </div>
            )}
            {!session && order.status === "RECRUITING" && (
              <Link href="/login" className="block text-center rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">
                登录后报名
              </Link>
            )}
            {isAuthor && (
              <ApplicationList applications={order.applications} isAuthor={true} />
            )}
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="text-2xl font-bold text-slate-900">¥{Number(order.amount).toLocaleString("zh-CN")}</div>
            <div className="mt-1 text-sm text-slate-500">{order.category}</div>
            {order.deadline && (
              <div className="mt-2 text-sm text-slate-500">
                截止：{new Date(order.deadline).toLocaleDateString("zh-CN")}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">发布方</p>
            <Link href={`/profile/${order.author.id}`} className="font-medium text-slate-900 hover:text-indigo-600">
              {order.author.name ?? order.author.email ?? "匿名"}
            </Link>
          </div>

          {isAuthor && (
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">操作</p>
              {["DRAFT", "PENDING_REVIEW", "REJECTED"].includes(order.status) && (
                <Link href={`/orders/${order.id}/edit`} className="block text-center rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  编辑订单
                </Link>
              )}
              {["RECRUITING", "PENDING_REVIEW"].includes(order.status) && (
                <form action={closeOrder.bind(null, order.id)}>
                  <button className="w-full rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                    关闭订单
                  </button>
                </form>
              )}
              {order.status === "IN_PROGRESS" && (
                <form action={completeOrder.bind(null, order.id)}>
                  <button className="w-full rounded-lg bg-emerald-600 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                    标记完成
                  </button>
                </form>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/orders/[id]/ src/components/orders/ApplyForm.tsx src/components/orders/ApplicationList.tsx
git commit -m "feat: add order detail page with apply form and application management"
```

---

## Task 9: My Orders Dashboard + Edit Page

**Files:**
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/app/dashboard/orders/page.tsx`
- Create: `src/app/orders/[id]/edit/page.tsx`

- [ ] **Step 1: Create `src/app/dashboard/layout.tsx`**

```typescript
// src/app/dashboard/layout.tsx
import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login?callbackUrl=/dashboard/orders")
  return <>{children}</>
}
```

- [ ] **Step 2: Create `src/app/dashboard/orders/page.tsx`**

```typescript
// src/app/dashboard/orders/page.tsx
import Link from "next/link"
import { auth } from "@/auth"
import { db } from "@/lib/db"
import { OrderCard } from "@/components/orders/OrderCard"

export default async function MyOrdersPage() {
  const session = await auth()
  const userId = session!.user.id

  const [published, applied] = await Promise.all([
    db.order.findMany({
      where: { authorId: userId },
      include: { _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
    }),
    db.orderApplication.findMany({
      where: { applicantId: userId },
      include: {
        order: {
          include: {
            author: { select: { id: true, name: true } },
            _count: { select: { applications: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ])

  const STATUS_CN: Record<string, string> = {
    PENDING: "待审核", ACCEPTED: "已接受", REJECTED: "已拒绝",
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">我的订单</h1>
        {session!.user.role === "BIZ_OPC" && (
          <Link href="/orders/new" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            发布新订单
          </Link>
        )}
      </div>

      {/* Published orders */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-slate-700 mb-3">我发布的（{published.length}）</h2>
        {published.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
            还没有发布过订单
          </div>
        ) : (
          <div className="space-y-3">
            {published.map((o) => (
              <OrderCard
                key={o.id}
                id={o.id}
                title={o.title}
                authorName={session!.user.name ?? null}
                authorId={userId}
                amount={Number(o.amount)}
                category={o.category}
                tags={o.tags}
                applicationCount={o._count.applications}
                deadline={o.deadline}
                status={o.status}
              />
            ))}
          </div>
        )}
      </section>

      {/* Applied orders */}
      <section>
        <h2 className="text-base font-semibold text-slate-700 mb-3">我报名的（{applied.length}）</h2>
        {applied.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-slate-500 text-sm">
            还没有报名过订单
          </div>
        ) : (
          <div className="space-y-3">
            {applied.map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <OrderCard
                    id={a.order.id}
                    title={a.order.title}
                    authorName={a.order.author.name}
                    authorId={a.order.author.id}
                    amount={Number(a.order.amount)}
                    category={a.order.category}
                    tags={a.order.tags}
                    applicationCount={a.order._count.applications}
                    deadline={a.order.deadline}
                    status={a.order.status}
                  />
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  {STATUS_CN[a.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/app/orders/[id]/edit/page.tsx`**

```typescript
// src/app/orders/[id]/edit/page.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { updateOrder } from "@/actions/orders"

const TAGS = ["AI开发", "内容创作", "财税咨询", "设计", "运营", "法律", "其他"]
const CATEGORIES = ["互联网", "电商", "教育", "金融", "医疗", "制造", "其他行业"]

export default function EditOrderPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [order, setOrder] = useState<{ title: string; description: string; category: string; amount: number; deadline: string; tags: string[] } | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [error, setError] = useState("")
  const [pending, setPending] = useState(false)

  useEffect(() => {
    fetch(`/api/orders/${params.id}`).then((r) => r.json()).then((data) => {
      setOrder(data)
      setSelectedTags(data.tags ?? [])
    })
  }, [params.id])

  function toggleTag(tag: string) {
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 5 ? [...prev, tag] : prev)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setPending(true)
    setError("")
    const fd = new FormData(e.currentTarget)
    selectedTags.forEach((t) => fd.append("tags", t))
    const result = await updateOrder(params.id, fd)
    setPending(false)
    if (result?.error) { setError(result.error); return }
    router.push(`/orders/${params.id}`)
  }

  if (!order) return <div className="flex min-h-[60vh] items-center justify-center text-slate-500">加载中...</div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">编辑订单</h1>
      <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border border-slate-200 bg-white p-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">标题 *</label>
          <input name="title" required maxLength={80} defaultValue={order.title} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">详细描述 *</label>
          <textarea name="description" required rows={6} defaultValue={order.description} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 resize-none" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">行业分类 *</label>
            <select name="category" required defaultValue={order.category} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm">
              <option value="">请选择</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">预算金额（元）*</label>
            <input name="amount" type="number" min="1" required defaultValue={order.amount} className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">截止日期</label>
          <input name="deadline" type="date" defaultValue={order.deadline?.split("T")[0] ?? ""} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">能力标签（最多5个）</label>
          <div className="flex flex-wrap gap-2">
            {TAGS.map((tag) => (
              <button type="button" key={tag} onClick={() => toggleTag(tag)}
                className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${selectedTags.includes(tag) ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-indigo-50"}`}>
                {tag}
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={pending} className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
          {pending ? "保存中..." : "保存并重新提交审核"}
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Create `/api/orders/[id]` route for the edit page fetch**

```typescript
// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "未登录" }, { status: 401 })
  const { id } = await params
  const order = await db.order.findUnique({ where: { id } })
  if (!order || order.authorId !== session.user.id) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ ...order, amount: Number(order.amount) })
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/dashboard/ src/app/orders/[id]/edit/ src/app/api/orders/
git commit -m "feat: add my orders dashboard and edit order page"
```

---

## Task 10: Final Check

- [ ] **Step 1: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 2: Start dev server and verify**

```bash
bun dev
```

Check:
- `/orders` — shows marketplace with filters (empty if no data)
- `/orders/new` — form renders, requires BIZ_OPC role
- `/dashboard/orders` — shows two tabs, requires login
- Admin `/admin` — order approval still works

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete order system (Plan 2)"
```
