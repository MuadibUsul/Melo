# AI 音乐生成与聆听平台 · 全量产品与工程实施计划书

| 项 | 内容 |
| --- | --- |
| 文档类型 | 技术实施计划书（交付给执行型 AI 编程模型 / 高级工程团队直接执行） |
| 生成时间 | 2026-06-17 20:25:54（本地） |
| 规划角色 | 首席技术规划师 / 架构师 / 产品专家 / 资深音乐人 / 资深歌迷 |
| 版本 | v1 |
| 状态 | 待评审 → 待执行 |
| 代号 | `minimax-music-platform`（暂定，下文称“平台”） |

> **本计划书只描述“应该怎么做”，不包含任何业务代码实现。** 文中出现的接口签名、数据模型、DTO、Schema 仅为“设计契约”，供执行模型据此落地，不是成品代码。执行模型必须严格按本计划执行，不得擅自扩大范围。

---

## 0. 关键前置假设（Assumptions）

由于本任务为**全新项目（greenfield）**，没有可读取的现有代码库，以下假设需要执行前确认；若与事实不符，按实际调整但不改变整体架构方向。

1. **A1 部署地域**：默认主要面向中文市场（中国大陆 + 港澳台 + 海外华人），同时保留出海能力。因此默认对象存储/CDN 优先选阿里云 OSS / 腾讯云 COS（或 Cloudflare R2 出海），支付优先微信支付 + 支付宝，并预留 Stripe。**若主要面向海外，则反转优先级。**
2. **A2 MiniMax 接入**：平台所有音频生成均通过 MiniMax 开放平台 API（音乐 / 语音 / 声音克隆）。MiniMax 接口与计费可能随时间变化，**实施前必须以 MiniMax 官方文档与计费台为准再次核对**（见第 9 章“MiniMax 接入契约”，已按 2026-06 公开资料核实）。
3. **A3 商业模式**：免费用户有按月重置的额度（credits）；付费用户按“包月 / 包年”订阅，获得更高额度 + 高级功能。平台向 MiniMax 付费（成本），向终端用户售卖额度/会员（收入），单位经济模型由运营后台监控。
4. **A4 团队与栈偏好**：默认全栈 TypeScript（降低上下文切换成本）。若团队为 Python/ML 背景，见第 6 章备选方案 B。
5. **A5 合规**：AI 生成内容须依法标识（参考中国《生成式人工智能服务管理暂行办法》及 AI 生成合成内容标识相关要求；出海需兼顾 EU AI Act 等）。声音克隆须取得被克隆人授权。**这是硬约束，不是可选项。**
6. **A6 规模目标**：v1 以“可上线、可付费、可运营、可审核”为目标，支撑早期到中等流量；高并发流媒体（HLS 自适应、ClickHouse 级分析、推荐系统）作为后续演进阶段，本计划给出演进路径但不要求 v1 全部落地。
7. **A7 名称/品牌/法务主体**：未提供，先用代号与占位文案；上线前替换。

> 仅当上述假设缺失会导致计划完全无法生成时才需澄清；本计划已基于假设给出可执行方案，可直接推进。

---

# 1. 任务摘要

构建一个以 **MiniMax API 为音频生成内核**的音乐平台，由两大用户侧 + 一个运营侧组成：

- **创作端（Creator Studio / 专业工作台）**：让创作者生成**音乐、音声（语音）等音频内容**。提供
  - **简易模式**：服务轻量/无经验用户，最少输入、预设驱动、一键出歌；
  - **专业模式**：服务专业音乐人，提供歌词结构编辑、参考音频、音色/曲风/情绪/时长精细控制、声音克隆、版本迭代、项目管理；
  - **预设系统**：在与模型交互过程中提供曲风/情绪/音色/歌词模板等预设，省去重复劳动与“无目标试错”。
  - 生成结果可**一键发布**进入公共曲库（类似网易云的“发布”状态）。
- **消费端（聆听端）**：服务音乐爱好者/听众，可听歌、看**排行榜、分类、热榜**、搜索、收藏、评论、关注、歌单（对标网易云音乐 / QQ 音乐的核心体验），全局持久播放器。
- **运营后台**：覆盖**全部内容**的运营管理——用户、订阅与计费、额度、内容审核、曲库与榜单运营、预设与音色目录、数据看板、MiniMax 成本与告警、系统配置、审计日志。

**最终目标**：功能性健全、使用流程合理、UI 简洁美观、合规可运营、单位经济可控的 AI 音乐平台。

---

# 2. 当前项目理解

**当前为全新项目，无既有代码可读。** 本章给出“目标项目”的工程画像，作为后续所有决策的共识基线。

## 2.1 产品定位
“AI 音乐工坊 + 音乐社区”二合一：上游用 MiniMax 把“文字/灵感”变成“可听的歌与语音”，下游把作品沉淀为可被发现、聆听、互动、排名的内容生态，中间用会员与额度完成商业闭环。

## 2.2 推荐技术栈（详见第 5、6 章）
- **前端**：Next.js（App Router）+ TypeScript + Tailwind CSS + shadcn/ui（消费端/创作端）；运营后台用 Ant Design / Refine（CRUD 友好）。状态：TanStack Query（服务端态）+ Zustand（全局播放器等客户端态）。音频可视化 wavesurfer.js，流媒体 hls.js（演进期）。
- **后端**：NestJS 模块化单体（Modular Monolith）+ TypeScript。
- **异步任务**：BullMQ（基于 Redis）+ 独立 Worker 进程。
- **实时**：Socket.IO（或 SSE）推送生成进度。
- **数据**：PostgreSQL（主库，Prisma ORM）+ Redis（缓存/限流/额度计数/队列/会话/分布式锁）+ S3 兼容对象存储（音频与封面）+ CDN（签名 URL）。搜索 v1 用 PG 全文检索，演进期 Meilisearch/ES。分析 v1 用 PG 分区表 + 物化视图，演进期 ClickHouse。
- **支付**：可插拔 Billing 适配层（微信支付/支付宝/Stripe）。
- **可观测性**：pino 结构化日志 + OpenTelemetry + Prometheus/Grafana + Sentry + 自建 Provider 成本埋点。

## 2.3 关键目录（Monorepo 设想，详见第 8 章）
`apps/web`（消费端+创作端）、`apps/admin`（运营后台）、`apps/api`（NestJS）、`apps/worker`（生成 Worker）、`packages/contracts`（共享 DTO/zod 类型）、`packages/ui`、`packages/sdk-minimax`（MiniMax 适配层）、`packages/config`、`infra/`。

## 2.4 核心模块（领域划分）
auth、users、billing/subscription、entitlement（额度/credit 账本）、generation（音乐/语音/克隆任务编排）、assets（生成产物）、catalog/tracks（已发布作品）、social（点赞/评论/关注/歌单）、charts（榜单）、presets（预设）、voices（音色目录与克隆）、moderation（审核）、media（存储与 CDN 签名）、provider（MiniMax 适配）、search、notifications、admin、telemetry。

## 2.5 关键数据流
1. **生成流**：用户输入 → 解析预设得有效参数 → 估算并冻结额度 → 入队 → Worker 调 MiniMax → 下载/解码音频 → 落对象存储 + 算时长/波形 → 生成 draft asset → 提交/退款额度 → 实时通知。
2. **发布流**：draft asset → 填元数据 → 自动审核（歌词/封面/授权）→ 通过则 published（进曲库/榜单/主页），否则进审核队列。
3. **消费流**：发现/榜单/搜索 → 播放（计 play 事件，带去重与防刷）→ 互动（赞/评/藏/关注）→ 反哺榜单与推荐。
4. **计费流**：下单 → 第三方支付 → Webhook（幂等）→ 同步订阅状态与额度授权。

