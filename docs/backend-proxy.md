# 第四部分：技术实现 — 后端代理层

## 为什么需要代理层

前端不能直接调用 Zendesk API：

1. **API Token 安全** — Token 不能暴露在前端代码中
2. **CORS 限制** — Zendesk API 不允许浏览器跨域直接请求
3. **SSL 兼容** — 企业网络环境可能存在 SSL 中间人代理

## 架构

```
前端 → 后端代理层 → Zendesk API
         ↑
    附加认证 Header
    处理 SSL 问题
    缓存（可选）
```

## 代理层职责

| 职责 | 说明 |
|------|------|
| 认证注入 | 在请求中附加 `Authorization: Basic ...` Header |
| 路径映射 | 将前端简短路径映射到 Zendesk API 完整路径 |
| SSL 处理 | 企业网络环境下处理自签名证书问题 |
| 错误封装 | 统一处理 Zendesk API 错误并返回前端友好的响应 |
| 附件流转 | 将 `multipart/form-data` 附件请求透传到 Zendesk |

## 路径映射参考

| 前端路径 | Zendesk API 路径 |
|----------|-----------------|
| `GET /api/hc/categories` | `GET /api/v2/help_center/categories` |
| `GET /api/hc/categories/:id/sections` | `GET /api/v2/help_center/categories/:id/sections` |
| `GET /api/hc/sections/:id/articles` | `GET /api/v2/help_center/sections/:id/articles` |
| `GET /api/hc/articles/:id` | `GET /api/v2/help_center/articles/:id` |
| `POST /api/hc/categories` | `POST /api/v2/help_center/categories` |
| `PUT /api/hc/articles/:id` | `PUT /api/v2/help_center/articles/:id` |
| `DELETE /api/hc/articles/:id` | `DELETE /api/v2/help_center/articles/:id` |
| `GET /api/hc/search?query=...` | `GET /api/v2/help_center/articles/search?query=...` |

> 完整的 CRUD 路由映射规则一致：前端使用 `/api/hc/` 前缀，代理层替换为 `/api/v2/help_center/` 并附加认证信息。

## 注意事项

- **Node.js 22**：内置 `fetch` 基于 undici，`NODE_TLS_REJECT_UNAUTHORIZED=0` 对其不生效，需使用 undici `Agent` + `dispatcher` 处理 SSL
- **生产环境**：应配置正确的 CA 证书（`NODE_EXTRA_CA_CERTS`），而非跳过验证
- **附件上传**：需将请求 body 以 stream 方式透传，不能用 `express.json()` 解析
