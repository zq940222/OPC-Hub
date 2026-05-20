# OPC Hub — 设计规格文档

**日期：** 2026-05-20  
**状态：** 待用户确认  

---

## 1. 产品概述

OPC Hub 是一个面向个人独资公司（OPC）的一站式服务平台，核心定位是**连接 OPC 服务提供商与有外包/合作需求的商务方**，同时提供财务、法务、银行、工具、设备租赁等配套服务，并附带完整的交流社区。

---

## 2. 用户角色与权限

| 角色 | 标识 | 核心权限 |
|------|------|----------|
| 游客 | `GUEST` | **仅限首页**；其他所有页面跳转到登录 |
| OPC 公司 | `OPC` | 全功能访问；可浏览和**报名承接**订单；完整社区参与 |
| 商务 OPC 公司 | `BIZ_OPC` | 全功能访问；可**发布订单**（需管理员审核后生效） |
| 管理员 | `ADMIN` | 全权限；可创建子账号并按功能模块分配权限 |

**子账号权限维度（简单模块勾选）：**  
管理员创建子账号时，对以下每个模块单独勾选"是否有权限"（勾选 = 该模块完整权限）：
- 用户管理、订单审核、内容管理、工具配置、通知公告

---

## 3. 页面结构与导航

**顶部导航栏（所有用户可见）：**

```
Logo | 首页 | 工具 | 财务 | 法务 | 银行服务 | 设备租赁 | 订单广场 | 交流社区 | 联系我们 | [登录/注册]
```

登录后右侧替换为头像下拉菜单（个人中心 / 我的订单 / 退出）。

**路由清单：**

| 路由 | 页面 | 最低访问角色 |
|------|------|-------------|
| `/` | 首页 | GUEST |
| `/tools` | 工具箱 | OPC（游客跳转登录） |
| `/finance` | 财务服务 | OPC（游客跳转登录） |
| `/legal` | 法务服务 | OPC（游客跳转登录） |
| `/banking` | 银行服务 | OPC（游客跳转登录） |
| `/equipment` | 设备租赁 | OPC（游客跳转登录） |
| `/orders` | 订单广场 | OPC（游客跳转登录） |
| `/orders/new` | 发布订单 | BIZ_OPC |
| `/community` | 交流社区 | OPC（游客跳转登录） |
| `/community/messages` | 私信 | OPC |
| `/screen` | 大屏展示 | 公开无需登录 |
| `/admin` | 管理后台 | ADMIN |

---

## 4. 首页设计

**Section 1 — Hero 区（首屏）**
- 平台 slogan + 副标题
- 三个实时核心数据：累计订单量、累计订单金额、入驻企业数
- 两个 CTA 按钮：「立即入驻」「了解更多」

**Section 2 — 六大服务快捷入口**
- 3×2 卡片网格：工具箱 / 财务 / 法务 / 银行 / 设备租赁 / 订单广场

**Section 3 — 动态内容区**
- 左：最新订单实时滚动（来自订单广场）
- 右：社区热帖（按点赞数排序，前3条）

---

## 5. 服务页面（财务 / 法务 / 银行服务 / 设备租赁）

四个页面结构相同，均包含：
- 服务介绍文案
- 联系方式：微信二维码 + 电话号码
- 需登录（OPC 及以上）方可访问

工具页面（`/tools`）略有不同：
- 展示工具卡片列表，分类筛选
- 每个工具有「外链跳转」按钮（主要方式）
- 部分工具支持内嵌 iframe（需登录）
- 管理员后台可配置工具条目

---

## 6. 订单广场

### 6.1 状态机

```
草稿 → 待审核 → 招募中 → 进行中 → 已完成
              ↓
           已拒绝（退回草稿，附拒绝原因）
```

商务 OPC 可在「进行中」之前主动关闭订单。

### 6.2 订单广场页面（`/orders`）

- 左侧：分类筛选栏（按行业类别）+ 金额范围
- 右侧：订单卡片列表
  - 字段：标题、发布方、金额、分类、已报名人数、截止日期、状态标签
  - 操作：「查看详情 / 报名」（OPC 用户）
- 顶部：关键词搜索 + 排序（最新发布 / 金额最高）

### 6.3 订单详情页

- 完整需求描述
- 发布方信息
- 报名列表（仅发布方和管理员可见全量）
- OPC 用户：填写报名理由后提交

### 6.4 管理员审核（`/admin/orders`）

- 表格列表：标题、发布方、金额、提交时间
- 操作：通过 / 拒绝（拒绝需填写原因，自动通知发布方）

