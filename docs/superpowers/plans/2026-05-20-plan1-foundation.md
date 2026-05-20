# OPC Hub — Plan 1: Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bootstrap the full project — Next.js 15, Prisma + PostgreSQL with complete schema, NextAuth v5 with three login methods, role-based route middleware, base layout, homepage, big-screen display page, and GitHub Actions CI/CD.

**Architecture:** Single Next.js 15 App Router monorepo using Server Actions for mutations. Auth handled by NextAuth v5 (Auth.js) with PrismaAdapter for persistence. Route groups `(public)` / `(auth)` / `(admin)` enforce access tiers via a layout-level auth check backed by the `auth()` helper.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS 3, Prisma 5, PostgreSQL, NextAuth v5 (`next-auth@beta`), `@auth/prisma-adapter`, Tencent Cloud SMS, WeChat OAuth, Jest 29 + React Testing Library, GitHub Actions, Tencent Cloud CVM + PM2.

---

## File Map

```
OPC-Hub/
├── prisma/
│   └── schema.prisma              # Full DB schema (all models for all plans)
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout (font, metadata)
│   │   ├── globals.css
│   │   ├── (public)/
│   │   │   └── page.tsx           # Homepage — only GUEST-accessible route
│   │   ├── (auth)/
│   │   │   └── layout.tsx         # Redirects unauthenticated users to /login
│   │   ├── (admin)/
│   │   │   └── layout.tsx         # Redirects non-ADMIN users to /
│   │   ├── login/
│   │   │   └── page.tsx           # Login page (3 methods)
│   │   ├── register/
│   │   │   └── page.tsx           # Register page
│   │   ├── screen/
│   │   │   └── page.tsx           # Big-screen display (/screen)
│   │   └── api/
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── auth/send-sms/route.ts     # Send SMS code endpoint
│   │       └── screen/sse/route.ts        # SSE stats stream
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   └── auth/
│   │       ├── LoginForm.tsx
│   │       └── RegisterForm.tsx
│   ├── lib/
│   │   ├── db.ts                  # Prisma client singleton
│   │   └── sms.ts                 # Tencent Cloud SMS helper
│   ├── actions/
│   │   └── auth.ts                # register / loginWithPassword Server Actions
│   ├── auth.ts                    # NextAuth config (exported: auth, handlers, signIn, signOut)
│   ├── middleware.ts               # Edge middleware: auth check + role guard
│   └── types/
│       └── next-auth.d.ts         # Augment Session to include role
├── .env.example
├── .env.local                     # (git-ignored)
├── jest.config.ts
├── jest.setup.ts
├── next.config.ts
├── tailwind.config.ts
└── .github/workflows/deploy.yml
```

---

## Task 1: Scaffold the Project

**Files:**
- Create: `package.json` (via `create-next-app`)
- Create: `next.config.ts`
- Create: `tailwind.config.ts`
- Create: `.env.example`
- Create: `.env.local`
- Create: `.gitignore`

- [ ] **Step 1: Initialize git and Next.js project**

```bash
cd D:/MyProjectCode/OPC-Hub
git init
npx create-next-app@latest . \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint
```

When prompted for App Router: Yes. For Turbopack: No (Jest compatibility).

- [ ] **Step 2: Install dependencies**

```bash
npm install prisma @prisma/client next-auth@beta @auth/prisma-adapter bcryptjs
npm install -D @types/bcryptjs jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event ts-jest
```

- [ ] **Step 3: Create `.env.example`**

```bash
# .env.example
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/opc_hub"
NEXTAUTH_SECRET="generate-with-openssl-rand-hex-32"
NEXTAUTH_URL="http://localhost:3000"

# Tencent Cloud SMS
TENCENT_SECRET_ID=""
TENCENT_SECRET_KEY=""
TENCENT_SMS_SDK_APP_ID=""
TENCENT_SMS_SIGN_NAME=""
TENCENT_SMS_TEMPLATE_ID=""

# WeChat OAuth
WECHAT_CLIENT_ID=""
WECHAT_CLIENT_SECRET=""
```

- [ ] **Step 4: Create `.env.local` from example, fill in real values**

```bash
cp .env.example .env.local
```

Edit `.env.local` with actual DB credentials, NextAuth secret, etc.

- [ ] **Step 5: Update `.gitignore` to exclude secrets and brainstorm artifacts**

Append to `.gitignore`:
```
.env.local
.superpowers/
```

- [ ] **Step 6: Commit scaffold**

```bash
git add -A
git commit -m "chore: initialize Next.js 15 project with TypeScript and Tailwind"
```

---

## Task 2: Prisma Schema + Database

**Files:**
- Create: `prisma/schema.prisma`

- [ ] **Step 1: Initialize Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

- [ ] **Step 2: Replace `prisma/schema.prisma` with full schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  OPC
  BIZ_OPC
  ADMIN
}

enum OrderStatus {
  DRAFT
  PENDING_REVIEW
  RECRUITING
  IN_PROGRESS
  COMPLETED
  REJECTED
  CLOSED
}