## 2.6 我尚未掌握、但可能重要的信息（执行前补齐）
- MiniMax 账号的实际套餐、RPM/并发上限、官方单价与结算货币。
- 目标地域的 ICP 备案 / 网络音乐经营许可 / 等保要求等合规细节。
- 是否需要原生 App（本计划默认 Web 优先，预留 BFF 以便后续 App 复用 API）。
- 推荐系统是否为首发硬需求（默认非首发）。
- 是否需要“商用授权”分级（影响版权与定价，本计划预留字段）。

---

# 3. 目标与非目标

## 目标（v1 必达）
1. 账号体系（邮箱/手机/第三方登录）与 RBAC。
2. 创作端简易模式：文本/预设 → MiniMax 音乐生成 + 语音生成，异步进度，预览试听。
3. 创作端专业模式：歌词结构编辑、参考音频/Cover、音色/情绪/曲风/时长控制、声音克隆、项目与版本管理。
4. 预设系统（官方预设 + 用户自存预设）。
5. 资产库（草稿/版本/管理）与**一键发布**到公共曲库。
6. 消费端：发现、榜单（热/飙升/新歌/分类）、分类、搜索、全局播放器、歌词、点赞/评论/关注/歌单/分享、创作者主页、AI 标识。
7. 计费：免费额度（月度重置）+ 包月/包年订阅 + 额度（credit）账本 + 权益网关。
8. 运营后台：用户/订阅/额度/内容审核/曲库与榜单运营/预设与音色/数据看板/MiniMax 成本与告警/系统配置/审计日志。
9. 合规：AI 内容标识 + 声音克隆授权 + 审核流水线（先审后发可配）。
10. 可观测性与成本监控、安全基线、幂等与失败降级。

## 非目标（v1 明确不做，防止过度实现）
- ❌ 原生 iOS/Android App（仅留 API 复用空间）。
- ❌ 个性化推荐算法/向量召回（v1 用规则位 + 榜单 + 分类）。
- ❌ 自研音频生成模型（完全依赖 MiniMax）。
- ❌ 实时多人协作编曲、DAW 级多轨混音台。
- ❌ UGC 直播、短视频、IM 私信。
- ❌ 复杂分成结算/创作者提现（预留数据，不做资金流）。
- ❌ HLS 自适应码流、ClickHouse、跨区多活（演进阶段再做，但架构需为其留接口）。
- ❌ 听歌识曲、K 歌、版权曲库引进。

---

# 4. 约束条件

- **技术约束**：全栈 TS；前后端通过 `packages/contracts` 共享类型与 zod 校验；后端模块化单体，模块间通过明确接口，禁止跨模块直接访问对方数据表。
- **MiniMax 约束**：音乐生成存在免费档（`music-2.6-free`，低 RPM）与付费档（`music-2.6`）；存在 RPM/并发上限。平台必须做**排队 + 限速 + 重试 + 熔断**，绝不把 MiniMax 限流直接暴露给用户。Worker 必须处理 hex 编码音频与（可选）URL 两种返回形态。
- **安全约束**：MiniMax Key 仅存后端密钥管理，绝不下发前端；所有音频通过签名、可过期 URL 经 CDN 分发；输入全量校验；遵循 OWASP；敏感数据加密存储。
- **性能约束**：消费端首屏与播放“感知即时”；生成为长任务（数十秒至分钟级），必须异步 + 进度反馈，禁止同步阻塞 HTTP。播放音频走 Range 请求/CDN。
- **数据约束**：额度采用**追加式账本（append-only ledger）**，任何扣减/退还均留痕可审计；play 事件高写入量，需分区与防刷。
- **兼容性约束**：浏览器支持主流 Chromium/Safari/Firefox 近两个大版本；移动端响应式优先；i18n 至少中/英。
- **合规约束（硬边界）**：
  - AI 生成内容**必须标识**（数据标记 + UI 角标 + 文件元数据，必要时音频水印）。
  - 声音克隆**必须**采集并留存授权凭证，禁止克隆真实自然人/公众人物未授权声音。
  - 歌词/封面/曲风模仿须经审核，防侵权、违法、未成年人不适内容；提供举报与下架。
- **用户明确要求**：双模式（简易/专业）、预设减少重复劳动、一键发布、对标网易云的聆听体验、UI 简洁美观、流程合理。
- **不可触碰边界**：不得在前端暴露任何第三方密钥；不得绕过审核直发可疑内容；不得在生成失败时仍扣除额度；不得对未成年人提供不适内容或诱导沉迷。

---

# 5. 推荐总体方案（主方案）

## 5.1 核心思路
**“一个内核三个面”**：以 `generation` 领域 + `provider`（MiniMax 适配层）为统一音频生产内核，向上分别服务创作端、消费端、运营端三张“脸”。所有音频生产经由统一的**任务编排状态机**与**额度账本**，保证“可计费、可观测、可重试、可退款、可审计”。前端用一套设计系统保证“简洁美观一致”，运营后台用成熟 CRUD 框架保证“管得全、上得快”。

## 5.2 系统架构（逻辑视图）
```
[Web 消费/创作端 (Next.js)]   [Admin 运营后台 (Next.js+AntD/Refine)]
              \                         /
               \                       /
            [API 网关层 / NestJS 模块化单体]
   auth · users · billing · entitlement · generation · assets
   catalog · social · charts · presets · voices · moderation
   media · search · notifications · admin · telemetry
        |            |                |             |
   [PostgreSQL]   [Redis]      [对象存储+CDN]   [Socket.IO 网关]
        |            |
        |        [BullMQ 队列]
        |            |
        |     [Worker 进程] --调用--> [packages/sdk-minimax] --HTTPS--> [MiniMax API]
        |                                   ↑
   [审计/账本]                          [成本埋点+熔断+限速]
```

## 5.3 模块拆分（后端领域模块职责）
- **auth**：注册/登录（邮箱密码、手机 OTP、OAuth：微信/Apple/Google）、JWT access + 轮换 refresh、登出、风控钩子。
- **users**：用户资料、创作者资料（creator_profile）、关注关系入口。
- **billing/subscription**：plans、subscriptions 生命周期（trial/active/past_due/canceled/expired）、优惠码、发票、对接 payments。
- **entitlement**：权益与额度网关。`canPerform(userId, action)` + 额度账本（hold/commit/refund/grant/consume）。所有生成入口的“守门人”。
- **payments**：可插拔支付适配（Stripe/微信/支付宝）+ Webhook 幂等处理 + 退款。
- **generation**：任务编排状态机（music/tts/voice_clone），是“内核”。
- **provider（sdk-minimax 的服务封装）**：把领域参数映射为 MiniMax 请求，处理 hex/URL、轮询、错误归类、限速、熔断、成本记账。
- **assets**：生成产物（原始音频、转码、波形、封面、时长、状态 draft/published）。
- **catalog/tracks**：已发布作品、可见性、播放/点赞/评论计数、与榜单/搜索/主页打通。
- **social**：点赞、评论（含层级与审核态）、关注、歌单（用户/编辑歌单）、分享。
- **charts**：榜单计算（热/飙升/新歌/分类/创作者），Redis sorted set 实时热度 + 定时落库。
- **presets**：预设（曲风/情绪/音色/歌词模板/风格包），官方 + 用户自存。
- **voices**：系统音色目录（缓存 MiniMax 音色清单）+ 用户声音克隆（含授权凭证）。
- **moderation**：审核用例（先审后发可配）、自动预筛 + 人工队列 + 发布后举报。
- **media**：对象存储读写、CDN 签名 URL、转码触发、封面处理。
- **search**：作品/创作者/歌单搜索（PG FTS → Meili 演进）。
- **notifications**：站内信/邮件/可选短信（生成完成、审核结果、续费提醒）。
- **admin**：聚合运营能力的后台 API（受 admin RBAC 保护）。
- **telemetry**：日志/指标/追踪/成本看板数据源。

