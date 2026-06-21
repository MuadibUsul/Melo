# API 文档

Base URL: `http://localhost:4000/api/v1`

## 通用约定

- **错误格式**: `{ code: ErrorCode, message: string, details?: {}, traceId?: string }`
- **鉴权**: `Authorization: Bearer <access_token>`
- **刷新**: `POST /auth/refresh` (httpOnly cookie)
- **幂等**: `Idempotency-Key` header (generation) / `WebhookEvent.eventId` (payment)

## 端点列表

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | — | 注册 |
| POST | `/auth/login` | — | 登录 |
| POST | `/auth/refresh` | cookie | 刷新令牌 |
| POST | `/auth/logout` | JWT | 登出 |

### Generation
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/generation/jobs` | JWT | 创建生成任务 |
| GET | `/generation/jobs` | JWT | 任务列表 |
| GET | `/generation/jobs/:id` | JWT | 任务详情 |
| POST | `/generation/jobs/:id/cancel` | JWT | 取消任务 |

### Assets
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/assets` | JWT | 资产列表 |
| GET | `/assets/:id` | JWT | 资产详情 |
| GET | `/assets/:id/play` | JWT | 播放 URL |
| GET | `/assets/:id/download` | JWT | 下载 URL |
| DELETE | `/assets/:id` | JWT | 删除草稿 |

### Tracks
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/tracks/publish` | JWT | 发布作品 |
| GET | `/tracks` | — | 曲库列表 |
| GET | `/tracks/search?q=` | — | 搜索 |
| GET | `/tracks/:id` | — | 作品详情 |
| GET | `/tracks/:id/play` | — | 播放 URL |
| GET | `/tracks/creator/:creatorId` | — | 创作者作品 |

### Social
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/tracks/:id/like` | JWT | 点赞/取消 |
| POST | `/users/:id/follow` | JWT | 关注/取消 |
| POST | `/playlists` | JWT | 创建歌单 |
| GET | `/playlists` | JWT | 我的歌单 |
| POST | `/playlists/:id/tracks` | JWT | 添加到歌单 |
| POST | `/tracks/:id/comments` | JWT | 发表评论 |
| GET | `/tracks/:id/comments` | — | 查看评论 |
| POST | `/tracks/:id/play` | JWT | 记录播放 |

### Billing
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/plans` | — | 套餐列表 |
| GET | `/subscription` | JWT | 我的订阅 |
| POST | `/subscription/create` | JWT | 创建订阅 |
| POST | `/subscription/cancel` | JWT | 取消订阅 |
| POST | `/webhooks/payment` | — | 支付回调 |

### Charts
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/charts/hot` | — | 热歌榜 |
| GET | `/charts/new` | — | 新歌榜 |
| GET | `/charts/genre?genre=` | — | 流派榜 |

### Presets & Voices
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/presets?type=` | — | 官方预设 |
| GET | `/presets/my` | JWT | 我的预设 |
| POST | `/presets` | JWT | 保存预设 |
| DELETE | `/presets/:id` | JWT | 删除预设 |
| GET | `/voices` | — | 音色列表 |

### Admin
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/admin/metrics` | ADMIN | 运营指标 |
| GET | `/admin/users` | ADMIN | 用户列表 |
| POST | `/admin/users/:id/role` | ADMIN | 修改角色 |
| POST | `/admin/users/:id/suspend` | ADMIN | 暂停用户 |
| GET | `/admin/moderation` | ADMIN | 审核队列 |
| POST | `/admin/moderation/:id/review` | ADMIN | 审核决策 |
| GET | `/admin/feature-flags` | ADMIN | 功能开关 |
| POST | `/admin/feature-flags` | ADMIN | 设置开关 |
| GET | `/admin/audit-logs` | ADMIN | 审计日志 |

### Health
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | — | DB/Redis/S3 真实 ping |
