# Zendesk 集成方案文档

业务系统（CRM / Salora）与 Zendesk 的集成技术文档，涵盖无感登录和文档嵌入两种方案。

---

## 方案对比

| 维度 | 方案一：JWT SSO | 方案二：Help Center API |
|------|----------------|----------------------|
| 核心能力 | 无感登录跳转到 Zendesk 页面 | 在业务系统内嵌入文档浏览 |
| 展示方式 | 新标签页 / 弹窗窗口 | 完全嵌入业务系统 UI |
| 功能完整性 | Zendesk 原生完整功能 | 文章浏览 + 搜索 |
| 开发成本 | 低 | 中 |
| Zendesk 计划要求 | Support 系列即可 | Suite 系列（需 Guide 模块） |
| iframe 嵌入 | ❌ 被 Zendesk 安全策略阻止 | 不涉及 |

---

## 方案文档

### [方案一：JWT SSO 无感登录](./docs/zendesk-jwt-sso-integration.md)

通过 Zendesk JWT SSO 机制实现无感登录，用户在业务系统中点击按钮即可免密跳转到 Zendesk。

包含内容：
- Zendesk 后台 SSO 配置流程（附截图）
- BridgePage 服务实现（Node.js / Java / Python / .NET）
- 新标签页与弹窗窗口两种前端集成方式
- iframe 不可行的原因分析
- 生产环境注意事项

**状态：✅ 已验证可行**

### [方案二：Help Center API 文档嵌入](./docs/zendesk-help-center-api.md)

通过 Zendesk Help Center REST API 拉取文章数据，在业务系统内自建文档浏览界面。

包含内容：
- API Token 配置流程（附截图）
- 核心 API 端点（Categories / Sections / Articles / Search）
- 后端代理层实现（Node.js / Java / Python）
- 前端集成示例（React）
- 踩坑记录（SSL 证书、认证问题、计划限制）

**状态：⚠️ 需要 Suite 系列计划（含 Guide 模块）**

---

## Demo 项目

本目录所在的 `zendesk-bridge-server` 项目是两种方案的可运行 demo，包含：

- Express 后端（JWT 签发 + HC API 代理）
- React 前端（SSO 测试 + 文档浏览 UI）

### 快速启动

```bash
# 安装依赖
npm run install:all

# 配置环境变量
cp .env.example .env
# 编辑 .env 填入 Zendesk 配置

# 启动（前后端同时）
npm run dev
```

访问 `http://localhost:5173/`，通过顶部 Tab 切换两种方案的 demo。