## 5.4 数据流变化（关键路径）
- **生成任务状态机**：`queued → processing → (succeeded | failed | canceled)`；succeeded 产出 draft asset。
- **额度三段式**：提交时 `hold`（冻结）→ 成功 `commit`（落定）→ 失败/超时 `refund`（退还）。**任何情况下失败不扣费。**
- **发布**：`asset(draft) → track(pending_review) → (published | rejected)`。
- **热度**：play/like/comment 事件 → Redis 实时累加 → 定时任务按时间衰减算分 → 写 chart_entries。

## 5.5 接口变化（对外 API 风格）
RESTful + JSON，路径 `/api/v1/...`，鉴权 Bearer（Web 用 httpOnly cookie 承载 refresh）。长任务返回 `jobId`，前端通过 WebSocket 订阅 `job.updated` 或轮询 `GET /generation/jobs/:id`。详见第 9 章。

## 5.6 状态管理变化（前端）
- **全局持久播放器**：在 Root Layout 挂载**单例** `<audio>`（演进期换 hls.js），用 Zustand `usePlayerStore` 管理播放队列/当前曲目/进度/模式（顺序/随机/单曲），**路由切换不打断播放**（对标网易云）。
- **服务端态**：TanStack Query 统一缓存与失效（曲库、榜单、任务状态）。
- **生成进度态**：订阅 WebSocket 写入 query cache，驱动 UI 进度条/状态。

## 5.7 错误处理策略
- 统一异常过滤器：领域错误 → 稳定错误码（如 `ENTITLEMENT_INSUFFICIENT_CREDITS`、`PROVIDER_RATE_LIMITED`、`MODERATION_REQUIRED`）。
- Provider 错误归类：`transient`（429/5xx/超时，可重试）vs `permanent`（参数/鉴权/内容拒绝，不重试，立即退款额度）。
- 前端按错误码渲染**可操作**提示（如额度不足 → 引导升级；限流 → 已排队稍候）。

## 5.8 日志策略
- 结构化日志（pino），全链路 `traceId`（贯穿 API→队列→Worker→Provider，复用 MiniMax `trace_id` 做关联）。
- 关键审计事件（额度变动、发布、审核裁决、退款、权限变更）写 `audit_logs`，与业务库分离查询。
- **绝不记录**：密钥、完整鉴权 token、用户隐私原文（脱敏）。

## 5.9 配置策略
- 12-Factor，所有可变项走环境变量 + `packages/config` 集中校验（zod）。
- 运营可调项（额度单价、套餐、榜单权重、预设、自动审核阈值、功能开关 feature flag）入库，运营后台可改，热生效（带审计）。

## 5.10 回滚策略
- 每个阶段（Phase）独立可发布、可回滚；DB 迁移**向前兼容**（先加列/表，不破坏旧读路径；删除分两步：停用→下版移除）。
- 功能开关包裹新功能，问题时关开关即回滚体验，不必回滚部署。
- Provider 适配层抽象，MiniMax 异常时可降级（排队/限额/提示），并为“接入备用音频供应商”预留接口（不在 v1 实现）。

---

# 6. 备选方案对比

> 主方案 = 全栈 TypeScript + NestJS 模块化单体 + Next.js（理由：一种语言贯穿、契约共享、生态完善、招聘与维护成本低、足以支撑 v1→中等规模）。

## 备选 A：Python(FastAPI) + Next.js 前端
- **做法**：后端用 FastAPI，Celery/Arq 做异步，SQLAlchemy/Tortoise + Alembic，前端仍 Next.js。
- **优点**：异步与 AI 生态友好；若团队 ML 背景，调 MiniMax/做后续模型实验更顺。
- **缺点**：前后端类型契约割裂（需额外 OpenAPI→TS 生成）；团队需同时维护 Py+TS 两套规范。
- **风险**：契约漂移、双栈运维复杂度。
- **不作首选原因**：本平台后端 80% 是 Web 工程（鉴权/计费/内容/社交/榜单），AI 部分仅是“调 API”，TS 单语言收益更大。**若 A4 假设反转（团队偏 Python），A 可升为首选。**

## 备选 B：Serverless / BaaS 优先（Supabase + Next.js + 边缘函数 + 队列服务）
- **做法**：用 Supabase（Postgres+Auth+Storage）+ Next.js Server Actions/Route Handlers + 托管队列（如 Upstash QStash）跑生成回调。
- **优点**：起步极快、基础设施少、初期成本低。
- **缺点**：长任务/Worker/熔断/复杂 RBAC/审核流在 Serverless 下编排受限；厂商锁定；冷启动与执行时长限制不利于轮询型生成。
- **风险**：随复杂度上升被迫迁移，重写成本高。
- **不作首选原因**：本平台的“生成编排 + 额度账本 + 审核 + 榜单”是长生命周期、强一致、需常驻 Worker 的工作负载，长期看常驻服务更稳。**适合做极早期 MVP 验证，不适合作为正式架构。**

## 备选 C：微服务化（按域拆多服务 + 消息总线）
- **做法**：auth/billing/generation/catalog 等各自独立服务 + Kafka/NATS。
- **优点**：独立伸缩、团队边界清晰。
- **缺点**：早期严重过度工程，分布式事务/可观测/部署复杂度暴涨。
- **风险**：小团队被运维拖垮、迭代变慢。
- **不作首选原因**：v1 用户与团队规模不需要；主方案的**模块化单体**已用清晰模块边界为“将来按需拆分”留好缝（generation/worker 已天然可独立部署）。

---

# 7. 具体实施步骤（最重要章节 · 分阶段）

> 阶段策略：先打地基与“最小生成闭环”，再扩功能，再硬化测试，最后清理合规与文档上线。每个 Phase 结束都应可演示、可测试、可回滚。函数/接口签名见第 9 章；下文写清职责、输入输出、调用关系，不写完整实现。

## Phase 0：准备与确认（地基）
**目标**：搭好骨架与“轨道”，让后续每一步都在规范内进行。

- 要检查/确认：
  - 确认 A1–A7 假设；拿到 MiniMax `API_KEY`、`GroupId`、可用模型与 RPM/并发上限、官方单价。
  - 确认对象存储/CDN/支付/短信服务商账号与回调域名。
- 要建立（基础设施与规范，**非业务代码**）：
  - 初始化 Monorepo（pnpm + Turborepo），创建 `apps/*`、`packages/*` 空骨架与 tsconfig/eslint/prettier/commitlint。
  - `packages/config`：集中环境变量定义与 zod 校验（DB/Redis/对象存储/MiniMax/支付/JWT 等）。
  - `packages/contracts`：建立共享 DTO 与 zod schema 的占位结构（按域分文件）。
  - `apps/api`：NestJS 启动骨架 + 全局异常过滤器 + 日志（pino）+ 健康检查 + Swagger（仅非生产）。
  - DB：接入 PostgreSQL + Prisma，建立**初始 schema 迁移**（仅核心表骨架，见第 9 章）。
  - Redis、BullMQ、对象存储 SDK、Socket.IO 网关接通“连通性验证”（health/ping）。
  - `packages/sdk-minimax`：仅做**只读连通性探针**（如调用一次极短 TTS 验证鉴权与 hex 解码链路），确认地域 Host 与返回格式。
  - CI（lint+typecheck+test+build）与本地 `docker-compose`（pg/redis/minio）。
  - `apps/web` 与 `apps/admin` 起最小可运行壳 + 设计系统初始化（Tailwind/shadcn；AntD/Refine）。
- 要避免：此阶段不写任何业务逻辑、不接真实支付/不批量调用 MiniMax（仅探针）。

**产出/验收**：本地一键起服务；健康检查全绿；MiniMax 探针成功；CI 通过。