enum ApplicationStatus {
  PENDING
  ACCEPTED
  REJECTED
}

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
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts           Account[]
  sessions           Session[]
  orders             Order[]
  applications       OrderApplication[]
  posts              Post[]
  comments           Comment[]
  sentMessages       Message[]         @relation("SentMessages")
  receivedMessages   Message[]         @relation("ReceivedMessages")
  pointLogs          PointLog[]
  subAccount         AdminSubAccount?  @relation("SubAccountUser")
  createdSubAccounts AdminSubAccount[] @relation("SubAccountCreator")
  following          Follow[]          @relation("Following")
  followers          Follow[]          @relation("Followers")
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

model SmsCode {
  id        String   @id @default(cuid())
  phone     String
  code      String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())

  @@index([phone])
}

model Order {
  id           String      @id @default(cuid())
  title        String
  description  String      @db.Text
  amount       Decimal     @db.Decimal(12, 2)
  category     String
  status       OrderStatus @default(DRAFT)
  deadline     DateTime?
  authorId     String
  rejectReason String?
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  author       User               @relation(fields: [authorId], references: [id])
  applications OrderApplication[]
}

model OrderApplication {
  id          String            @id @default(cuid())
  orderId     String
  applicantId String
  reason      String            @db.Text
  status      ApplicationStatus @default(PENDING)
  createdAt   DateTime          @default(now())

  order     Order @relation(fields: [orderId], references: [id])
  applicant User  @relation(fields: [applicantId], references: [id])

  @@unique([orderId, applicantId])
}

model Board {
  id    String @id @default(cuid())
  name  String @unique
  slug  String @unique
  order Int    @default(0)
  posts Post[]
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

  board    Board     @relation(fields: [boardId], references: [id])
  author   User      @relation(fields: [authorId], references: [id])
  comments Comment[]
}

model Comment {
  id        String   @id @default(cuid())
  postId    String
  authorId  String
  content   String   @db.Text
  createdAt DateTime @default(now())

  post   Post @relation(fields: [postId], references: [id])
  author User @relation(fields: [authorId], references: [id])
}

model Message {
  id        String    @id @default(cuid())
  fromId    String
  toId      String
  content   String    @db.Text
  readAt    DateTime?
  createdAt DateTime  @default(now())

  from User @relation("SentMessages",   fields: [fromId], references: [id])
  to   User @relation("ReceivedMessages", fields: [toId],  references: [id])
}

model Follow {
  followerId  String
  followingId String
  createdAt   DateTime @default(now())

  follower  User @relation("Following", fields: [followerId],  references: [id])
  following User @relation("Followers", fields: [followingId], references: [id])

  @@id([followerId, followingId])
}

model PointLog {
  id        String   @id @default(cuid())
  userId    String
  delta     Int
  reason    String
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id])
}

model AdminSubAccount {
  id          String   @id @default(cuid())
  userId      String   @unique
  permissions Json
  createdById String
  createdAt   DateTime @default(now())

  user      User @relation("SubAccountUser",    fields: [userId],      references: [id])
  createdBy User @relation("SubAccountCreator", fields: [createdById], references: [id])
}
```

- [ ] **Step 3: Run initial migration**

```bash
npx prisma migrate dev --name init
```

Expected: Creates `prisma/migrations/TIMESTAMP_init/` and applies schema to DB.

- [ ] **Step 4: Create `src/lib/db.ts`**

```typescript
// src/lib/db.ts
import { PrismaClient } from "@prisma/client"

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const db =
  globalForPrisma.prisma ?? new PrismaClient({ log: ["error"] })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
```

- [ ] **Step 5: Commit**

```bash
git add prisma/ src/lib/db.ts
git commit -m "feat: add Prisma schema with all models and db client singleton"
```

---

## Task 3: Jest Testing Setup

**Files:**
- Create: `jest.config.ts`
- Create: `jest.setup.ts`

- [ ] **Step 1: Create `jest.config.ts`**

```typescript
// jest.config.ts
import type { Config } from "jest"
import nextJest from "next/jest.js"

const createJestConfig = nextJest({ dir: "./" })

const config: Config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
}

export default createJestConfig(config)
```

- [ ] **Step 2: Create `jest.setup.ts`**

```typescript
// jest.setup.ts
import "@testing-library/jest-dom"
```

- [ ] **Step 3: Add test script to `package.json`**

In `package.json`, add inside `"scripts"`:
```json
"test": "jest",
"test:watch": "jest --watch"
```

- [ ] **Step 4: Verify Jest works**

```bash
npx jest --passWithNoTests
```

Expected: `Test Suites: 0 passed` — no errors.

- [ ] **Step 5: Commit**

```bash
git add jest.config.ts jest.setup.ts package.json
git commit -m "chore: configure Jest with next/jest and React Testing Library"
```

---

## Task 4: NextAuth v5 — Credentials Provider (email/password)

**Files:**
- Create: `src/auth.ts`
- Create: `src/app/api/auth/[...nextauth]/route.ts`
- Create: `src/types/next-auth.d.ts`
- Create: `src/actions/auth.ts`
- Create: `src/__tests__/actions/auth.test.ts`

- [ ] **Step 1: Write failing test for `register` action**

```typescript
// src/__tests__/actions/auth.test.ts
import { db } from "@/lib/db"
import { register } from "@/actions/auth"

