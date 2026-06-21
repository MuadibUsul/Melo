# 执行假设记录 (ASSUMPTIONS)

> 依据计划书 §0 与执行提示 §13.10：不确定项先记录假设并按假设推进，标注“需确认”。

## 计划假设确认 (A1–A7)
| 编号 | 假设 | 当前采用 | 状态 |
| --- | --- | --- | --- |
| A1 | 部署地域 | 默认面向中文市场；本地用 MinIO（S3 兼容），生产可切 R2/OSS/COS | 采用，需确认 |
| A2 | MiniMax 接入 | 已**实测**全球 Host `https://api.minimax.io`，`music-2.6` 有效；契约见 `packages/sdk-minimax` | 已核实 (2026-06-18) |
| A3 | 商业模式 | 免费月度额度 + 包月/包年订阅 + 额度账本 | 采用 |
| A4 | 技术栈 | 全栈 TypeScript（NestJS 模块化单体 + Next.js） | 采用 |
| A5 | 合规 | AI 内容标识 + 声音克隆授权（硬约束） | 采用 |
| A6 | 规模 | v1 可上线/付费/运营/审核；高并发演进期再做 | 采用 |
| A7 | 品牌/法务主体 | 未提供，代号 `minimax-music-platform` + 占位文案 | 需确认 |

## 本仓库迁移说明（与计划 §2「全新项目」的差异）
计划假设为 greenfield；**本仓库已有一个可运行的 Next.js 音乐 MVP**。按用户指示「计划完全优先」，已将其**非破坏性迁移**至 `apps/web/`（move，未删除），作为消费端/创作端前端的起点，后续分阶段把其后端逻辑迁入 `apps/api`（NestJS）。旧的 Supabase/R2 方案被 Prisma/Postgres + S3 取代。

## 需上线前确认（§2.6）
- MiniMax 账户实际套餐 / RPM / 并发上限 / 官方单价与结算货币（当前限速为保守默认值）。
- 目标地域 ICP 备案 / 网络音乐经营许可 / 等保。
- 是否需要原生 App（默认 Web 优先，预留 BFF）。
- 推荐系统是否首发（默认非首发）。
- 商用授权分级（已预留字段）。

## 实测得到的 MiniMax 关键事实（已写入 sdk-minimax）
- `lyrics_generation` 响应中 `lyrics` / `song_title` 在**顶层**（非 `data.*`）。
- `music_generation` **同步但耗时 80–150s**，客户端超时设 290s；返回 `data.audio`（url 或 hex）+ `extra_info.{music_duration,music_sample_rate,bitrate,music_size}`。
- 音频 URL 为美区 OSS 签名直链：无自有对象存储时直接使用，有 R2/S3 时下载转存。
