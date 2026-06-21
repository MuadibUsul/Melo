# 手动验收脚本 · Phase 3

按照母计划 §10.7 八条验收脚本的本地化版本。

## 1. 注册与登录

```bash
# 注册
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","displayName":"测试用户"}'

# 登录 (获取 access token)
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"identifier":"test@example.com","password":"testpass123"}'

# 刷新令牌
curl -X POST http://localhost:4000/api/v1/auth/refresh \
  -b cookies.txt
```

## 2. 额度查询

```bash
TOKEN="<access_token_from_login>"
curl http://localhost:4000/api/v1/entitlement/balance \
  -H "Authorization: Bearer $TOKEN"
```

## 3. 音乐生成 (异步)

```bash
# 提交任务
curl -X POST http://localhost:4000/api/v1/generation/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-$(date +%s)" \
  -d '{"type":"music","mode":"simple","params":{"prompt":"一首轻快的民谣","isInstrumental":false}}'

# 轮询状态 (替换 jobId)
curl http://localhost:4000/api/v1/generation/jobs/<jobId> \
  -H "Authorization: Bearer $TOKEN"
```

## 4. 作品发布

```bash
curl -X POST http://localhost:4000/api/v1/tracks/publish \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"assetId":"<assetId>","title":"我的第一首歌","genre":"中文流行","tags":["demo","民谣"]}'
```

## 5. 消费端浏览

```bash
# 曲库列表
curl http://localhost:4000/api/v1/tracks

# 搜索
curl "http://localhost:4000/api/v1/tracks/search?q=民谣"

# 播放 URL
curl http://localhost:4000/api/v1/tracks/<trackId>/play

# 排行榜
curl http://localhost:4000/api/v1/charts/hot
```

## 6. 社交互动

```bash
# 点赞
curl -X POST http://localhost:4000/api/v1/tracks/<trackId>/like \
  -H "Authorization: Bearer $TOKEN"

# 评论
curl -X POST http://localhost:4000/api/v1/tracks/<trackId>/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content":"很好听！"}'

# 关注创作者
curl -X POST http://localhost:4000/api/v1/users/<creatorId>/follow \
  -H "Authorization: Bearer $TOKEN"
```

## 7. 订阅与支付

```bash
# 查看套餐
curl http://localhost:4000/api/v1/plans

# 订阅 (需 TOKEN)
curl -X POST http://localhost:4000/api/v1/subscription/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"planCode":"monthly","provider":"mock"}'

# Webhook 幂等测试
curl -X POST http://localhost:4000/api/v1/webhooks/payment \
  -H "Content-Type: application/json" \
  -d '{"provider":"stripe","eventId":"evt_test_123","payload":{"type":"invoice.paid"}}'
```

## 8. 健康检查

```bash
curl http://localhost:4000/api/v1/health
# 预期: {"status":"ok","dependencies":{"database":"ok","redis":"ok","objectStorage":"ok",...}}
```
