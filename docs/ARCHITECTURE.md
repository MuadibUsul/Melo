# 工程架构

## Monorepo

```txt
apps/
  web/       Next.js Web，承载 A 音乐平台 + B 创作平台入口
  admin/     后续独立运营后台
  api/       NestJS API
  worker/    BullMQ 异步生成任务
  mobile/    后续 React Native / Expo，仅保留契约

packages/
  contracts/  DTO、错误码、共享类型
  config/     环境变量和配置校验
  sdk-minimax MiniMax SDK 封装
  ui/         后续共享设计系统
  domain/     后续领域模型
```

## 后端边界

- Web 不直接持有 MiniMax key。
- 生成请求统一进入 `apps/api`。
- Worker 负责耗时任务、重试、失败退款。
- `CreditLedger` 是额度唯一真相。
- `GenerationJob` 是生成状态机唯一真相。
- `Asset` 是音频资产。
- `Track` 是发布到音乐平台后的内容。

## Web 架构原则

- 页面默认 Server Component。
- 需要状态、播放器、表单、实时进度的区域使用 Client Component。
- 真实 API 不可用时保留明确的 demo fallback，但不能伪装成真实生产数据。
- 全局播放器只挂一次，放在 root provider。
- 消费端和创作端共享账号、播放器、曲库数据，不共享页面状态。

## 移动端策略

当前阶段不开发移动端 UI，只保证：

- API DTO 不绑定 Web。
- 播放、曲库、榜单、登录、生成、发布接口可被移动端复用。
- 后续移动端优先做 A 消费端，再做 B 简易创作。