jest.mock("@/lib/db", () => ({
  db: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}))

const mockDb = db as jest.Mocked<typeof db>

describe("register action", () => {
  beforeEach(() => jest.clearAllMocks())

  it("returns error when email already exists", async () => {
    ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue({ id: "1" })
    const result = await register({ email: "a@b.com", password: "pass123", name: "Test" })
    expect(result.error).toBe("该邮箱已注册")
  })

  it("hashes password and creates user on success", async () => {
    ;(mockDb.user.findUnique as jest.Mock).mockResolvedValue(null)
    ;(mockDb.user.create as jest.Mock).mockResolvedValue({ id: "2", email: "a@b.com" })
    const result = await register({ email: "a@b.com", password: "pass123", name: "Test" })
    expect(result.success).toBe(true)
    const created = (mockDb.user.create as jest.Mock).mock.calls[0][0]
    expect(created.data.password).not.toBe("pass123")
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
npx jest src/__tests__/actions/auth.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/actions/auth'`

- [ ] **Step 3: Create `src/actions/auth.ts`**

```typescript
// src/actions/auth.ts
"use server"

import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export async function register({
  email,
  password,
  name,
}: {
  email: string
  password: string
  name: string
}) {
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) return { error: "该邮箱已注册" }

  const hashed = await bcrypt.hash(password, 12)
  await db.user.create({
    data: { email, password: hashed, name, role: "OPC" },
  })
  return { success: true }
}
```

- [ ] **Step 4: Run test to confirm it passes**

```bash
npx jest src/__tests__/actions/auth.test.ts --no-coverage
```

Expected: PASS — 2 tests pass.

- [ ] **Step 5: Create `src/types/next-auth.d.ts`**

```typescript
// src/types/next-auth.d.ts
import { Role } from "@prisma/client"
import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: Role
    } & DefaultSession["user"]
  }
  interface User {
    role: Role
  }
}
```

- [ ] **Step 6: Create `src/auth.ts`**

```typescript
// src/auth.ts
import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { db } from "@/lib/db"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "邮箱/手机号" },
        password: { label: "密码" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: credentials.email as string },
              { phone: credentials.email as string },
            ],
          },
        })
        if (!user?.password) return null
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.password
        )
        if (!valid) return null
        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as import("@prisma/client").Role
      return session
    },
  },
})
```

- [ ] **Step 7: Create `src/app/api/auth/[...nextauth]/route.ts`**

```typescript
// src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth"
export const { GET, POST } = handlers
```

- [ ] **Step 8: Commit**

```bash
git add src/auth.ts src/actions/auth.ts src/types/ src/app/api/auth/ src/__tests__/
git commit -m "feat: add NextAuth v5 with credentials provider and register action"
```

---

## Task 5: Phone SMS Login (Tencent Cloud)

**Files:**
- Create: `src/lib/sms.ts`
- Create: `src/app/api/auth/send-sms/route.ts`
- Create: `src/__tests__/lib/sms.test.ts`

> Prerequisite: Install Tencent Cloud SMS SDK: `npm install tencentcloud-sdk-nodejs`

- [ ] **Step 1: Write failing test for SMS code generation**

```typescript
// src/__tests__/lib/sms.test.ts
import { generateSmsCode, isValidPhone } from "@/lib/sms"

describe("SMS utilities", () => {
  it("generates a 6-digit numeric code", () => {
    const code = generateSmsCode()
    expect(code).toMatch(/^\d{6}$/)
  })

  it("validates Chinese mobile numbers", () => {
    expect(isValidPhone("13800138000")).toBe(true)
    expect(isValidPhone("12345")).toBe(false)
    expect(isValidPhone("23800138000")).toBe(false)
  })
})
```

- [ ] **Step 2: Run to confirm fail**

```bash
npx jest src/__tests__/lib/sms.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/lib/sms'`

- [ ] **Step 3: Create `src/lib/sms.ts`**

```typescript
// src/lib/sms.ts
import * as tencentcloud from "tencentcloud-sdk-nodejs"

export function generateSmsCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

export async function sendSmsCode(phone: string, code: string): Promise<void> {
  const SmsClient = tencentcloud.sms.v20210111.Client
  const client = new SmsClient({
    credential: {
      secretId: process.env.TENCENT_SECRET_ID!,
      secretKey: process.env.TENCENT_SECRET_KEY!,
    },
    region: "ap-guangzhou",
  })
  await client.SendSms({
    SmsSdkAppId: process.env.TENCENT_SMS_SDK_APP_ID!,
    SignName: process.env.TENCENT_SMS_SIGN_NAME!,
    TemplateId: process.env.TENCENT_SMS_TEMPLATE_ID!,
    TemplateParamSet: [code, "5"],
    PhoneNumberSet: [`+86${phone}`],
  })
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx jest src/__tests__/lib/sms.test.ts --no-coverage
```

Expected: PASS — 3 tests pass.

- [ ] **Step 5: Create `src/app/api/auth/send-sms/route.ts`**

```typescript
// src/app/api/auth/send-sms/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { generateSmsCode, isValidPhone, sendSmsCode } from "@/lib/sms"

export async function POST(req: NextRequest) {
  const { phone } = await req.json()

  if (!isValidPhone(phone)) {
    return NextResponse.json({ error: "手机号格式不正确" }, { status: 400 })
  }

  // Rate limit: max 1 code per minute per phone
  const recent = await db.smsCode.findFirst({
    where: {
      phone,
      createdAt: { gt: new Date(Date.now() - 60_000) },
    },
  })
  if (recent) {
    return NextResponse.json({ error: "请求过于频繁，请1分钟后再试" }, { status: 429 })
  }

  const code = generateSmsCode()
  const expiresAt = new Date(Date.now() + 5 * 60_000) // 5 minutes

  await db.smsCode.create({ data: { phone, code, expiresAt } })
  await sendSmsCode(phone, code)

  return NextResponse.json({ success: true })
}
```

- [ ] **Step 6: Add SMS credentials provider to `src/auth.ts`**

Add after the existing `Credentials` provider in the `providers` array:

```typescript
Credentials({
  id: "sms",
  credentials: {
    phone: { label: "手机号" },
    code: { label: "验证码" },
  },
  async authorize(credentials) {
    if (!credentials?.phone || !credentials?.code) return null
    const record = await db.smsCode.findFirst({
      where: {
        phone: credentials.phone as string,
        code: credentials.code as string,
        used: false,
        expiresAt: { gt: new Date() },
      },
    })
    if (!record) return null
    await db.smsCode.update({ where: { id: record.id }, data: { used: true } })
    const user = await db.user.upsert({
      where: { phone: credentials.phone as string },
      update: {},
      create: { phone: credentials.phone as string, role: "OPC" },
    })
    return { id: user.id, name: user.name, email: user.email, role: user.role }
  },
}),
```

- [ ] **Step 7: Commit**

```bash
git add src/lib/sms.ts src/app/api/auth/send-sms/ src/__tests__/lib/sms.test.ts src/auth.ts
git commit -m "feat: add Tencent Cloud SMS verification with rate limiting"
```

---

## Task 6: WeChat OAuth

**Files:**
- Modify: `src/auth.ts`

WeChat is not a built-in NextAuth provider. Use a custom OAuth provider.

- [ ] **Step 1: Add WeChat custom provider to `src/auth.ts`**

Add to the `providers` array:

```typescript
{
  id: "wechat",
  name: "微信",
  type: "oauth",
  authorization: {
    url: "https://open.weixin.qq.com/connect/qrconnect",
    params: {
      appid: process.env.WECHAT_CLIENT_ID,
      response_type: "code",
      scope: "snsapi_login",
    },
  },
  token: "https://api.weixin.qq.com/sns/oauth2/access_token",
  userinfo: "https://api.weixin.qq.com/sns/userinfo",
  clientId: process.env.WECHAT_CLIENT_ID,
  clientSecret: process.env.WECHAT_CLIENT_SECRET,
  profile(profile: { openid: string; nickname: string; headimgurl: string }) {
    return {
      id: profile.openid,
      name: profile.nickname,
      image: profile.headimgurl,
      email: null,
      role: "OPC" as import("@prisma/client").Role,
    }
  },
},
```

- [ ] **Step 2: Commit**

```bash
git add src/auth.ts
git commit -m "feat: add WeChat OAuth provider"
```

---

## Task 7: Route Middleware

**Files:**
- Create: `src/middleware.ts`
- Create: `src/__tests__/middleware.test.ts`

- [ ] **Step 1: Write failing test for middleware logic**

```typescript
// src/__tests__/middleware.test.ts
import { getRequiredRole } from "@/middleware"

describe("getRequiredRole", () => {
  it("allows all roles for homepage", () => {
    expect(getRequiredRole("/")).toBe("PUBLIC")
  })

  it("requires login for auth routes", () => {
    expect(getRequiredRole("/finance")).toBe("AUTH")
    expect(getRequiredRole("/orders")).toBe("AUTH")
    expect(getRequiredRole("/community")).toBe("AUTH")
    expect(getRequiredRole("/tools")).toBe("AUTH")
  })

  it("requires ADMIN for admin routes", () => {
    expect(getRequiredRole("/admin")).toBe("ADMIN")
    expect(getRequiredRole("/admin/orders")).toBe("ADMIN")
  })

  it("allows public for screen route", () => {
    expect(getRequiredRole("/screen")).toBe("PUBLIC")
  })
})
```

- [ ] **Step 2: Run to confirm fail**

```bash
npx jest src/__tests__/middleware.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/middleware'`

- [ ] **Step 3: Create `src/middleware.ts`**

```typescript
// src/middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { auth } from "@/auth"

export type RouteAccess = "PUBLIC" | "AUTH" | "ADMIN"

export function getRequiredRole(pathname: string): RouteAccess {
  if (pathname === "/" || pathname.startsWith("/screen") || pathname.startsWith("/login") || pathname.startsWith("/register")) {
    return "PUBLIC"
  }
  if (pathname.startsWith("/admin")) return "ADMIN"
  return "AUTH"
}

// NextAuth v5 wraps the handler and injects req.auth (the session) automatically.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default auth((req: any) => {
  const { pathname } = req.nextUrl
  const required = getRequiredRole(pathname)

  if (required === "PUBLIC") return NextResponse.next()

  const session = req.auth as { user?: { role?: string } } | null
  if (!session?.user) {
    return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url))
  }

  if (required === "ADMIN" && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx jest src/__tests__/middleware.test.ts --no-coverage
```

Expected: PASS — 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/middleware.ts src/__tests__/middleware.test.ts
git commit -m "feat: add role-based route middleware with PUBLIC/AUTH/ADMIN tiers"
```

---

## Task 8: Base Layout — Navbar + Footer

**Files:**
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/components/layout/Footer.tsx`
- Create: `src/__tests__/components/Navbar.test.tsx`

- [ ] **Step 1: Write failing test for Navbar**

```typescript
// src/__tests__/components/Navbar.test.tsx
import { render, screen } from "@testing-library/react"
import { Navbar } from "@/components/layout/Navbar"

jest.mock("next/navigation", () => ({ usePathname: () => "/" }))
jest.mock("next-auth/react", () => ({
  useSession: () => ({ data: null, status: "unauthenticated" }),
  signOut: jest.fn(),
}))

describe("Navbar", () => {
  it("shows all main nav links", () => {
    render(<Navbar />)
    expect(screen.getByText("首页")).toBeInTheDocument()
    expect(screen.getByText("订单广场")).toBeInTheDocument()
    expect(screen.getByText("交流社区")).toBeInTheDocument()
  })

  it("shows login button when unauthenticated", () => {
    render(<Navbar />)
    expect(screen.getByText("登录")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm fail**

```bash
npx jest src/__tests__/components/Navbar.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '@/components/layout/Navbar'`

- [ ] **Step 3: Create `src/components/layout/Navbar.tsx`**

```typescript
// src/components/layout/Navbar.tsx
"use client"

import Link from "next/link"
import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"

const NAV_LINKS = [
  { href: "/", label: "首页" },
  { href: "/tools", label: "工具" },
  { href: "/finance", label: "财务" },
  { href: "/legal", label: "法务" },
  { href: "/banking", label: "银行服务" },
  { href: "/equipment", label: "设备租赁" },
  { href: "/orders", label: "订单广场" },
  { href: "/community", label: "交流社区" },
  { href: "/contact", label: "联系我们" },
]

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  return (
    <nav className="sticky top-0 z-50 bg-gray-900 border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">
        <Link href="/" className="text-white font-bold text-lg tracking-tight">
          OPC Hub
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded text-sm transition-colors ${
                pathname === href
                  ? "bg-indigo-600 text-white"
                  : "text-gray-300 hover:text-white hover:bg-gray-800"
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {session ? (
            <div className="flex items-center gap-2">
              <span className="text-gray-300 text-sm">{session.user.name ?? session.user.email}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-gray-400 hover:text-white"
              >
                退出
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded"
            >
              登录
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
```

- [ ] **Step 4: Create `src/components/layout/Footer.tsx`**

```typescript
// src/components/layout/Footer.tsx
export function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
        <p>© {new Date().getFullYear()} OPC Hub. 一站式个人公司服务平台</p>
      </div>
    </footer>
  )
}
```

- [ ] **Step 5: Create `src/app/layout.tsx`**

```typescript
// src/app/layout.tsx
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/layout/Navbar"
import { Footer } from "@/components/layout/Footer"
import { SessionProvider } from "next-auth/react"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OPC Hub — 一站式个人公司服务平台",
  description: "连接OPC服务商与商务需求方",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen flex flex-col`}>
        <SessionProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </SessionProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Run Navbar test to confirm pass**

```bash
npx jest src/__tests__/components/Navbar.test.tsx --no-coverage
```

Expected: PASS — 2 tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/app/layout.tsx src/app/globals.css src/components/layout/ src/__tests__/components/
git commit -m "feat: add base layout with Navbar and Footer"
```

---

## Task 9: Homepage

**Files:**
- Create: `src/app/(public)/page.tsx`
- Create: `src/__tests__/app/homepage.test.tsx`

- [ ] **Step 1: Write failing test**

```typescript
// src/__tests__/app/homepage.test.tsx
import { render, screen } from "@testing-library/react"
import HomePage from "@/app/(public)/page"

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }))

describe("HomePage", () => {
  it("renders the hero headline", () => {
    render(<HomePage />)
    expect(screen.getByText(/OPC Hub/)).toBeInTheDocument()
  })

  it("renders all 6 service cards", () => {
    render(<HomePage />)
    expect(screen.getByText("工具箱")).toBeInTheDocument()
    expect(screen.getByText("财务服务")).toBeInTheDocument()
    expect(screen.getByText("法务服务")).toBeInTheDocument()
    expect(screen.getByText("银行服务")).toBeInTheDocument()
    expect(screen.getByText("设备租赁")).toBeInTheDocument()
    expect(screen.getByText("订单广场")).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run to confirm fail**

```bash
npx jest src/__tests__/app/homepage.test.tsx --no-coverage
```

Expected: FAIL — `Cannot find module '@/app/(public)/page'`

- [ ] **Step 3: Create `src/app/(public)/page.tsx`**

```typescript
// src/app/(public)/page.tsx
import Link from "next/link"
import { db } from "@/lib/db"

async function getStats() {
  const [orderCount, orderAmount, companyCount] = await Promise.all([
    db.order.count({ where: { status: "COMPLETED" } }),
    db.order.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } }),
    db.user.count({ where: { role: { in: ["OPC", "BIZ_OPC"] } } }),
  ])
  return {
    orderCount,
    orderAmount: Number(orderAmount._sum.amount ?? 0),
    companyCount,
  }
}

const SERVICE_CARDS = [
  { href: "/tools",     icon: "🛠", title: "工具箱",   sub: "效率工具 · 集成应用" },
  { href: "/finance",   icon: "💰", title: "财务服务", sub: "记账 · 报税 · 对接"  },
  { href: "/legal",     icon: "⚖️", title: "法务服务", sub: "合同 · 咨询 · 维权"  },
  { href: "/banking",   icon: "🏦", title: "银行服务", sub: "开户 · 贷款 · 理财"  },
  { href: "/equipment", icon: "🔧", title: "设备租赁", sub: "办公 · 生产 · 按需"  },
  { href: "/orders",    icon: "🗂", title: "订单广场", sub: "发单 · 接单 · 合作"  },
]

export default async function HomePage() {
  const stats = await getStats()

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 via-indigo-950 to-gray-900 py-20 px-4 text-center">
        <h1 className="text-4xl font-bold text-white mb-3">OPC Hub</h1>
        <p className="text-gray-400 mb-10 text-lg">一站式个人公司服务平台 · 连接服务商与商务需求方</p>
        <div className="flex justify-center gap-16 mb-10">
          <div>
            <div className="text-5xl font-black text-indigo-400">{stats.orderCount.toLocaleString()}</div>
            <div className="text-gray-500 text-sm mt-1">累计订单量</div>
          </div>
          <div>
            <div className="text-5xl font-black text-sky-400">
              ¥{(stats.orderAmount / 10000).toFixed(1)}万
            </div>
            <div className="text-gray-500 text-sm mt-1">累计订单金额</div>
          </div>
          <div>
            <div className="text-5xl font-black text-emerald-400">{stats.companyCount.toLocaleString()}</div>
            <div className="text-gray-500 text-sm mt-1">入驻企业数</div>
          </div>
        </div>
        <div className="flex justify-center gap-4">
          <Link href="/register" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-medium">
            立即入驻
          </Link>
          <Link href="#services" className="border border-gray-600 text-gray-300 hover:text-white px-6 py-2.5 rounded-lg">
            了解更多
          </Link>
        </div>
      </section>

      {/* Service Cards */}
      <section id="services" className="max-w-5xl mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {SERVICE_CARDS.map(({ href, icon, title, sub }) => (
            <Link
              key={href}
              href={href}
              className="bg-gray-900 border border-gray-800 hover:border-indigo-500 rounded-xl p-6 text-center transition-colors group"
            >
              <div className="text-3xl mb-3">{icon}</div>
              <div className="font-semibold text-gray-100 group-hover:text-indigo-400 transition-colors">{title}</div>
              <div className="text-gray-500 text-sm mt-1">{sub}</div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
```

- [ ] **Step 4: Run test to confirm pass**

```bash
npx jest src/__tests__/app/homepage.test.tsx --no-coverage
```

Expected: PASS — 2 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(public\)/
git commit -m "feat: build homepage with hero stats and service cards"
```

---

## Task 10: Big Screen Page + SSE Stats Endpoint

**Files:**
- Create: `src/app/screen/page.tsx`
- Create: `src/app/api/screen/sse/route.ts`
- Create: `src/__tests__/api/screen-sse.test.ts`

- [ ] **Step 1: Write failing test for SSE route**

```typescript
// src/__tests__/api/screen-sse.test.ts
import { GET } from "@/app/api/screen/sse/route"
import { NextRequest } from "next/server"

jest.mock("@/lib/db", () => ({
  db: {
    order: {
      count: jest.fn().mockResolvedValue(42),
      aggregate: jest.fn().mockResolvedValue({ _sum: { amount: "500000" } }),
    },
    user: { count: jest.fn().mockResolvedValue(10) },
  },
}))

describe("GET /api/screen/sse", () => {
  it("returns a ReadableStream response with SSE content-type", async () => {
    const req = new NextRequest("http://localhost/api/screen/sse")
    const res = await GET(req)
    expect(res.headers.get("content-type")).toBe("text/event-stream")
    expect(res.headers.get("cache-control")).toBe("no-cache")
  })
})
```

- [ ] **Step 2: Run to confirm fail**

```bash
npx jest src/__tests__/api/screen-sse.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '@/app/api/screen/sse/route'`

- [ ] **Step 3: Create `src/app/api/screen/sse/route.ts`**

```typescript
// src/app/api/screen/sse/route.ts
import { NextRequest } from "next/server"
import { db } from "@/lib/db"

async function fetchStats() {
  const [orderCount, orderAmount, companyCount] = await Promise.all([
    db.order.count({ where: { status: "COMPLETED" } }),
    db.order.aggregate({ _sum: { amount: true }, where: { status: "COMPLETED" } }),
    db.user.count({ where: { role: { in: ["OPC", "BIZ_OPC"] } } }),
  ])
  return {
    orderCount,
    orderAmount: Number(orderAmount._sum.amount ?? 0),
    companyCount,
  }
}

export async function GET(_req: NextRequest) {
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const send = async () => {
        const stats = await fetchStats()
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(stats)}\n\n`))
      }

      await send()
      const interval = setInterval(send, 10_000)

      // Clean up when client disconnects
      _req.signal.addEventListener("abort", () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
```

- [ ] **Step 4: Create `src/app/screen/page.tsx`**

```typescript
// src/app/screen/page.tsx
"use client"

import { useEffect, useState } from "react"

interface Stats {
  orderCount: number
  orderAmount: number
  companyCount: number
}

export default function ScreenPage() {
  const [stats, setStats] = useState<Stats>({ orderCount: 0, orderAmount: 0, companyCount: 0 })

  useEffect(() => {
    const es = new EventSource("/api/screen/sse")
    es.onmessage = (e) => setStats(JSON.parse(e.data))
    return () => es.close()
  }, [])

  const fmt = (n: number) => n.toLocaleString("zh-CN")
  const fmtAmount = (n: number) => {
    if (n >= 1e8) return `¥${(n / 1e8).toFixed(2)}亿`
    if (n >= 1e4) return `¥${(n / 1e4).toFixed(1)}万`
    return `¥${fmt(n)}`
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center"
      style={{ background: "linear-gradient(135deg, #000428 0%, #004e92 100%)" }}
    >
      <h1 className="text-sky-400 text-3xl font-bold tracking-[0.3em] mb-16">
        OPC HUB 平台实时数据
      </h1>

      <div className="flex gap-24 items-center">
        <Stat value={fmt(stats.orderCount)} label="累计订单量" color="text-white" glow="#38bdf8" />
        <div className="w-px h-24 bg-white/10" />
        <Stat value={fmtAmount(stats.orderAmount)} label="累计订单金额" color="text-white" glow="#4ade80" />
        <div className="w-px h-24 bg-white/10" />
        <Stat value={fmt(stats.companyCount)} label="入驻企业" color="text-white" glow="#fb923c" />
      </div>

      <div className="mt-16 text-gray-500 text-xs">数据每10秒自动更新</div>
    </div>
  )
}

function Stat({ value, label, glow }: { value: string; label: string; color: string; glow: string }) {
  return (
    <div className="text-center">
      <div
        className="text-7xl font-black tabular-nums"
        style={{ color: "#fff", textShadow: `0 0 30px ${glow}` }}
      >
        {value}
      </div>
      <div className="mt-3 text-base tracking-widest" style={{ color: glow }}>
        {label}
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Run SSE test to confirm pass**

```bash
npx jest src/__tests__/api/screen-sse.test.ts --no-coverage
```

Expected: PASS — 1 test passes.

- [ ] **Step 6: Commit**

```bash
git add src/app/screen/ src/app/api/screen/ src/__tests__/api/
git commit -m "feat: add big-screen page and SSE stats endpoint"
```

---

## Task 11: Login + Register Pages

**Files:**
- Create: `src/app/login/page.tsx`
- Create: `src/app/register/page.tsx`
- Create: `src/components/auth/LoginForm.tsx`
- Create: `src/components/auth/RegisterForm.tsx`

- [ ] **Step 1: Create `src/components/auth/LoginForm.tsx`**

```typescript
// src/components/auth/LoginForm.tsx
"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"

type Tab = "password" | "sms"

export function LoginForm() {
  const router = useRouter()
  const [tab, setTab] = useState<Tab>("sms")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  async function sendCode() {
    setSending(true)
    const res = await fetch("/api/auth/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    })
    setSending(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? "发送失败")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const result =
      tab === "sms"
        ? await signIn("sms", { phone, code, redirect: false })
        : await signIn("credentials", { email, password, redirect: false })

    if (result?.error) {
      setError("登录失败，请检查输入")
    } else {
      router.push("/")
      router.refresh()
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-sm">
      <h2 className="text-xl font-bold text-white mb-6 text-center">登录 OPC Hub</h2>

      <div className="flex border border-gray-700 rounded-lg mb-6 overflow-hidden">
        {(["sms", "password"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              tab === t ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-white"
            }`}
          >
            {t === "sms" ? "短信验证码" : "密码登录"}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {tab === "sms" ? (
          <>
            <input
              type="tel"
              placeholder="手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="验证码"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={sendCode}
                disabled={sending}
                className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {sending ? "发送中..." : "获取验证码"}
              </button>
            </div>
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="邮箱或手机号"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
            <input
              type="password"
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
            />
          </>
        )}

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium"
        >
          登录
        </button>
      </form>

      <button
        onClick={() => signIn("wechat")}
        className="mt-4 w-full border border-gray-700 text-gray-300 hover:text-white py-2.5 rounded-lg text-sm"
      >
        微信扫码登录
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/app/login/page.tsx`**

```typescript
// src/app/login/page.tsx
import { LoginForm } from "@/components/auth/LoginForm"

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <LoginForm />
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/auth/RegisterForm.tsx`**

```typescript
// src/components/auth/RegisterForm.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { register } from "@/actions/auth"
import { signIn } from "next-auth/react"

export function RegisterForm() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const result = await register({ email, password, name })
    if (result.error) {
      setError(result.error)
      return
    }
    await signIn("credentials", { email, password, callbackUrl: "/" })
    router.push("/")
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 w-full max-w-sm">
      <h2 className="text-xl font-bold text-white mb-6 text-center">注册 OPC Hub</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          placeholder="姓名 / 公司名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <input
          type="email"
          placeholder="邮箱"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        <input
          type="password"
          placeholder="密码（至少8位）"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-lg font-medium"
        >
          注册
        </button>
      </form>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/app/register/page.tsx`**

```typescript
// src/app/register/page.tsx
import { RegisterForm } from "@/components/auth/RegisterForm"
import Link from "next/link"

export default function RegisterPage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 gap-4">
      <RegisterForm />
      <p className="text-gray-500 text-sm">
        已有账号？{" "}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
          立即登录
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/login/ src/app/register/ src/components/auth/
git commit -m "feat: add login and register pages with SMS, password, and WeChat login"
```

---

## Task 12: GitHub Actions CI/CD

**Files:**
- Create: `.github/workflows/deploy.yml`

- [ ] **Step 1: Add GitHub Secrets in the repository settings**

Go to GitHub repo → Settings → Secrets and variables → Actions. Add:
- `TENCENT_HOST` — server IP
- `TENCENT_SSH_KEY` — private key for SSH
- `DATABASE_URL` — production DB connection string
- `NEXTAUTH_SECRET` — production secret
- `NEXTAUTH_URL` — production URL (e.g. `https://opchub.com`)
- `TENCENT_SECRET_ID`, `TENCENT_SECRET_KEY`, `TENCENT_SMS_SDK_APP_ID`, `TENCENT_SMS_SIGN_NAME`, `TENCENT_SMS_TEMPLATE_ID`
- `WECHAT_CLIENT_ID`, `WECHAT_CLIENT_SECRET`

- [ ] **Step 2: Create `.github/workflows/deploy.yml`**

```yaml
# .github/workflows/deploy.yml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npx jest --passWithNoTests --ci

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Build
        run: npm run build
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          NEXTAUTH_SECRET: ${{ secrets.NEXTAUTH_SECRET }}
          NEXTAUTH_URL: ${{ secrets.NEXTAUTH_URL }}

      - name: Deploy to Tencent Cloud
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.TENCENT_HOST }}
          username: ubuntu
          key: ${{ secrets.TENCENT_SSH_KEY }}
          script: |
            cd /var/www/opc-hub
            git pull origin main
            npm ci --omit=dev
            npx prisma migrate deploy
            npm run build
            pm2 restart opc-hub || pm2 start npm --name opc-hub -- start
```

- [ ] **Step 3: Initial server setup on Tencent Cloud (one-time)**

SSH into your CVM and run:
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
sudo npm install -g pm2
pm2 startup

# Clone the repo
mkdir -p /var/www/opc-hub
cd /var/www/opc-hub
git clone https://github.com/YOUR_ORG/OPC-Hub.git .

# Create .env
cp .env.example .env
# Edit .env with production values
nano .env
```

- [ ] **Step 4: Push to main to trigger first deploy**

```bash
git add .github/
git commit -m "ci: add GitHub Actions test and deploy workflow"
git push -u origin main
```

Expected: GitHub Actions runs tests, then deploys to Tencent Cloud on success.

---

## Task 13: Final Check

- [ ] **Step 1: Run all tests**

```bash
npx jest --no-coverage
```

Expected: All tests pass.

- [ ] **Step 2: Start dev server and verify manually**

```bash
npm run dev
```

Check:
- `http://localhost:3000` — homepage renders with stats (all zeros — no data yet)
- `http://localhost:3000/screen` — big screen renders, SSE connected
- `http://localhost:3000/login` — login form with SMS and password tabs
- `http://localhost:3000/register` — register form
- `http://localhost:3000/finance` — redirects to `/login` (unauthenticated)
- `http://localhost:3000/admin` — redirects to `/` (unauthenticated)

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "chore: Plan 1 foundation complete"
```

---

## What Comes Next

| Plan | Starts from |
|------|-------------|
| **Plan 2** | Service & Tools pages (`/finance`, `/legal`, `/banking`, `/equipment`, `/tools`) |
| **Plan 3** | Order system (CRUD, state machine, admin review, notifications) |
| **Plan 4** | Community (posts, boards, comments, points, private messages, follow, reporting) |
| **Plan 5** | Admin panel (user management, sub-accounts, content moderation, tool config) |
