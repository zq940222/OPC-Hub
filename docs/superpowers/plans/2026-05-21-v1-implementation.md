# OPC Hub v1.0.0 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build the confirmed v1.0.0 scope from `docs/superpowers/specs/2026-05-21-opc-hub-v1-design.md`: order marketplace, OPC company profiles, community, tools/services pages, and admin management.

**Architecture:** Keep the existing Next.js App Router application. Use Server Components for data-loaded pages, small Client Components only for tabs/forms/dropdowns, and Server Actions for all mutations with authorization inside every action. Prisma remains the source of truth; admin accounts stay in the existing `Admin` / `AdminSubAccount` models rather than being merged into frontend `User`.

**Tech Stack:** Next.js 16.2.6 App Router, React 19, Prisma 7.8, PostgreSQL, NextAuth v5, Tailwind CSS 4, Jest 30, lucide-react.

---

## Implementation Notes

- Read these local Next.js docs before editing related code:
  - `node_modules/next/dist/docs/01-app/01-getting-started/03-layouts-and-pages.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/07-mutating-data.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md`
  - `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`
- In Next 16, `params` and `searchParams` page props are promises. Use `PageProps<'/orders/[id]'>` or explicitly type `params: Promise<{ id: string }>` and `await` them.
- `middleware` is now called Proxy. This repo correctly has `src/proxy.ts`; extend it for banned-user checks rather than creating `middleware.ts`.
- Route Handlers live in `app/**/route.ts`; do not create a `route.ts` next to a `page.tsx` in the same segment.
- Server Actions are directly reachable by POST. Every action must authenticate and authorize internally.
- Current state: `/orders`, `/orders/new`, `/tools`, `/community`, `/finance`, `/legal`, `/banking`, `/equipment` are mostly placeholders. `/admin` already has order review and sub-admin creation, but sub-admin permissions need to move from `{ modules: [...] }` to the spec's boolean shape.

---

## File Map

```text
prisma/schema.prisma
prisma/seed.ts

src/lib/
  constants.ts
  points.ts
  permissions.ts
  profile.ts

src/actions/
  orders.ts
  applications.ts
  profile.ts
  follow.ts
  community.ts
  messages.ts
  admin-users.ts
  admin-content.ts
  admin-tools.ts

src/components/layout/
  AppChrome.tsx
  UserMenu.tsx

src/components/orders/
  OrderCard.tsx
  OrderFilters.tsx
  OrderForm.tsx
  ApplyForm.tsx
  ApplicationList.tsx
  MyOrdersTabs.tsx

src/components/profile/
  FollowButton.tsx
  ProfileTabs.tsx
  ProfileForm.tsx

src/components/community/
  BoardGrid.tsx
  PostCard.tsx
  PostForm.tsx
  CommentForm.tsx
  LikeButton.tsx
  ReportButton.tsx
  MessageThread.tsx

src/components/tools/
  ToolGrid.tsx
  ToolCategoryTabs.tsx

src/components/services/
  ServicePage.tsx

src/app/
  orders/page.tsx
  orders/new/page.tsx
  orders/[id]/page.tsx
  orders/[id]/edit/page.tsx
  dashboard/orders/page.tsx
  profile/[userId]/page.tsx
  settings/profile/page.tsx
  community/page.tsx
  community/[boardSlug]/page.tsx
  community/post/new/page.tsx
  community/post/[id]/page.tsx
  community/messages/page.tsx
  community/messages/[userId]/page.tsx
  tools/page.tsx
  finance/page.tsx
  legal/page.tsx
  banking/page.tsx
  equipment/page.tsx
  admin/page.tsx

src/__tests__/
  lib/points.test.ts
  actions/orders.test.ts
  actions/applications.test.ts
  actions/profile.test.ts
  actions/community.test.ts
  actions/admin-users.test.ts
  actions/admin-tools.test.ts
```

---

