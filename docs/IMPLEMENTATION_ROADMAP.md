# 代码工程实施路径

## Phase 0：工程止血

- 清理乱码、死代码、重复组件。
- 固定 lint/typecheck/test/build 全绿。
- 建立 Web 信息架构。
- 建立 demo fallback 与真实 API 的边界。
- 修复无后端时 `Failed to fetch` 体验。

验收：

```txt
pnpm lint
pnpm typecheck
pnpm test
pnpm build
Playwright smoke
```

## Phase 1：Web 消费端骨架

- 首页、发现、榜单、分类、曲库、歌曲详情、创作者主页、歌单页。
- 全局播放器稳定。
- 曲库和榜单数据支持 API + fallback。
- 搜索和分类过滤。

## Phase 2：Web 创作端骨架

- `/studio/simple`
- `/studio/pro`
- 项目、草稿、预设、音色页。
- 简易模式和专业模式职责拆开。
- 生成成功后形成草稿，并提供发布入口。

## Phase 3：真实生成闭环

- `/generation/jobs` 接入 Web。
- MiniMax provider 走后端。
- Worker 成功/失败/退款完整。
- Web 支持 Socket.IO + 轮询兜底。

## Phase 4：发布审核闭环

- 草稿发布。
- 发布表单。
- 审核状态。
- 审核通过进入 A 平台曲库。
- 后台审核队列。

## Phase 5：商业化

- 免费额度。
- 月付/年付。
- 额度包。
- 权益限制：专业模式、时长、并发、音色、商用。
- 成本和订单后台。

## Phase 6：运营后台

- 用户、作品、审核、榜单、预设、音色、计费、成本、审计。

## Phase 7：移动端

- Android/iOS 消费端。
- 简易创作入口。
- 不在当前阶段开发。

