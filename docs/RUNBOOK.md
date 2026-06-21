# Runbook · 运行手册

minimax-music-platform 运维操作指南。

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | PostgreSQL 连接串 | `postgresql://app:app@localhost:5433/music` |
| `REDIS_URL` | Redis 连接串 | `redis://localhost:6379` |
| `S3_ENDPOINT` | S3/MinIO endpoint | `http://localhost:9000` |
| `MINIMAX_API_KEY` | MiniMax API Key | 空（mock 模式） |
| `JWT_ACCESS_SECRET` | JWT 签名密钥 | `dev-access-secret-change-me` |

## 本地开发

```bash
# 启动基础设施
pnpm infra:up          # Postgres:5433, Redis:6379, MinIO:9000

# 数据库迁移
pnpm --filter @music/api db:migrate

# 启动全部服务
pnpm dev               # api:4000, web:3000, worker (后台)

# 健康检查
curl http://localhost:4000/api/v1/health
```

## 数据库

```bash
# 创建新迁移
pnpm --filter @music/api db:migrate -- --name descriptive_name

# 重置数据库
pnpm --filter @music/api db:push -- --force-reset

# Prisma Studio
pnpm --filter @music/api exec prisma studio
```

## 常见问题

### MiniMax 生成失败
1. 检查 `MINIMAX_API_KEY` 是否有效
2. 查看 Worker 日志：`[worker] Job ... failed`
3. transient 错误会自动重试 3 次（指数退避）
4. permanent 错误会自动退款

### 额度问题
- 余额查询：`GET /api/v1/entitlement/balance` (需 auth)
- 所有操作留痕在 `CreditLedger` 表
- 月度重置 cron：每月 1 日 00:05

### 审核队列
- 内容自动预筛 → `ModerationCase`
- 人工审核：`POST /api/v1/admin/moderation/:id/review`

## 应急预案

### MiniMax 服务不可用
- Worker 自动重试 3 次后标记 failed
- 用户额度自动退回
- 前端显示"服务繁忙，请稍后再试"

### 数据库故障
- 所有状态持久化在 Postgres
- Redis 仅做缓存/实时计算（余额 mirror、榜单）
- Redis 不可用时：余额从 DB 计算、榜单回退到 DB 查询

### 对象存储故障
- 音频直接使用 MiniMax 返回 URL（直链模式）
- S3 不可用不阻塞生成

## 监控关键指标

| 指标 | 来源 | 告警阈值 |
|------|------|---------|
| Worker 失败率 | BullMQ | > 10% |
| 队列积压 | BullMQ | > 50 jobs |
| MiniMax API 延迟 | Worker 日志 | > 150s |
| 审核队列待处理 | ModerationCase | > 20 |
