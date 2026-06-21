# S3 对象生命周期策略

MinIO 兼容的生命周期配置，控制存储成本。

## 规则

| 前缀 | 规则 | 说明 |
|------|------|------|
| `temp/` | 7 天后删除 | 临时上传文件（未完成的 multipart、中转缓存） |
| `assets/` (draft) | 30 天后删除 | 未发布的草稿资产 |
| `assets/` (published) | 90 天后转 GLACIER | 已发布作品冷归档，降低存储成本 |

## 应用配置

```bash
# MinIO 或 AWS CLI
mc ilm import myminio/music-bucket < infra/minio-lifecycle.json

# AWS CLI
aws s3api put-bucket-lifecycle-configuration \
  --bucket music-bucket \
  --lifecycle-configuration file://infra/minio-lifecycle.json
```

## Docker Compose 自动配置

在 `infra/docker-compose.yml` 的 minio 服务中添加：

```yaml
minio:
  volumes:
    - ./minio-lifecycle.json:/lifecycle.json:ro
  command: server /data --console-address ":9001"
  # 或通过 MinIO client init 容器执行 mc ilm import
```