## Phase 1：最小可用生成闭环（MVP 内核）
**目标**：登录用户能在**简易模式**下用 MiniMax 生成一首歌/一段语音，看到进度，试听，存入资产库，且**免费额度被正确扣减/失败退款**。这是整个产品的“心跳”。

逐项落地：
1. **auth（最小集）**：邮箱密码注册/登录 + JWT/refresh。新增 `AuthService.register/login/refresh/logout`；前端登录页与会话保持。
2. **entitlement（最小集）**：
   - 建 `plans`（先内置 free 套餐）、`credit_ledger`、`credit_balances`（Redis 镜像）。
   - `EntitlementService.getBalance(userId)`、`hold(userId, cost, ref)`、`commit(holdId)`、`refund(holdId)`、`grantMonthly(userId)`。
   - 额度成本表（可配）：音乐生成 = N credits；TTS 每 ≤K 字符 = M credits。
3. **provider（MiniMax 适配）** in `packages/sdk-minimax` + `provider` 模块：
   - `MiniMaxClient.generateMusic(params)`、`textToSpeech(params)`、`textToSpeechAsync/queryAsync`、（Phase 4）`cloneVoice`。
   - 负责：构造请求、Bearer+GroupId、hex→Buffer 解码、（若用 url 形态）下载、错误归类（transient/permanent）、限速（令牌桶）、超时、重试（指数退避）、熔断、成本记账。
4. **generation 状态机**：
   - `POST /generation/jobs`：校验输入 → 解析（Phase 1 用最简预设）→ 估算 cost → `entitlement.hold` → 建 `generation_jobs(queued)` → 入 BullMQ → 返回 `jobId`。**幂等**：`idempotencyKey` 命中则返回既有 job。
   - Worker `generation.processor`：`processing` → 调 provider → 成功则下载/落对象存储 + 算时长/波形 → 建 `assets(draft)` → `succeeded` → `entitlement.commit` → 发 `job.updated`；失败 → `failed` + `entitlement.refund` + 发事件 + 重试策略。
5. **media（最小集）**：对象存储上传、生成可过期签名播放 URL；波形 peaks 计算（服务端用 ffmpeg/音频库，存 JSON）。
6. **assets（最小集）**：列表/详情/删除草稿；试听用签名 URL。
7. **实时**：Socket.IO 按 `userId` 房间推 `job.updated`；前端订阅更新进度。
8. **前端简易模式 v1**：表单（描述/情绪预设/时长/是否纯音乐；TTS：文本/音色/情绪）→ 提交 → 进度卡片 → 试听播放器 → 存入“我的作品（草稿）”。

**产出/验收**：免费用户能成功生成音乐与语音；额度扣减/失败退款正确；可试听；幂等生效。

## Phase 2：完善功能（扩展为完整产品）
> 本阶段较大，按子里程碑推进。

### 2A 发布与消费端基础
- **catalog/tracks**：`POST /tracks/publish`（从 draft asset 发布）。建 `tracks`（status=pending_review）。**一键发布**对话框：标题/封面（上传或后续生成）/歌词/曲风/标签/语言/可见性，AI 标识自动置 true。
- **moderation（最小先审后发）**：发布触发自动预筛（歌词文本策略 + 封面图像扫描）；命中策略→人工队列；通过→ published。
- **消费端 v1**：曲库/作品详情页（封面/标题/创作者/播放数/歌词/AI 角标）、**全局持久播放器**（队列/进度/模式）、创作者主页、基础搜索（PG FTS：标题/创作者/标签）。
- **social v1**：点赞、收藏到歌单、关注创作者；play 事件上报（带去重与最小播放时长阈值）。

### 2B 商业化闭环
- **billing/subscription + payments**：plans（free/monthly/yearly）、下单、支付适配（先接一个真实渠道，其余留适配位）、Webhook 幂等（`webhook_events` 去重）、订阅生命周期、续费/取消/到期。
- **entitlement 完整化**：付费套餐月度额度授予、按订阅周期重置（定时任务）、权益开关（专业模式/克隆/并发数/最大时长/商用授权/免水印/优先队列）。
- **前端**：定价页、订阅管理、额度余额与用量展示、额度不足引导升级。

### 2C 专业模式与预设
- **创作端专业模式**：歌词结构编辑器（`[verse]/[chorus]/[bridge]` 等标签）、参考音频上传/Cover（对接 `music-cover`）、曲风/情绪/时长/采样率/比特率/纯音乐控制、TTS 高级项（语速/音量/音调/情绪/发音词典/停顿 `<#x#>`/语言增强）、**项目与版本管理**（同一灵感多版本、重生成、A/B 对比）。
- **presets**：官方预设（运营后台维护的曲风/情绪/音色/歌词模板/“风格包”）+ 用户自存预设；简易/专业模式均可“一键套用”，**减少重复劳动与无目标试错**（直接命中用户需求）。
- **voices**：系统音色目录（缓存 MiniMax 音色清单 + 试听样例 + 标签/语言/性别筛选）。

### 2D 榜单与分类
- **charts**：热榜/飙升榜/新歌榜/分类榜/创作者榜。实时热度用 Redis sorted set，定时任务按**时间衰减加权**算分写 `chart_entries`。**防刷**：按用户/设备去重、最小播放时长、频率上限、异常流量过滤。
- **分类**：按曲风/情绪/场景/语言聚合页。
- **comments**：评论（含层级、审核态、举报）。

**产出/验收**：可发布、可聆听、可付费、可看榜、专业模式与预设可用。

## Phase 3：测试与验证
**目标**：把“能跑”变成“可信赖”。详见第 10 章测试计划，本阶段任务化执行：
- 补齐单元测试（额度账本三段式、状态机迁移、Provider 错误归类、防刷计数、Webhook 幂等）。
- 集成测试（生成端到端用 MiniMax sandbox/mock；发布→审核→上榜全链路；支付→Webhook→额度授权）。
- 回归测试（核心用例纳入 CI 必过）。
- 边界与错误路径测试（额度为 0、限流、超时、重复提交、并发抢占额度、非法歌词/封面被拦截）。
- 性能测试（生成排队吞吐、播放签名 URL 与 CDN、榜单查询、列表分页）。
- 安全测试（鉴权越权、签名 URL 过期、注入、限流、密钥不外泄）。
- 手动验收（第 10.7 节脚本）。

## Phase 4：清理、合规、文档与上线
**目标**：合规达标、可观测、可运维、可上线。
- **合规**：AI 内容标识全链路（DB+UI 角标+文件元数据，必要时音频水印）；声音克隆授权采集与留存；审核策略阈值与申诉流程；隐私政策/用户协议/未成年人保护与防沉迷提示占位接入。
- **可观测性**：Sentry、指标看板、**MiniMax 成本看板**（按调用记 characters/次数与估算成本，预算告警、熔断）、关键告警（队列积压、失败率、支付异常）。
- **性能/安全收尾**：缓存策略、限流细化、对象存储生命周期、备份与恢复演练。
- **演进预留（不在 v1 实现，仅留接口/文档）**：HLS 自适应、Meilisearch、ClickHouse 分析、推荐系统、备用音频供应商、原生 App BFF。
- **文档**：README、架构图、运行手册（Runbook）、运营后台操作手册、API 文档、应急预案。
- **清理**：移除探针/临时开关、统一日志级别、删除死代码、整理种子数据。

**产出/验收**：通过第 11 章全部验收清单，可灰度上线。

---

# 8. 文件级修改清单

> 本项目为全新工程，绝大多数为 `create`。下表为**代表性模块/文件结构**（执行模型应在每个模块内按同一约定展开补全更细文件），并标注“给执行模型的操作建议”。注意：这是**给其他模型的计划**，本规划阶段不实际创建这些文件（除本计划书外）。