---

## 7. 交流社区

### 7.1 板块

公告 / 经验分享 / 问答互助 / 资源汇总 / 接单技巧 / 闲聊灌水

### 7.2 帖子功能

- 发帖（OPC 及以上）、回复、点赞
- 标签：置顶（管理员）、精华（管理员）
- 帖子内容支持富文本编辑（标题 + 正文 + 图片）
- 举报：OPC 用户可举报帖子/评论，管理员处理

### 7.3 积分体系

| 行为 | 积分变化 |
|------|---------|
| 发帖 | +10 |
| 回复 | +3 |
| 帖子被点赞 | +2 |
| 帖子被设为精华 | +50 |
| 完成订单 | +100 |
| 每日登录 | +5 |
| 置顶帖子（消耗） | −200 |
| 加权曝光（消耗） | −100 |

积分消耗规则由管理员后台配置。

### 7.4 私信

- 登录用户间一对一聊天
- 消息通知（站内红点 + 未读数）

### 7.5 关注

- 用户可关注其他用户，查看其发帖动态

---

## 8. 大屏展示页（`/screen`）

- 独立路由，无需登录，专为横屏大屏优化（16:9）
- 深蓝渐变背景 + 发光数字风格
- 三大核心数据（巨字体居中）：累计订单量、累计订单金额、入驻企业数
- 底部滚动字幕：实时动态事件（新订单发布、订单完成、新用户入驻）
- 数据每 10 秒通过 SSE（Server-Sent Events）自动刷新

---

## 9. 认证与登录

支持三种方式并存：
1. **手机号 + 短信验证码**（腾讯云 SMS）
2. **手机号 / 邮箱 + 密码**
3. **微信扫码登录**（微信开放平台 OAuth）

用 **NextAuth.js** 统一管理 session，JWT 存储在 httpOnly Cookie。

---

## 10. 技术架构

### 10.1 技术栈

| 层级 | 选型 |
|------|------|
| 框架 | Next.js 15（App Router + Server Actions） |
| 数据库 | PostgreSQL（腾讯云 TDSQL-C 或云数据库 PostgreSQL） |
| ORM | Prisma |
| 认证 | NextAuth.js v5 |
| 实时推送 | Server-Sent Events（大屏刷新、社区通知） |
| 文件存储 | 腾讯云 COS（用户头像、帖子图片） |
| SMS | 腾讯云 SMS |
| 部署 | 腾讯云 CVM / Lighthouse + PM2，或容器化部署 |
| CI/CD | GitHub + GitHub Actions（自动测试 + 部署到腾讯云） |
| 样式 | Tailwind CSS |

### 10.2 项目目录结构（Next.js App Router）

```
src/
  app/
    (public)/           # 游客可访问页面
      page.tsx          # 首页（唯一游客可见页）
    (auth)/             # 需要登录（OPC 及以上）
      tools/
      finance/
      legal/
      banking/
      equipment/
      orders/
      community/
      community/messages/
    (admin)/            # 管理员专用
      admin/
    screen/             # 大屏，无需登录
    api/                # API 路由（NextAuth、SSE、Webhooks）
  components/
  lib/
    db.ts               # Prisma client
    auth.ts             # NextAuth 配置
  actions/              # Server Actions
  types/
prisma/
  schema.prisma
```

### 10.3 关键数据模型（概要）

- `User`：id, phone, email, password, role(GUEST/OPC/BIZ_OPC/ADMIN), points, createdAt
- `Order`：id, title, description, amount, category, status, authorId, createdAt
- `OrderApplication`：id, orderId, applicantId, reason, status
- `Post`：id, title, content, boardId, authorId, isPinned, isFeatured, createdAt
- `Comment`：id, postId, authorId, content, createdAt
- `Message`：id, fromId, toId, content, readAt, createdAt
- `AdminSubAccount`：id, userId, permissions(JSON), createdBy
- `PointLog`：id, userId, delta, reason, createdAt

---

## 11. 部署与 CI/CD

```
GitHub Push → GitHub Actions →
  1. 运行测试（jest / playwright）
  2. 构建 Next.js
  3. SSH 部署到腾讯云服务器
  4. PM2 重启进程
```

环境变量通过 GitHub Secrets 管理，腾讯云服务器通过 SSH key 认证。

---

## 12. 范围外（本期不做）

- 平台内支付（订单金额仅展示，线下结算）
- 移动端 App（响应式网页即可）
- 多语言支持
- 第三方广告系统