## Task 1: Schema Expansion

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`

**Step 1: Add schema fields and models**

Update `User`, `Order`, and `Post` relations, then add `OpcProfile`, `Tool`, `PostLike`, and `Report`.

```prisma
model User {
  id            String    @id @default(cuid())
  phone         String?   @unique
  email         String?   @unique
  emailVerified DateTime?
  password      String?
  name          String?
  image         String?
  role          Role      @default(OPC)
  points        Int       @default(0)
  banned        Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts         Account[]
  sessions         Session[]
  orders           Order[]
  applications     OrderApplication[]
  posts            Post[]
  comments         Comment[]
  sentMessages     Message[]          @relation("SentMessages")
  receivedMessages Message[]          @relation("ReceivedMessages")
  pointLogs        PointLog[]
  following        Follow[]           @relation("Following")
  followers        Follow[]           @relation("Followers")
  opcProfile       OpcProfile?
  postLikes        PostLike[]
  reports          Report[]           @relation("ReporterReports")
}

model Order {
  id           String      @id @default(cuid())
  title        String
  description  String      @db.Text
  amount       Decimal     @db.Decimal(12, 2)
  category     String
  tags         String[]
  contact      String?
  status       OrderStatus @default(DRAFT)
  deadline     DateTime?
  authorId     String
  rejectReason String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  author       User               @relation(fields: [authorId], references: [id])
  applications OrderApplication[]

  @@index([status, createdAt])
  @@index([category])
}