| 文件/目录路径 | 操作类型 | 修改目的 | 关键改动 | 风险等级 |
| --- | --- | --- | --- | --- |
| `package.json` / `pnpm-workspace.yaml` / `turbo.json` | create | Monorepo 与脚本编排 | workspaces、统一 scripts | 低 |
| `docker-compose.yml`、`infra/` | create | 本地与部署基础设施 | pg/redis/minio、部署清单 | 中 |
| `.env.example` | create | 环境变量样例 | 列出所有 key（不含真值） | 低 |
| `.env`（真实密钥） | no-touch | 仅运维注入，禁止入库/硬编码 | — | 高 |
| `packages/config/src/env.ts` | create | 集中环境校验 | zod schema + 导出 typed config | 中 |
| `packages/contracts/src/**` | create | 前后端共享 DTO/zod | 各域请求/响应/事件契约 | 中 |
| `packages/sdk-minimax/src/client.ts` | create | MiniMax 客户端 | music/tts/async/clone + hex 解码 + 错误归类 | 高 |
| `packages/sdk-minimax/src/errors.ts` | create | 错误分类 | transient/permanent 映射 | 高 |
| `packages/ui/**` | create | 共享 UI 组件与设计令牌 | 播放器、卡片、表单原子 | 低 |
| `apps/api/src/main.ts` / `app.module.ts` | create | API 启动与装配 | 全局过滤器/日志/守卫 | 中 |
| `apps/api/src/modules/auth/**` | create | 鉴权 | service/controller/guards/strategies | 高 |
| `apps/api/src/modules/users/**` | create | 用户/创作者资料 | service/controller | 低 |
| `apps/api/src/modules/entitlement/**` | create | 额度与权益网关 | ledger/balance/hold-commit-refund | 高 |
| `apps/api/src/modules/billing/**` | create | 套餐与订阅 | plans/subscription 生命周期 | 高 |
| `apps/api/src/modules/payments/**` | create | 支付适配与 Webhook | adapter 接口 + 幂等处理 | 高 |
| `apps/api/src/modules/provider/**` | create | MiniMax 领域封装 | 映射/限速/熔断/成本记账 | 高 |
| `apps/api/src/modules/generation/**` | create | 生成状态机与入口 | controller + 状态服务 + 幂等 | 高 |
| `apps/api/src/modules/assets/**` | create | 生成产物管理 | CRUD + 试听签名 | 中 |
| `apps/api/src/modules/media/**` | create | 存储与 CDN 签名 | upload/sign/transcode 触发 | 中 |
| `apps/api/src/modules/catalog/**` | create | 已发布作品 | publish + 详情 + 计数 | 中 |
| `apps/api/src/modules/social/**` | create | 赞/评/关注/歌单 | service/controller | 中 |
| `apps/api/src/modules/charts/**` | create | 榜单计算 | sorted set + 定时算分 | 中 |
| `apps/api/src/modules/presets/**` | create | 预设系统 | 官方/用户预设 CRUD | 低 |
| `apps/api/src/modules/voices/**` | create | 音色目录与克隆 | 目录缓存 + 克隆授权 | 高 |
| `apps/api/src/modules/moderation/**` | create | 审核流水线 | 自动预筛 + 人工队列 | 高 |
| `apps/api/src/modules/search/**` | create | 搜索 | PG FTS（演进 Meili） | 低 |
| `apps/api/src/modules/notifications/**` | create | 通知 | 站内信/邮件/短信 | 低 |
| `apps/api/src/modules/admin/**` | create | 运营后台 API | 受 admin RBAC 保护 | 高 |
| `apps/api/src/modules/telemetry/**` | create | 可观测与成本 | 指标/成本看板数据源 | 中 |
| `apps/api/prisma/schema.prisma` | create | 数据模型 | 见第 9 章 | 高 |
| `apps/api/prisma/migrations/**` | create（工具生成） | 迁移 | 向前兼容 | 高 |
| 已生成的 migration SQL | no-touch（手改） | 防破坏历史迁移 | 仅追加新迁移 | 高 |
| `apps/worker/src/main.ts` | create | Worker 启动 | 注册 BullMQ 处理器 | 高 |
| `apps/worker/src/processors/generation.processor.ts` | create | 生成消费者 | 调 provider + 落库 + 退款 | 高 |
| `apps/worker/src/processors/charts.processor.ts` | create | 榜单定时算分 | cron job | 中 |
| `apps/worker/src/processors/entitlement-reset.processor.ts` | create | 额度月度重置 | cron + 周期对齐 | 中 |
| `apps/web/**`（消费端+创作端 Next.js） | create | 用户前台 | 路由/页面/全局播放器/双模式 | 中 |
| `apps/web/app/_components/GlobalPlayer.tsx` | create | 全局持久播放器 | 单例 audio + Zustand store | 中 |
| `apps/admin/**`（运营后台） | create | 运营后台 | AntD/Refine CRUD + 看板 | 中 |
| `tests/**`、各模块 `*.spec.ts` | create | 测试 | 单元/集成/e2e | 中 |
| `docs/**`（架构/运行手册/API） | create | 文档 | 上线必备 | 低 |

操作类型说明：`read`/`modify`/`create`/`delete`/`no-touch`。本项目无既有文件，故主要为 `create`；`no-touch` 用于密钥文件与已生成迁移（只追加、不手改历史）。

---

# 9. 接口 / 数据结构设计

> 仅给“设计契约”（字段、类型、必填、默认、示例、兼容性、错误），不写实现。命名可按团队规范微调，但语义需保持一致。

## 9.1 MiniMax 接入契约（按 2026-06 公开资料核实，实施前以官方为准）

**鉴权**：HTTP Header `Authorization: Bearer <API_KEY>`；多数接口需 `GroupId`（query 或客户端配置）。区域 Host：全球 `https://api.minimax.io`、中国大陆 `https://api.minimaxi.chat`、美西 `https://api-uw.minimax.io`。

**(a) 音乐生成** `POST /v1/music_generation`
- 入参：
  - `model`：`music-2.6`（付费/Token Plan，RPM 高）｜`music-2.6-free`（免费档，RPM 低）｜`music-cover` / `music-cover-free`（翻唱）。
  - `prompt`：风格/情绪/场景描述（如“流行, 忧郁, 雨夜”）。`is_instrumental:true` 时**必填**。
  - `lyrics`：歌词，支持 `[verse]`/`[chorus]` 等结构标签与换行；`is_instrumental:true` 时可省。
  - `is_instrumental`：bool，默认 false（true=纯音乐无人声）。
  - `audio_setting`：`{ sample_rate, bitrate, format }`（如 44100 / 256000 / `mp3`）。
  - Cover 专用：`audio_url` 或 `audio_base64` 或 `cover_feature_id`（两步式，先调 Music Cover 预处理），三者互斥择一。
- 返回：`data.audio`（**hex 编码音频**）+ `data.status`；`extra_info`（`music_duration` 毫秒、`music_sample_rate`、`music_channel`、`bitrate`、`music_size`）；`trace_id`；`base_resp{status_code,status_msg}`。部分通道支持 `output_format:"url"` 直接返回下载链接（**需核实官方是否支持**；适配层两种都要兼容）。
- 注意：歌词长度有上限（旧 `music-01` 约 600 字符，`music-2.6` 以官方为准）；免费档 RPM 低，必须排队限速。

