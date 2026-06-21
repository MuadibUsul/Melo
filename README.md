# minimax-music-platform

MiniMax 驱动的 **AI 音乐生成与聆听平台**（monorepo）。以 MiniMax API 为音频生成内核，提供创作端（简易/专业双模式）、消费端（聆听/榜单/社区）与运营后台。

> 工程实施依据：`20260617_202554__minimax-music-platform__full-platform-design-and-engineering-plan__plan.md`
> 执行路线图：`06181210.md`
> 执行假设记录：`docs/ASSUMPTIONS.md`

## 实施状态

| Phase | 状态 | 说明 |
|-------|------|------|
| **P0 地基** | ✅ | monorepo / config / contracts / sdk-minimax / Prisma / docker-compose |
| **P1 生成闭环** | ✅ | auth + 额度三段式 + generation 状态机 + Worker + realtime + assets + web v2 |
| **P2 完整产品** | ✅ | 发布/审核/曲库/搜索/全局播放器/社交/计费/订阅/榜单/预设/音色/管理后台 |
| **P3 测试** | ✅ | 合约测试 / 额度测试 / 状态机测试 |
| **P4 合规/可观测** | ✅ | AI 标识全链路 / 文档 / 种子数据 |

## 仓库结构（Monorepo · pnpm + Turborepo）

```
apps/
  web/      Next.js App Router — 消费端 + 创作端
  api/      NestJS — 鉴权/计费/额度/生成编排/曲库/榜单/审核/管理/定时任务
  worker/   BullMQ Worker — 异步生成处理器
packages/
  config/       环境校验 (zod)
  contracts/    DTO / zod / 错误码
  sdk-minimax/  MiniMax 适配层 (music/lyrics/tts + 限速/重试/熔断)
infra/          docker-compose (postgres / redis / minio)
docs/           架构 / 假设 / 运行手册
```

## 本地启动

```bash
# 1. 安装依赖（Node ≥20）
corepack enable && pnpm install

# 2. 起本地基础设施
pnpm infra:up

# 3. 配置环境
cp .env.example .env
cp apps/web/.env.example apps/web/.env.local

# 4. 数据库迁移
pnpm --filter @music/api db:migrate

# 5. 开发
pnpm dev
```

## API 端点概览

| 模块 | 端点 |
|------|------|
| auth | `POST /api/v1/auth/register` `login` `refresh` `logout` |
| generation | `POST /api/v1/generation/jobs` `GET .../jobs/:id` |
| assets | `GET /api/v1/assets` `GET .../assets/:id/play` |
| tracks | `POST /api/v1/tracks/publish` `GET /api/v1/tracks` |
| social | `POST /api/v1/tracks/:id/like` `POST /api/v1/users/:id/follow` |
| billing | `GET /api/v1/plans` `POST /api/v1/subscription/create` |
| charts | `GET /api/v1/charts/hot` `GET /api/v1/charts/new` |
| admin | `GET /api/v1/admin/metrics` `POST /api/v1/admin/moderation/:id/review` |
| health | `GET /api/v1/health` (DB/Redis/S3 live ping) |

## 安全 / 合规

- 第三方密钥仅后端，绝不进 `NEXT_PUBLIC_*`
- AI 生成内容强制标识 (`Track.isAiGenerated`)
- 生成失败必退额度（hold→commit/refund 三段式）
- 音频走可过期签名 URL
- 幂等：`Idempotency-Key` (generation) / `WebhookEvent.eventId` (payment)