model OpcProfile {
  id        String   @id @default(cuid())
  userId    String   @unique
  bio       String?  @db.Text
  skills    String[]
  website   String?
  location  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Tool {
  id          String   @id @default(cuid())
  name        String
  description String
  category    String
  url         String
  iconUrl     String?
  embedable   Boolean  @default(false)
  order       Int      @default(0)
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([category, active, order])
}

model Post {
  id         String   @id @default(cuid())
  title      String
  content    String   @db.Text
  boardId    String
  authorId   String
  isPinned   Boolean  @default(false)
  isFeatured Boolean  @default(false)
  viewCount  Int      @default(0)
  likeCount  Int      @default(0)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  board    Board      @relation(fields: [boardId], references: [id])
  author   User       @relation(fields: [authorId], references: [id])
  comments Comment[]
  likes    PostLike[]

  @@index([boardId, isPinned, createdAt])
}

model PostLike {
  userId    String
  postId    String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@id([userId, postId])
}

model Report {
  id         String   @id @default(cuid())
  reporterId String
  targetType String
  targetId   String
  reason     String
  resolved   Boolean  @default(false)
  createdAt  DateTime @default(now())

  reporter User @relation("ReporterReports", fields: [reporterId], references: [id])

  @@index([resolved, createdAt])
  @@index([targetType, targetId])
}
```

**Step 2: Run schema validation**

```bash
npx prisma validate
```

Expected: schema validates.

**Step 3: Create migration**

```bash
npx prisma migrate dev --name v1-profile-tools-community
```

Expected: migration folder is created and Prisma Client is regenerated.

**Step 4: Seed boards and tools**

Update `prisma/seed.ts` to upsert the seven community boards and initial tools by category.

```typescript
const boards = [
  ["平台公告", "announcements"],
  ["AI 工具探讨", "ai-tools"],
  ["接单经验", "order-tips"],
  ["税务法务", "tax-legal"],
  ["经验分享", "experience"],
  ["问答互助", "qa"],
  ["闲聊灌水", "casual"],
] as const;
```

**Step 5: Verify seed**

```bash
bun prisma/seed.ts
```

Expected: no duplicate rows; boards and tools are upserted.

**Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/seed.ts prisma/migrations
git commit -m "feat: add v1 data models"
```

---

## Task 2: Shared Constants, Points, and Permissions

**Files:**
- Create: `src/lib/constants.ts`
- Create: `src/lib/points.ts`
- Create: `src/lib/permissions.ts`
- Create: `src/__tests__/lib/points.test.ts`

**Step 1: Add constants**

```typescript
export const ORDER_TAGS = ["AI开发", "内容创作", "财税咨询", "设计", "运营", "法律", "其他"] as const;
export const PROFILE_SKILL_LIMIT = 8;
export const ORDER_TAG_LIMIT = 5;

export const TOOL_CATEGORIES = ["AI工具", "协作办公", "财税记账", "合同法务", "设计创意"] as const;

export const ADMIN_PERMISSION_KEYS = ["users", "orders", "content", "tools", "announcements"] as const;
```

**Step 2: Write failing point tests**

```typescript
import { awardPoints } from "@/lib/points";
import { db } from "@/lib/db";

jest.mock("@/lib/db", () => ({
  db: {
    $transaction: jest.fn((ops) => Promise.all(ops)),
    user: { update: jest.fn() },
    pointLog: { create: jest.fn() },
  },
}));

it("increments user points and writes PointLog", async () => {
  await awardPoints("u1", 10, "发帖");

  expect(db.user.update).toHaveBeenCalledWith({
    where: { id: "u1" },
    data: { points: { increment: 10 } },
  });
  expect(db.pointLog.create).toHaveBeenCalledWith({
    data: { userId: "u1", delta: 10, reason: "发帖" },
  });
});
```

**Step 3: Run failing test**

```bash
npx jest src/__tests__/lib/points.test.ts --no-coverage
```

Expected: fails because `src/lib/points.ts` does not exist.

**Step 4: Implement helper**

```typescript
import "server-only";
import { db } from "@/lib/db";

export async function awardPoints(userId: string, delta: number, reason: string) {
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { points: { increment: delta } },
    }),
    db.pointLog.create({
      data: { userId, delta, reason },
    }),
  ]);
}
```

**Step 5: Implement admin permission helper**

```typescript
import type { AdminRole } from "@prisma/client";

export type AdminPermissions = {
  users: boolean;
  orders: boolean;
  content: boolean;
  tools: boolean;
  announcements: boolean;
};

export const FULL_ADMIN_PERMISSIONS: AdminPermissions = {
  users: true,
  orders: true,
  content: true,
  tools: true,
  announcements: true,
};

export function hasAdminPermission(
  role: AdminRole,
  rawPermissions: unknown,
  key: keyof AdminPermissions,
) {
  if (role === "ADMIN") return true;
  const permissions = rawPermissions as Partial<AdminPermissions> | null;
  return permissions?.[key] === true;
}
```

**Step 6: Run tests**

```bash
npx jest src/__tests__/lib/points.test.ts --no-coverage
```

Expected: pass.

**Step 7: Commit**

```bash
git add src/lib/constants.ts src/lib/points.ts src/lib/permissions.ts src/__tests__/lib/points.test.ts
git commit -m "feat: add shared v1 constants and points helper"
```

---

## Task 3: Order Marketplace and State Machine

**Files:**
- Create: `src/actions/orders.ts`
- Create: `src/actions/applications.ts`
- Create: `src/components/orders/OrderCard.tsx`
- Create: `src/components/orders/OrderFilters.tsx`
- Create: `src/components/orders/OrderForm.tsx`
- Create: `src/components/orders/ApplyForm.tsx`
- Create: `src/components/orders/ApplicationList.tsx`
- Create: `src/components/orders/MyOrdersTabs.tsx`
- Modify: `src/app/orders/page.tsx`
- Modify: `src/app/orders/new/page.tsx`
- Create: `src/app/orders/[id]/page.tsx`
- Create: `src/app/orders/[id]/edit/page.tsx`
- Create: `src/app/dashboard/orders/page.tsx`
- Create: `src/__tests__/actions/orders.test.ts`
- Create: `src/__tests__/actions/applications.test.ts`

**Step 1: Write failing tests for role and state guards**

Test cases:
- `createOrder` rejects unauthenticated users.
- `createOrder` rejects `OPC` users and allows only `BIZ_OPC`.
- `createOrder` trims tags to known tags and max 5.
- `applyToOrder` rejects own order, non-recruiting order, duplicate application, and reason over 300 chars.
- `acceptApplication` requires the order author and transitions order to `IN_PROGRESS`.
- `completeOrder` requires author, requires `IN_PROGRESS`, sets `COMPLETED`, and awards +100 to accepted applicant.

**Step 2: Run failing tests**

```bash
npx jest src/__tests__/actions/orders.test.ts src/__tests__/actions/applications.test.ts --no-coverage
```

Expected: fail because actions do not exist.

**Step 3: Implement `src/actions/orders.ts`**

Use `"use server"`, `auth()`, `db`, `revalidatePath`, and `awardPoints`. Required exported actions:

```typescript
export async function createOrder(_state: OrderActionState, formData: FormData): Promise<OrderActionState>;
export async function updateOrder(orderId: string, _state: OrderActionState, formData: FormData): Promise<OrderActionState>;
export async function closeOrder(orderId: string): Promise<OrderActionState>;
export async function completeOrder(orderId: string): Promise<OrderActionState>;
```

Implementation rules:
- Validate `session.user.role === "BIZ_OPC"` for creating orders.
- Store new submissions as `PENDING_REVIEW`.
- Permit editing only when author owns the order and status is `DRAFT`, `PENDING_REVIEW`, or `REJECTED`.
- Permit close only from `PENDING_REVIEW` or `RECRUITING`.
- Permit complete only from `IN_PROGRESS`.
- Call `revalidatePath("/orders")`, `revalidatePath("/dashboard/orders")`, and specific order paths after mutations.

**Step 4: Implement `src/actions/applications.ts`**

Required exported actions:

```typescript
export async function applyToOrder(orderId: string, _state: ApplicationActionState, formData: FormData): Promise<ApplicationActionState>;
export async function acceptApplication(applicationId: string): Promise<ApplicationActionState>;
export async function rejectApplication(applicationId: string): Promise<ApplicationActionState>;
```

Implementation rules:
- Reason is required and max 300 chars.
- `OPC` and `BIZ_OPC` users can apply, but not to their own order.
- Only `RECRUITING` orders accept applications.
- Accepting one application sets that application to `ACCEPTED`, rejects no one automatically, and sets order status to `IN_PROGRESS`.

**Step 5: Replace order placeholder pages**

Use server-side filtering in `src/app/orders/page.tsx`:

```typescript
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // build Prisma where/orderBy from params
}
```

Filters required by spec:
- industry category
- ability tags
- amount range
- deadline range
- status defaulting to `RECRUITING`
- sort by newest, highest amount, fewest applications

**Step 6: Add order detail and edit pages**

Use Next 16 dynamic params:

```typescript
export default async function OrderDetailPage(props: PageProps<"/orders/[id]">) {
  const { id } = await props.params;
}
```

Detail page must show:
- full description, tags, amount, deadline
- author card linking to `/profile/[authorId]`
- apply form or existing application status
- author-only applicant list and actions
- author-only edit/close/complete controls

**Step 7: Add dashboard orders page**

`/dashboard/orders` must show two tabs:
- "我发布的": authored orders, status, action links
- "我报名的": applications with application status

**Step 8: Run tests**

```bash
npx jest src/__tests__/actions/orders.test.ts src/__tests__/actions/applications.test.ts --no-coverage
npx eslint src/actions/orders.ts src/actions/applications.ts src/app/orders src/app/dashboard/orders src/components/orders
```

Expected: tests and lint pass.

**Step 9: Commit**

```bash
git add src/actions/orders.ts src/actions/applications.ts src/components/orders src/app/orders src/app/dashboard/orders src/__tests__/actions/orders.test.ts src/__tests__/actions/applications.test.ts
git commit -m "feat: build order marketplace"
```

---

## Task 4: OPC Company Profiles and Follow System

**Files:**
- Create: `src/actions/profile.ts`
- Create: `src/actions/follow.ts`
- Create: `src/lib/profile.ts`
- Create: `src/components/profile/FollowButton.tsx`
- Create: `src/components/profile/ProfileTabs.tsx`
- Create: `src/components/profile/ProfileForm.tsx`
- Create: `src/app/profile/[userId]/page.tsx`
- Create: `src/app/settings/profile/page.tsx`
- Modify: `src/components/layout/AppChrome.tsx`
- Create: `src/components/layout/UserMenu.tsx`
- Create: `src/__tests__/actions/profile.test.ts`

**Step 1: Write failing profile action tests**

Test cases:
- unauthenticated profile update is rejected.
- bio is capped at 300 chars.
- skills are capped at 8.
- invalid website URL is rejected.
- follow action rejects self-follow and toggles follow rows.

**Step 2: Implement profile action**

```typescript
"use server";

export async function updateProfile(_state: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user) return { error: "请先登录" };

  const bio = String(formData.get("bio") ?? "").trim();
  if (bio.length > 300) return { error: "公司简介最多 300 字" };

  // validate URL, normalize skills, upsert OpcProfile, update User image/name if included
}
```

**Step 3: Implement public profile page**

`/profile/[userId]` requirements:
- left company card: avatar, name, join time, location, skills, points, rank, completed order count, bio, website, follow button, follower/following counts
- right tabs: completed orders, posts, followers/following
- self view shows "编辑主页" link

Ranking rule: count users with `points > currentUser.points`, rank is count + 1.

**Step 4: Implement settings page**

`/settings/profile` requirements:
- textarea bio max 300
- skill picker with custom input max 8
- province/city inputs can be plain selects initially
- website URL
- avatar URL field for v1 implementation; add a TODO in plan execution notes for COS upload once COS credentials and upload policy are available

**Step 5: Replace nav user button with dropdown**

`AppChrome` currently links logged-in users to `/orders`. Replace with `UserMenu` containing:
- 我的主页 -> `/profile/[me]`
- 我的订单 -> `/dashboard/orders`
- 账号设置 -> `/settings/profile`
- 退出登录

Mobile nav should include the same links.

**Step 6: Run tests and lint**

```bash
npx jest src/__tests__/actions/profile.test.ts --no-coverage
npx eslint src/actions/profile.ts src/actions/follow.ts src/app/profile src/app/settings src/components/profile src/components/layout
```

Expected: pass.

**Step 7: Commit**

```bash
git add src/actions/profile.ts src/actions/follow.ts src/lib/profile.ts src/components/profile src/components/layout src/app/profile src/app/settings src/__tests__/actions/profile.test.ts
git commit -m "feat: add OPC company profiles"
```

---

## Task 5: Community Posts, Comments, Likes, Reports, and Messages

**Files:**
- Create: `src/actions/community.ts`
- Create: `src/actions/messages.ts`
- Create: `src/components/community/BoardGrid.tsx`
- Create: `src/components/community/PostCard.tsx`
- Create: `src/components/community/PostForm.tsx`
- Create: `src/components/community/CommentForm.tsx`
- Create: `src/components/community/LikeButton.tsx`
- Create: `src/components/community/ReportButton.tsx`
- Create: `src/components/community/MessageThread.tsx`
- Modify: `src/app/community/page.tsx`
- Create: `src/app/community/[boardSlug]/page.tsx`
- Create: `src/app/community/post/new/page.tsx`
- Create: `src/app/community/post/[id]/page.tsx`
- Modify: `src/app/community/messages/page.tsx`
- Create: `src/app/community/messages/[userId]/page.tsx`
- Create: `src/__tests__/actions/community.test.ts`

**Step 1: Write failing community tests**

Test cases:
- creating a post requires login, valid board, title <= 80, non-empty content, and awards +10.
- commenting requires login, non-empty content, and awards +3.
- liking a post creates `PostLike`, increments `likeCount`, and awards +2 to post author once.
- reporting creates `Report` for target type `POST` or `COMMENT`.
- admin feature action sets `isFeatured` and awards +50.

**Step 2: Implement community actions**

Required exports:

```typescript
export async function createPost(_state: CommunityState, formData: FormData): Promise<CommunityState>;
export async function createComment(postId: string, _state: CommunityState, formData: FormData): Promise<CommunityState>;
export async function likePost(postId: string): Promise<CommunityState>;
export async function reportContent(targetType: "POST" | "COMMENT", targetId: string, _state: CommunityState, formData: FormData): Promise<CommunityState>;
export async function togglePostPinned(postId: string): Promise<CommunityState>;
export async function togglePostFeatured(postId: string): Promise<CommunityState>;
export async function deletePost(postId: string): Promise<CommunityState>;
```

**Step 3: Implement community pages**

Routes:
- `/community`: board entrances plus hot posts
- `/community/[boardSlug]`: pinned posts first, then latest posts
- `/community/post/new`: board select, title, content
- `/community/post/[id]`: full content, like button, comments, report button, admin controls

Use `PageProps<"/community/[boardSlug]">` and `PageProps<"/community/post/[id]">`.

**Step 4: Implement private messages**

Required behavior:
- `/community/messages`: conversations sorted by last message time; show unread dot
- `/community/messages/[userId]`: bubble UI, send form, mark messages from the other user as read on entry
- Use simple 5-second client polling in `MessageThread` by calling a Route Handler only if needed. If a Route Handler is added, use `src/app/api/messages/[userId]/route.ts` and type with `RouteContext<"/api/messages/[userId]">`.

**Step 5: Add unread dot to nav**

In `AppChrome` server wrapper or parent layout data, compute unread count and pass to the client nav if feasible. If current `AppChrome` only receives `user`, add a small `messages` nav link without count first, then add unread count in a follow-up commit.

**Step 6: Run tests and lint**

```bash
npx jest src/__tests__/actions/community.test.ts --no-coverage
npx eslint src/actions/community.ts src/actions/messages.ts src/app/community src/components/community
```

Expected: pass.

**Step 7: Commit**

```bash
git add src/actions/community.ts src/actions/messages.ts src/components/community src/app/community src/__tests__/actions/community.test.ts
git commit -m "feat: build OPC community"
```

---

## Task 6: Services Pages and AI-First Tools

**Files:**
- Create: `src/components/services/ServicePage.tsx`
- Create: `src/components/tools/ToolGrid.tsx`
- Create: `src/components/tools/ToolCategoryTabs.tsx`
- Modify: `src/app/finance/page.tsx`
- Modify: `src/app/legal/page.tsx`
- Modify: `src/app/banking/page.tsx`
- Modify: `src/app/equipment/page.tsx`
- Modify: `src/app/tools/page.tsx`

**Step 1: Build shared service page component**

Component API:

```typescript
type ServicePageProps = {
  eyebrow: string;
  title: string;
  intro: string[];
  features: Array<{ icon: React.ReactNode; title: string; description: string }>;
};
```

Use lucide icons for feature points. Contact block reads:
- `NEXT_PUBLIC_CONTACT_WECHAT_QR_URL`
- `NEXT_PUBLIC_CONTACT_PHONE`
- `NEXT_PUBLIC_CONTACT_EMAIL`

Add these optional variables to `.env.example`.

**Step 2: Replace service placeholders**

Pages and feature directions:
- `/finance`: 代账记账、税务申报、年度审计、发票管理
- `/legal`: 合同起草审查、公司注册变更、知识产权、纠纷咨询
- `/banking`: OPC专属开户、信用贷款、收款结算、理财配置
- `/equipment`: 办公设备、摄影器材、生产工具、按需短租

**Step 3: Build tools page**

`/tools` requirements:
- default selected category is `AI工具`
- fixed category order: AI工具, 协作办公, 财税记账, 合同法务, 设计创意, 全部
- active tools sorted by category order then `order`
- card fields: icon, name, description, category, external "立即使用" link

Use a small Client Component for category switching after server loads all tools.

**Step 4: Verify**

```bash
npx eslint src/app/finance src/app/legal src/app/banking src/app/equipment src/app/tools src/components/services src/components/tools
```

Expected: pass.

**Step 5: Commit**

```bash
git add .env.example src/components/services src/components/tools src/app/finance src/app/legal src/app/banking src/app/equipment src/app/tools
git commit -m "feat: add services pages and AI-first tools"
```

---

## Task 7: Admin User, Content, Tool, and Permission Management

**Files:**
- Modify: `src/actions/admin-auth.ts`
- Modify: `src/actions/admin-orders.ts`
- Create: `src/actions/admin-users.ts`
- Create: `src/actions/admin-content.ts`
- Create: `src/actions/admin-tools.ts`
- Modify: `src/app/admin/page.tsx`
- Create: `src/__tests__/actions/admin-users.test.ts`
- Create: `src/__tests__/actions/admin-tools.test.ts`

**Step 1: Write failing tests**

Test cases:
- sub-admin without `users` cannot change roles or ban users.
- admin can toggle `User.banned`.
- admin can switch user role between `OPC` and `BIZ_OPC`.
- sub-admin without `tools` cannot create/update tools.
- admin can mark reports resolved.

**Step 2: Update sub-admin permission shape**

In `createSubAdmin`, replace:

```typescript
permissions: {
  modules: ["users", "orders", "content"],
}
```

with:

```typescript
permissions: {
  users: true,
  orders: true,
  content: true,
  tools: false,
  announcements: false,
}
```

**Step 3: Implement admin actions**

Required exports:

```typescript
// admin-users.ts
export async function updateUserRole(userId: string, role: "OPC" | "BIZ_OPC"): Promise<AdminActionState>;
export async function toggleUserBanned(userId: string): Promise<AdminActionState>;

// admin-content.ts
export async function resolveReport(reportId: string): Promise<AdminActionState>;
export async function deleteReportedContent(reportId: string): Promise<AdminActionState>;

// admin-tools.ts
export async function createTool(_state: AdminActionState, formData: FormData): Promise<AdminActionState>;
export async function updateTool(toolId: string, _state: AdminActionState, formData: FormData): Promise<AdminActionState>;
export async function toggleToolActive(toolId: string): Promise<AdminActionState>;
export async function moveTool(toolId: string, direction: "up" | "down"): Promise<AdminActionState>;
```

All actions must call a shared permission check based on `getAdminSession()`, the current `Admin` row, and `hasAdminPermission`.

**Step 4: Extend admin page**

Keep the existing single `/admin` page, but split into clear sections:
- user management table with search param `q`
- existing order review list
- report management list with unresolved/resolved filter
- tool management list and form
- backend account table and create form

If the file becomes too large, extract local components under `src/components/admin/`.

**Step 5: Extend banned-user enforcement in `src/proxy.ts`**

Because Proxy is not for full session management, avoid database reads there. Implement banned enforcement in auth/session access points instead:
- In `src/auth.ts` callbacks, include `banned` on token/session.
- In route guards or page-level auth checks, redirect banned users to `/login?error=banned`.
- Add a low-risk follow-up only if the current NextAuth setup makes this straightforward.

**Step 6: Run tests and lint**

```bash
npx jest src/__tests__/actions/admin-users.test.ts src/__tests__/actions/admin-tools.test.ts --no-coverage
npx eslint src/actions/admin-auth.ts src/actions/admin-users.ts src/actions/admin-content.ts src/actions/admin-tools.ts src/app/admin
```

Expected: pass.

**Step 7: Commit**

```bash
git add src/actions/admin-auth.ts src/actions/admin-users.ts src/actions/admin-content.ts src/actions/admin-tools.ts src/app/admin src/__tests__/actions/admin-users.test.ts src/__tests__/actions/admin-tools.test.ts
git commit -m "feat: expand admin management"
```

---

## Task 8: Integration and UX Pass

**Files:**
- Modify: touched pages/components as needed
- Modify: `README.md` if setup commands or environment variables changed

**Step 1: Run full checks**

```bash
npx prisma validate
npx jest --no-coverage
npx eslint
npm run build
```

Expected: all pass.

**Step 2: Start dev server**

```bash
npm run dev
```

Expected: app starts on `http://localhost:3004`.

**Step 3: Manual verification checklist**

Use browser verification for:
- `/orders`: filters render; default list only shows `RECRUITING`.
- `/orders/new`: `BIZ_OPC` can submit; `OPC` cannot.
- `/admin`: pending order can be approved and becomes visible in `/orders`.
- `/orders/[id]`: another OPC can apply; author can accept; author can complete; accepted applicant gets +100.
- `/profile/[userId]`: profile shows rank, skills, completed orders, posts, followers.
- `/settings/profile`: edit saves and updates public page.
- `/community`: boards and hot posts render.
- `/community/post/[id]`: like/comment/report flows work.
- `/community/messages`: send message, unread indicator behavior is acceptable.
- `/tools`: AI tools category is default and category switching works.
- `/finance`, `/legal`, `/banking`, `/equipment`: service page structure is consistent.
- `/admin`: user, content, tool, and sub-account permission sections work.

**Step 4: Fix any build or visual issues**

Keep fixes scoped. Do not refactor unrelated auth, styling, or Prisma code.

**Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete OPC Hub v1 scope"
```

---

## Out of Scope

- In-platform payment.
- Follow activity feed.
- Native mobile app.
- Multi-language support.
- Third-party ad system.
- Rating/review system after order completion.
- Full COS image upload implementation unless credentials and upload policy are provided during execution.