**(b) 语音合成 T2A v2** `POST /v1/t2a_v2`
- `model`：`speech-2.6-hd` / `speech-2.6-turbo`（最新，支持更多语种）/ `speech-02-hd` / `speech-02-turbo` / `speech-2.8-hd` 等。
- `text`：待合成文本（单次约上限 1 万字符）。
- `voice_setting`：`{ voice_id, speed, vol, pitch, emotion }`；`emotion` 取值如 `happy/sad/angry/fearful/disgusted/surprised/calm/fluent/neutral/auto`（与模型相关）。
- `audio_setting`：`{ audio_sample_rate, bitrate, format, channel }`。
- `language_boost`：语言增强（如 `Chinese`、`Chinese,Yue`、`auto`），中文/粤语区分等场景必备。
- 可选：`pronunciation_dict`（发音词典）、`voice_modify{pitch,intensity,timbre,sound_effects}`、`stream` + `stream_options{exclude_aggregated_audio}`（SSE 流式）、句级时间戳（字幕）。
- 返回：`data.audio`（hex；流式时分片 `status:1`，末片 `status:2`）+ `trace_id`。系统音色 300+（如 `Chinese (Mandarin)_Warm_Bestie`、`English_expressive_narrator`）。亦提供 WebSocket `wss://.../v1/t2a_v2`（`task_start`/`task_continue`）。

**(c) 长文本异步 TTS** `POST /v1/t2a_async_v2`
- 入参：`model` + (`text` 或 `text_file_id`，二选一) + `voice_setting` + `audio_setting` 等。
- 轮询：`GET /v1/query/t2a_async_query_v2?task_id=...` → `status`（`processing/success/failed/expired`）+ `file_id`（成功时）→ 再经文件检索下载。
- 注意：异步**不支持 WAV**。适合有声书/长播报。

**(d) 声音克隆**
- 经 Files API 上传样本（10s–5min、<20MB、mp3/m4a/wav）得 `file_id` → 克隆接口得 `voice_id`，可在 T2A 复用；训练约 30s；可用 `<#x#>`（0.01–99.99s）插停顿。
- **平台硬约束**：克隆前必须采集并留存授权凭证（见 voices/moderation）。

**(e) 计费（参考值，需以官方计费台为准）**
- TTS：turbo ≈ $30/百万字符、HD ≈ $50/百万字符（1 字符≈1 token）。
- 声音克隆 ≈ $3/音色。音乐生成按次计费。
- 第三方转售价（如某聚合平台 ≈ $0.035/次）**不代表 MiniMax 官方价**，仅作量级参考。
- **行动项**：实施前在 MiniMax 官方台核实单价 → 据此设定平台额度单价与套餐定价，保证毛利为正。

**(f) 适配层职责（`packages/sdk-minimax`）**
- 统一封装上述端点；hex→Buffer 解码；URL 形态下载；错误归类（`429/5xx/超时`=transient 可重试；`参数/鉴权/内容拒绝`=permanent 不重试）；令牌桶限速（按 model 分桶）；超时与指数退避重试；熔断；每次调用记 `{model, units(字符/次数), estCost, traceId}` 供成本看板。

## 9.2 核心数据模型（Prisma 风格，节选关键表与字段）
> 仅列关键字段与关系；执行模型补全索引、约束、枚举、审计字段（created_at/updated_at/deleted_at）。

```prisma
model User {
  id            String   @id @default(cuid())
  email         String?  @unique
  phone         String?  @unique
  passwordHash  String?
  displayName   String
  avatarKey     String?
  role          Role     @default(FREE_USER) // GUEST/FREE_USER/PRO_USER/CREATOR/MODERATOR/ADMIN/SUPER_ADMIN
  status        UserStatus @default(ACTIVE)   // ACTIVE/SUSPENDED/DELETED
  createdAt     DateTime @default(now())
}

model Plan {
  id            String  @id @default(cuid())
  code          String  @unique           // free / monthly / yearly
  priceCents    Int
  currency      String                    // CNY/USD
  interval      String                    // none/month/year
  monthlyCredits Int
  features      Json                      // {proMode,voiceClone,maxConcurrent,maxDurationSec,commercial,watermarkFree,priorityQueue}
}

model Subscription {
  id              String   @id @default(cuid())
  userId          String
  planId          String
  status          String   // trialing/active/past_due/canceled/expired
  provider        String   // wechat/alipay/stripe
  providerSubId   String?
  currentPeriodStart DateTime
  currentPeriodEnd   DateTime
  cancelAtPeriodEnd  Boolean @default(false)
}

model CreditLedger {        // append-only，唯一可信余额来源
  id        String   @id @default(cuid())
  userId    String
  type      String   // grant/hold/commit/refund/consume
  amount    Int      // 正=增, 负=减
  reason    String   // monthly_reset/purchase/admin/generation
  refType   String?  // generation_job/payment
  refId     String?
  holdId    String?  // hold-commit-refund 关联
  createdAt DateTime @default(now())
}

model GenerationJob {
  id            String   @id @default(cuid())
  userId        String
  type          String   // music/tts/voice_clone
  mode          String   // simple/pro
  status        String   // queued/processing/succeeded/failed/canceled
  presetId      String?
  inputParams   Json
  provider      String   @default("minimax")
  providerModel String?
  providerTaskId String? // 异步任务/trace 关联
  creditCost    Int
  holdId        String?
  idempotencyKey String? @unique
  errorCode     String?
  createdAt     DateTime @default(now())
  completedAt   DateTime?
}

model Asset {
  id          String  @id @default(cuid())
  jobId       String?
  userId      String
  type        String  // music/tts
  storageKey  String
  streamKey   String?  // 转码后
  durationMs  Int?
  format      String?
  waveform    Json?    // peaks
  coverKey    String?
  status      String   @default("draft") // draft/published/archived
  createdAt   DateTime @default(now())
}

model Track {           // 已发布作品
  id           String  @id @default(cuid())
  assetId      String  @unique
  creatorId    String
  title        String
  description  String?
  lyrics       String?
  coverKey     String?
  genre        String?
  tags         String[]
  language     String?
  visibility   String  @default("public") // public/unlisted/private
  isAiGenerated Boolean @default(true)     // 合规：AI 标识
  status       String  @default("pending_review") // pending_review/published/rejected/removed
  playCount    Int     @default(0)
  likeCount    Int     @default(0)
  commentCount Int     @default(0)
  publishedAt  DateTime?
}

model Playlist { id String @id @default(cuid()) ownerId String title String coverKey String? isPublic Boolean @default(true) type String @default("user") }
model PlaylistTrack { playlistId String trackId String position Int @@id([playlistId, trackId]) }
model Like { userId String trackId String createdAt DateTime @default(now()) @@id([userId, trackId]) }
model Follow { followerId String creatorId String createdAt DateTime @default(now()) @@id([followerId, creatorId]) }
model Comment { id String @id @default(cuid()) trackId String userId String parentId String? content String status String @default("visible") createdAt DateTime @default(now()) }

model PlayEvent {         // 高写入，建议按月分区 + 防刷
  id        String   @id @default(cuid())
  trackId   String
  userId    String?
  deviceId  String?
  msPlayed  Int
  completed Boolean
  source    String
  createdAt DateTime @default(now())
}

model Chart { id String @id @default(cuid()) type String period String generatedAt DateTime } // type: hot/soaring/new/genre/creator
model ChartEntry { chartId String trackId String rank Int score Float @@id([chartId, trackId]) }

model Preset {            // 预设系统
  id        String  @id @default(cuid())
  type      String  // music_style/mood/voice/lyrics_template/style_pack
  name      String
  category  String?
  params    Json    // 映射为生成参数
  isOfficial Boolean @default(false)
  ownerId   String?
  status    String  @default("active")
}

model Voice {             // 系统音色目录缓存
  id            String @id @default(cuid())
  providerVoiceId String @unique
  name          String
  language      String?
  gender        String?
  sampleKey     String?
  tags          String[]
  isClonable    Boolean @default(false)
}

model VoiceClone {        // 用户克隆音色（含授权）
  id            String @id @default(cuid())
  userId        String
  name          String
  providerVoiceId String?
  consentDocKey String   // 授权凭证（必填）
  status        String   @default("pending") // pending/ready/rejected
}

model ModerationCase {
  id         String  @id @default(cuid())
  targetType String  // track/comment/voice_clone/cover
  targetId   String
  status     String  @default("pending") // pending/approved/rejected
  reason     String?
  autoFlags  Json?
  reviewerId String?
  decisionAt DateTime?
}

model WebhookEvent { id String @id provider String eventId String @unique payload Json processedAt DateTime? } // 支付幂等
model AuditLog { id String @id @default(cuid()) actorId String? action String targetType String? targetId String? meta Json createdAt DateTime @default(now()) }
```

## 9.3 关键 REST 契约（节选）
- `POST /api/v1/auth/register` `{email|phone, password, displayName}` → `{user, accessToken}`（refresh 走 httpOnly cookie）。错误：`AUTH_EMAIL_TAKEN` 等。
- `POST /api/v1/generation/jobs` Header `Idempotency-Key`，Body `{type, mode, params, presetId?}` → `201 {jobId, status:"queued", creditCost}`。错误：`ENTITLEMENT_INSUFFICIENT_CREDITS`（含 `balance/required`）、`VALIDATION_FAILED`、`FEATURE_NOT_IN_PLAN`。
- `GET /api/v1/generation/jobs/:id` → `{id,status,errorCode?,asset?}`。
- `POST /api/v1/tracks/publish` `{assetId, title, lyrics?, coverAssetId?, genre?, tags?, language?, visibility}` → `{trackId, status}`（`pending_review` 或 `published`）。错误：`MODERATION_REQUIRED`、`ASSET_NOT_OWNED`。
- `GET /api/v1/charts/:type?period=daily&genre=&page=` → 分页 `{entries:[{rank,track,score}]}`。
- `GET /api/v1/tracks/:id`、`GET /api/v1/search?q=&type=track|creator|playlist`、`POST /api/v1/tracks/:id/like`、`POST /api/v1/tracks/:id/play` `{msPlayed,completed,deviceId}`。
- `POST /api/v1/voices/clone` `{name, sampleAssetId, consentAssetId}` → `{voiceCloneId, status}`。**无授权凭证一律拒绝。**
- 计费：`POST /api/v1/billing/checkout` `{planCode}` → `{paymentIntent|payUrl}`；`POST /api/v1/payments/webhook/:provider`（幂等）。

## 9.4 实时事件契约（Socket.IO）
- 房间：`user:{userId}`。事件 `job.updated` payload `{jobId,status,progress?,errorCode?,assetId?}`。
- 兼容性：所有事件**附带轮询回退**（`GET /generation/jobs/:id`），WebSocket 断线不影响最终一致。

## 9.5 向后兼容与错误规范
- API 加字段不删字段；破坏性变更走 `/v2` 或 feature flag。
- 统一错误体 `{code, message, details?, traceId}`；前端按 `code` 驱动 UI，绝不依赖 `message` 文案做逻辑。

---

# 10. 测试计划

> 每个测试写明：目的 / 输入 / 预期输出 / 失败含义。CI 必跑单元+集成+关键 e2e。

## 10.1 单元测试（节选）
- **额度账本三段式**：目的=保证 hold→commit/refund 不丢不重；输入=并发 hold 同一用户；预期=余额 = grant − committed，refund 后恢复；失败=资金/额度错乱（最高危）。
- **状态机迁移**：目的=禁止非法迁移（如 succeeded→processing）；输入=各种迁移；预期=非法迁移抛错；失败=任务状态不可信。
- **Provider 错误归类**：输入=429/500/超时/400/鉴权失败/内容拒绝；预期=前三为 transient（重试），后三为 permanent（立即退款）；失败=对永久错误反复重试烧钱或对临时错误误退款。
- **防刷计数**：输入=同用户/设备短时多次 play、msPlayed 低于阈值；预期=不计入热度；失败=榜单可刷。
- **hex 解码**：输入=mock hex 音频；预期=正确还原字节并可播放；失败=音频损坏。

## 10.2 集成测试
- **生成端到端（mock/sandbox MiniMax）**：提交 → 队列 → Worker → 落存储 → asset draft → commit；断言额度、产物、事件。
- **发布→审核→上榜**：发布命中策略进队列，人工通过后 published 并可被榜单/搜索命中。
- **支付→Webhook→授权**：模拟支付成功回调（含重复回调）；预期订阅 active + 月度额度授予，重复回调不重复授予（幂等）。

## 10.3 回归测试
- 将上述核心用例固化进 CI；每次合并必过；新增功能须附回归用例。

## 10.4 边界测试
- 额度=0、刚好够、并发抢占同一额度、最大时长/字符上限、空歌词纯音乐、超长歌词被拒、未授权克隆被拒。

## 10.5 错误路径测试
- MiniMax 限流/超时/5xx/内容拒绝；对象存储失败；支付失败/超时；WebSocket 断线后轮询仍能拿到终态。

## 10.6 性能测试（如适用）
- 生成排队吞吐与公平性（免费档 RPM 下不饿死/不雪崩）；榜单与列表分页 P95；签名 URL + CDN 播放首包延迟；高并发 play 写入。

## 10.7 手动验收脚本（关键流程走查）
1. 新用户注册 → 简易模式生成音乐 → 进度 → 试听 → 存草稿。
2. 专业模式：套用预设 → 编辑歌词结构 → 选音色/情绪 → 生成 → 多版本对比。
3. 声音克隆：上传样本 + 授权凭证 → 克隆 → 用克隆音色合成。
4. 一键发布 → （命中审核则）后台审核通过 → 消费端可搜到、可播放、显示 AI 角标。
5. 全局播放器：跨页面切换不断播；队列/单曲/随机正常。
6. 榜单/分类/搜索/点赞/评论/关注/歌单全通。
7. 免费额度耗尽 → 引导升级 → 下单 → 支付 → 额度到账 → 可继续生成。
8. 后台：看用户/订阅/额度/审核/榜单运营/MiniMax 成本看板/审计日志。

---

# 11. 验收标准（可观察、可测试）

- [ ] 用户可注册/登录（邮箱+手机+至少一种 OAuth）并保持会话。
- [ ] 简易模式可成功生成音乐与语音，有实时进度，可试听。
- [ ] 专业模式具备歌词结构编辑、参考音频/Cover、音色/情绪/曲风/时长控制、声音克隆、项目与版本管理。
- [ ] 预设系统可用：官方预设可套用、用户可自存预设，简易/专业模式均可一键应用。
- [ ] 生成失败**不扣额度**（自动退款）；生成成功正确扣额度；重复提交幂等（同 Idempotency-Key 不重复计费）。
- [ ] 一键发布可用；先审后发策略生效；已发布作品出现在曲库/创作者主页/搜索。
- [ ] 消费端：全局持久播放器（跨路由不断播）、歌词显示、点赞/评论/关注/歌单/分享可用。
- [ ] 榜单（热/飙升/新歌/分类/创作者）可生成且**有基础防刷**；分类与搜索可用。
- [ ] 计费：免费额度按周期重置；包月/包年订阅可购买、可取消、到期降级；额度余额与用量可见。
- [ ] 支付 Webhook 幂等，订阅与额度授权一致。
- [ ] 运营后台覆盖：用户/订阅/额度/内容审核/曲库与榜单运营/预设与音色/数据看板/系统配置/审计日志。
- [ ] 合规：所有 AI 生成作品带标识（数据+UI+文件元数据）；声音克隆必须有授权凭证；提供举报与下架。
- [ ] 安全：第三方密钥不出现在前端；音频走可过期签名 URL；越权访问被拒。
- [ ] 可观测：错误进 Sentry；**MiniMax 成本看板**可见调用量与估算成本并有预算告警；队列积压/失败率有告警。
- [ ] 失败降级：MiniMax 限流/故障时任务排队而非报错崩溃，用户输入不丢失。
- [ ] CI 通过：lint+typecheck+单元+集成+关键 e2e 全绿。
- [ ] UI 在桌面与移动端均简洁美观、关键流程不超出合理步数。
- [ ] 文档齐备：README/架构图/运行手册/后台手册/API 文档/应急预案。

---

# 12. 风险清单与规避方案

| 风险 | 影响 | 触发条件 | 规避方案 | 回滚方案 |
| --- | --- | --- | --- | --- |
| MiniMax 接口/参数/价格变更 | 生成中断或成本失控 | 官方升级模型/调价 | 适配层隔离 + 模型/单价配置化 + 上线前核对官方文档与计费 | 切回上一个已验证模型配置；开维护提示 |
| MiniMax 限流/RPM 不足（尤其免费档） | 排队拥塞、用户流失 | 高峰并发 | 令牌桶限速 + 队列 + 付费优先队列 + 熔断 + 提示“已排队” | 临时下调免费并发；公告 |
| 生成失败仍扣费 | 资金/信任受损 | 异常路径漏退款 | 强制 hold→commit/refund 三段式 + 失败必退 + 单测覆盖 | 运营后台手动补退 + 审计核账 |
| 重复提交/重复支付回调 | 重复计费/重复授权 | 网络重试 | Idempotency-Key + webhook_events 幂等 | 幂等去重补偿 + 人工对账 |
| 内容侵权/违法/未成年人不适 | 法律与平台风险 | UGC 发布 | 先审后发 + 自动预筛 + 人工队列 + 举报下架 + AI 标识 | 一键下架 + 收紧自动阈值 |
| 声音克隆滥用（仿冒他人） | 严重法律风险 | 上传他人声音 | 强制授权凭证 + 审核 + 禁公众人物 + 留痕 | 停用克隆功能开关 + 撤下相关音色 |
| 榜单被刷 | 公信力受损 | 机器刷播放/赞 | 去重 + 最小播放时长 + 频率上限 + 异常流量过滤 | 重算榜单 + 封禁作弊账号 |
| 成本 > 收入（毛利为负） | 商业不可持续 | 额度单价/定价错配 | 成本看板 + 预算告警 + 额度单价基于真实成本设定 | 调整额度单价/套餐（配置化热更） |
| 长任务阻塞/雪崩 | 服务不可用 | 同步等待生成 | 全异步 + Worker 隔离 + 背压 + 超时 | 扩 Worker / 限流 / 降级排队 |
| 音频被盗用/盗链 | 版权与带宽损失 | 公开直链 | 可过期签名 URL + CDN 防盗链（演进期 HLS） | 失效旧签名 + 轮换密钥 |
| 数据库迁移破坏线上 | 故障/数据损坏 | 破坏性迁移 | 向前兼容迁移 + 两步删除 + 迁移前备份 | 回滚到迁移前快照 |
| 厂商单点（仅 MiniMax） | 供应中断即停服 | MiniMax 宕机 | Provider 抽象预留备用供应商接口 + 熔断降级 | 切备用供应商（v1 仅留接口） |

---

# 13. 给代码模型的执行提示词（可直接复制）

```
你是执行型工程实施 AI。请严格按照本计划书（本 .md 文件）落地一个“MiniMax 驱动的 AI 音乐生成与聆听平台”。

硬性要求：
1. 严格按本计划执行，不扩大范围；非目标清单中的内容一律不做。
2. 每次开始一个改动前，先用一两句话说明：本次目标、涉及文件、预期产出。
3. 按 Phase 0→1→2→3→4 顺序推进；每个 Phase 结束产出可运行、可测试的增量，并自检对应验收项。
4. 数据与契约以本计划第 9 章为准；前后端共享类型放 packages/contracts，全部输入用 zod 校验。
5. 所有 MiniMax 调用必须经 packages/sdk-minimax 适配层：处理 hex/URL 两种返回、错误归类(transient/permanent)、限速、超时、指数退避重试、熔断、成本记账。绝不在前端暴露任何密钥。
6. 生成任务必须异步(BullMQ + Worker)，并实现额度三段式 hold→commit/refund：失败必退、成功才扣；提交幂等(Idempotency-Key)。
7. 发布走“先审后发(可配)”；AI 生成内容必须打标识；声音克隆无授权凭证一律拒绝。
8. 不要手改已生成的数据库迁移历史，只新增向前兼容迁移；不要触碰标记为 no-touch 的文件（密钥、历史迁移）。
9. 每完成一个文件/模块，运行对应单元/集成测试与 lint+typecheck；关键流程补 e2e。修改后给出“改动摘要 + 已跑测试 + 风险点”。
10. 遇到不确定（如 MiniMax 实际参数/单价、地域合规细节）：先在代码注释与 docs/ASSUMPTIONS.md 记录假设，按假设推进，并在改动摘要中标注“需确认”。不要停下来反复追问。
11. UI 追求简洁美观、流程合理；消费端全局播放器需在路由切换间持续播放（单例 audio + 全局 store）。

输出规范：每轮先给计划(目标/文件/产出)，再实现，最后给改动摘要与测试结果。保持小步提交、可回滚。
```

---

# 14. 执行顺序总清单（逐项可勾选）

1. [ ] **P0** 确认假设/拿到 MiniMax 凭证与限额/确认存储·CDN·支付账号。
2. [ ] **P0** 初始化 Monorepo、config(env zod)、contracts 骨架、CI、docker-compose(pg/redis/minio)。
3. [ ] **P0** NestJS/Prisma/Redis/BullMQ/对象存储/Socket.IO 连通；sdk-minimax 连通性探针通过；web/admin 壳 + 设计系统就绪。
4. [ ] **P1** auth(最小) + entitlement(账本/余额/三段式/月度授予) + plans(free)。
5. [ ] **P1** sdk-minimax(music/tts) + provider(限速/熔断/错误归类/成本记账)。
6. [ ] **P1** generation 状态机 + Worker 处理器 + media(存储/签名/波形) + assets(草稿)。
7. [ ] **P1** 实时进度(Socket.IO + 轮询回退) + 创作端简易模式 v1。**（生成闭环可演示）**
8. [ ] **P2A** 一键发布 + moderation(先审后发最小) + 消费端(详情/全局播放器/搜索) + social v1 + play 事件防刷。
9. [ ] **P2B** billing/subscription + payments(一渠道+适配位+Webhook 幂等) + entitlement 完整化 + 定价/订阅/额度前端。
10. [ ] **P2C** 专业模式(歌词结构/参考音频·Cover/精细控制/克隆/项目版本) + presets(官方+自存) + voices(目录)。
11. [ ] **P2D** charts(热/飙升/新歌/分类/创作者 + 防刷) + 分类页 + comments。
12. [ ] **P2** 运营后台主体(用户/订阅/额度/审核队列/曲库与榜单运营/预设与音色/数据看板/系统配置/审计)。
13. [ ] **P3** 单元/集成/回归/边界/错误路径/性能/安全测试达标 + 手动验收脚本走查。
14. [ ] **P4** 合规(AI 标识/克隆授权/审核阈值/未成年人保护) + 可观测(Sentry/指标/MiniMax 成本看板/告警) + 安全性能收尾。
15. [ ] **P4** 文档(README/架构/Runbook/后台手册/API/应急) + 清理 + 第 11 章验收清单全过 → 灰度上线。
16. [ ] **演进(非 v1)** HLS/Meilisearch/ClickHouse/推荐/备用供应商/原生 App BFF（仅按本计划预留接口）。

---

*本计划书结束。执行模型请从第 14 章第 1 项开始，逐项推进，并随时回看第 9 章契约与第 12 章风险。*
