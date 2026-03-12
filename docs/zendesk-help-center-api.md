# Zendesk Help Center API — 集成方案

## 目录

- [方案概述](#方案概述)
- [前置条件](#前置条件)
- [第一部分：Zendesk 后台配置](#第一部分zendesk-后台配置)
  - [1.1 确认 Help Center 已激活](#11-确认-help-center-已激活)
  - [1.2 创建 API Token](#12-创建-api-token)
- [第二部分：API 认证方式](#第二部分api-认证方式)
- [第三部分：核心 API 端点](#第三部分核心-api-端点)
  - [3.1 获取分类列表](#31-获取分类列表)
  - [3.2 获取分类下的 Sections](#32-获取分类下的-sections)
  - [3.3 获取 Section 下的文章列表](#33-获取-section-下的文章列表)
  - [3.4 获取单篇文章详情](#34-获取单篇文章详情)
  - [3.5 搜索文章](#35-搜索文章)
- [第四部分：技术实现 — 后端代理层](#第四部分技术实现--后端代理层)
  - [4.1 为什么需要代理层](#41-为什么需要代理层)
  - [4.2 Node.js / Express 实现](#42-nodejs--express-实现)
  - [4.3 Java / Spring Boot 实现](#43-java--spring-boot-实现)
  - [4.4 Python / Flask 实现](#44-python--flask-实现)
- [第五部分：前端集成示例](#第五部分前端集成示例)
- [第六部分：踩坑记录](#第六部分踩坑记录)

---

## 方案概述

通过 Zendesk Help Center REST API，在业务系统内部构建自定义的文档浏览界面，实现：

- 分类（Categories）→ 章节（Sections）→ 文章（Articles）的层级浏览
- 全文搜索文章
- 直接渲染文章 HTML 内容
- 完全嵌入业务系统，无需跳转到 Zendesk 页面

**与 JWT SSO 方案的对比**：

| 维度 | JWT SSO（新标签页/弹窗） | Help Center API |
|------|------------------------|-----------------|
| 用户体验 | 跳转到 Zendesk 页面 | 完全嵌入业务系统内 |
| 功能完整性 | Zendesk 原生完整功能 | 仅文章浏览和搜索 |
| 开发成本 | 低（只需 BridgePage） | 中（需要自建 UI） |
| Zendesk 计划要求 | Support 系列即可 | **Suite 系列**（需要 Guide 模块） |
| 维护成本 | 低 | 中（需跟进 API 变更） |

---

## 前置条件

1. Zendesk 计划为 **Suite Team** 及以上（包含 Guide / Help Center 模块）
2. Help Center 已创建并激活
3. 拥有 Zendesk **Admin** 权限的账号
4. 已创建 API Token

> ⚠️ **重要**：如果你的 Zendesk 计划是 Support 系列（仅工单功能），Admin Center 的 Channels 菜单下不会出现 Help Center 选项，Help Center API 会返回 401 错误。
>
> ![Channels 菜单中没有 Help Center 选项](./images/07-channels-no-hc.png)
> *Support 系列计划的 Channels 菜单 — 没有 Help Center 入口*

---

## 第一部分：Zendesk 后台配置

### 1.1 确认 Help Center 已激活

**路径**：Admin Center → Channels → Help Center

- 如果菜单中有 "Help Center" 选项，说明你的计划包含 Guide 模块
- 进入后确认 Help Center 状态为 **Active**
- 如果还没有创建，按照引导完成初始化设置

Help Center 激活后，可以通过 `https://{subdomain}.zendesk.com/hc/{locale}` 访问，例如：
```
https://lifebyte-28216.zendesk.com/hc/en-us
```

### 1.2 创建 API Token

**路径**：Admin Center → Apps and integrations → APIs → API tokens

![API Tokens 管理页面](./images/06-api-tokens.png)

**步骤**：

1. 点击右上角 **Add API token**
2. 填写 Description（如 `hc-api-integration`）
3. 点击 **Save**
4. **立即复制 Token 值** — Token 只会完整显示一次，之后无法再查看

> ⚠️ Token 创建后需要确认 Status 为 **Active**。

**需要记录的信息**：

| 信息 | 说明 | 示例 |
|------|------|------|
| API Email | 创建 Token 的管理员邮箱 | `admin@example.com` |
| API Token | 创建时复制的完整 Token | `uRzLHbcfE5Edi6Owy...` |
| Subdomain | Zendesk 子域名 | `lifebyte-28216` |

---

## 第二部分：API 认证方式

Zendesk API 使用 **Basic Authentication**，格式为：

```
Authorization: Basic base64({email}/token:{api_token})
```

**构造示例**：

```
邮箱: admin@example.com
Token: uRzLHbcfE5Edi6OwyHUMPgBoeTbXvrIfmo1rbZ87

拼接: admin@example.com/token:uRzLHbcfE5Edi6OwyHUMPgBoeTbXvrIfmo1rbZ87
Base64: YWRtaW5AZXhhbXBsZS5jb20vdG9rZW46dVJ6TEhiY2ZFNUVkaTZPd3lIVU1QZ0JvZVRiWHZySWZtbzFyYlo4Nw==

Header: Authorization: Basic YWRtaW5AZXhhbXBsZS5jb20vdG9rZW46...
```

**curl 验证**：

```bash
curl "https://{subdomain}.zendesk.com/api/v2/users/me.json" \
  -u "{email}/token:{api_token}"
```

如果返回你的真实用户信息（name、email、role 等），说明认证配置正确。如果返回 `"Anonymous user"`，说明 Token 无效或 Token Access 未启用。

---

## 第三部分：核心 API 端点

所有端点的 Base URL 为：`https://{subdomain}.zendesk.com`

### 3.1 获取分类列表

```
GET /api/v2/help_center/{locale}/categories
```

**响应示例**：

```json
{
  "categories": [
    {
      "id": 47131600270228,
      "name": "General",
      "description": "",
      "locale": "en-us",
      "html_url": "https://lifebyte-28216.zendesk.com/hc/en-us/categories/47131600270228-General",
      "position": 0,
      "created_at": "2026-03-12T02:52:52Z",
      "updated_at": "2026-03-12T06:23:21Z"
    }
  ],
  "page": 1,
  "per_page": 30,
  "count": 1
}
```

### 3.2 获取分类下的 Sections

```
GET /api/v2/help_center/categories/{category_id}/sections
```

**响应字段**：`sections[]` — 包含 `id`、`name`、`description`、`html_url`、`category_id`

### 3.3 获取 Section 下的文章列表

```
GET /api/v2/help_center/sections/{section_id}/articles
```

**响应字段**：`articles[]` — 包含 `id`、`title`、`body`（HTML）、`html_url`、`label_names`、`created_at`、`updated_at`

### 3.4 获取单篇文章详情

```
GET /api/v2/help_center/articles/{article_id}
```

**响应字段**：`article` — 完整文章对象，`body` 字段为 HTML 格式的文章内容，可直接渲染

### 3.5 搜索文章

```
GET /api/v2/help_center/articles/search?query={keyword}
```

**支持的查询参数**：

| 参数 | 说明 |
|------|------|
| `query` | 搜索关键词 |
| `filter[category_ids]` | 限定分类范围 |
| `filter[section_ids]` | 限定章节范围 |
| `filter[label_names]` | 按标签过滤 |
| `sort_by` | 排序方式：`relevance`（默认）、`created_at`、`updated_at` |
| `per_page` | 每页结果数（默认 10，最大 50） |

**响应字段**：`results[]` — 文章列表，结构同 articles

> 搜索端点支持匿名访问（不带认证），但返回的结果仅限公开文章。

---

## 第四部分：技术实现 — 后端代理层

### 4.1 为什么需要代理层

前端不能直接调用 Zendesk API，原因：

1. **API Token 安全**：Token 不能暴露在前端代码中
2. **CORS 限制**：Zendesk API 不允许浏览器跨域直接请求
3. **SSL 兼容**：某些企业网络环境存在 SSL 中间人代理，后端可以灵活处理

架构：

```
前端 → 后端代理层 → Zendesk API
         ↑
    附加认证 Header
    处理 SSL 问题
    缓存（可选）
```

### 4.2 Node.js / Express 实现

```javascript
import { Agent } from 'undici';
import express from 'express';

const app = express();

const ZD_BASE = `https://${process.env.ZENDESK_SUBDOMAIN}.zendesk.com`;
const ZD_AUTH = `Basic ${Buffer.from(
  `${process.env.ZENDESK_API_EMAIL}/token:${process.env.ZENDESK_API_TOKEN}`
).toString('base64')}`;

// 企业网络可能有 SSL 代理，需要跳过证书验证（仅开发环境）
const tlsAgent = new Agent({ connect: { rejectUnauthorized: false } });

async function zdFetch(path) {
  const res = await fetch(`${ZD_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': ZD_AUTH,
    },
    dispatcher: tlsAgent,
  });
  return { status: res.status, data: await res.json() };
}

function hcProxy(pathFn) {
  return async (req, res) => {
    const path = typeof pathFn === 'function' ? pathFn(req) : pathFn;
    const result = await zdFetch(path).catch((err) => ({
      status: 502,
      data: { error: 'Zendesk API request failed', detail: err.message },
    }));
    res.status(result.status).json(result.data);
  };
}

app.get('/api/hc/categories', hcProxy('/api/v2/help_center/categories'));
app.get('/api/hc/categories/:id/sections', hcProxy((req) =>
  `/api/v2/help_center/categories/${req.params.id}/sections`
));
app.get('/api/hc/sections/:id/articles', hcProxy((req) =>
  `/api/v2/help_center/sections/${req.params.id}/articles`
));
app.get('/api/hc/articles/:id', hcProxy((req) =>
  `/api/v2/help_center/articles/${req.params.id}`
));
app.get('/api/hc/search', hcProxy((req) =>
  `/api/v2/help_center/articles/search?query=${encodeURIComponent(req.query.query ?? '')}`
));
```

**依赖**：`express`、`undici`

> ⚠️ Node.js 22 内置的 `fetch` 基于 undici，但在企业网络环境下可能遇到 `SELF_SIGNED_CERT_IN_CHAIN` 错误。需要显式安装 `undici` 包并使用自定义 `Agent` 跳过证书验证。生产环境应配置正确的 CA 证书而非跳过验证。

### 4.3 Java / Spring Boot 实现

```java
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.Base64;

@RestController
@RequestMapping("/api/hc")
public class HelpCenterProxyController {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${zendesk.subdomain}")
    private String subdomain;

    @Value("${zendesk.api.email}")
    private String apiEmail;

    @Value("${zendesk.api.token}")
    private String apiToken;

    private HttpHeaders authHeaders() {
        HttpHeaders headers = new HttpHeaders();
        String credentials = apiEmail + "/token:" + apiToken;
        headers.set("Authorization",
            "Basic " + Base64.getEncoder().encodeToString(credentials.getBytes()));
        headers.setContentType(MediaType.APPLICATION_JSON);
        return headers;
    }

    private String zdUrl(String path) {
        return "https://" + subdomain + ".zendesk.com" + path;
    }

    @GetMapping("/categories")
    public ResponseEntity<String> categories() {
        return restTemplate.exchange(
            zdUrl("/api/v2/help_center/categories"),
            HttpMethod.GET, new HttpEntity<>(authHeaders()), String.class);
    }

    @GetMapping("/categories/{id}/sections")
    public ResponseEntity<String> sections(@PathVariable String id) {
        return restTemplate.exchange(
            zdUrl("/api/v2/help_center/categories/" + id + "/sections"),
            HttpMethod.GET, new HttpEntity<>(authHeaders()), String.class);
    }

    @GetMapping("/sections/{id}/articles")
    public ResponseEntity<String> articles(@PathVariable String id) {
        return restTemplate.exchange(
            zdUrl("/api/v2/help_center/sections/" + id + "/articles"),
            HttpMethod.GET, new HttpEntity<>(authHeaders()), String.class);
    }

    @GetMapping("/articles/{id}")
    public ResponseEntity<String> article(@PathVariable String id) {
        return restTemplate.exchange(
            zdUrl("/api/v2/help_center/articles/" + id),
            HttpMethod.GET, new HttpEntity<>(authHeaders()), String.class);
    }

    @GetMapping("/search")
    public ResponseEntity<String> search(@RequestParam String query) {
        return restTemplate.exchange(
            zdUrl("/api/v2/help_center/articles/search?query=" +
                java.net.URLEncoder.encode(query, java.nio.charset.StandardCharsets.UTF_8)),
            HttpMethod.GET, new HttpEntity<>(authHeaders()), String.class);
    }
}
```

### 4.4 Python / Flask 实现

```python
import os
import requests
from flask import Flask, request, jsonify

app = Flask(__name__)

ZD_BASE = f"https://{os.environ['ZENDESK_SUBDOMAIN']}.zendesk.com"
ZD_AUTH = (
    f"{os.environ['ZENDESK_API_EMAIL']}/token",
    os.environ["ZENDESK_API_TOKEN"],
)

def zd_get(path):
    resp = requests.get(f"{ZD_BASE}{path}", auth=ZD_AUTH)
    return jsonify(resp.json()), resp.status_code

@app.route("/api/hc/categories")
def categories():
    return zd_get("/api/v2/help_center/categories")

@app.route("/api/hc/categories/<cat_id>/sections")
def sections(cat_id):
    return zd_get(f"/api/v2/help_center/categories/{cat_id}/sections")

@app.route("/api/hc/sections/<sec_id>/articles")
def articles(sec_id):
    return zd_get(f"/api/v2/help_center/sections/{sec_id}/articles")

@app.route("/api/hc/articles/<art_id>")
def article(art_id):
    return zd_get(f"/api/v2/help_center/articles/{art_id}")

@app.route("/api/hc/search")
def search():
    query = request.args.get("query", "")
    return zd_get(f"/api/v2/help_center/articles/search?query={query}")
```

**依赖**：`flask`、`requests`

---

## 第五部分：前端集成示例

前端调用后端代理层的 API，构建文档浏览 UI。以 React 为例：

```typescript
type Category = {
  id: number;
  name: string;
  description: string;
  html_url: string;
};

type Section = {
  id: number;
  name: string;
  description: string;
  category_id: number;
};

type Article = {
  id: number;
  title: string;
  body: string;
  html_url: string;
  updated_at: string;
  label_names: string[];
};

// 获取分类
const loadCategories = async (): Promise<Category[]> => {
  const res = await fetch('/api/hc/categories');
  const data = await res.json();
  return data.categories ?? [];
};

// 获取 sections
const loadSections = async (categoryId: number): Promise<Section[]> => {
  const res = await fetch(`/api/hc/categories/${categoryId}/sections`);
  const data = await res.json();
  return data.sections ?? [];
};

// 获取文章列表
const loadArticles = async (sectionId: number): Promise<Article[]> => {
  const res = await fetch(`/api/hc/sections/${sectionId}/articles`);
  const data = await res.json();
  return data.articles ?? [];
};

// 获取文章详情 — body 为 HTML，可直接渲染
const loadArticle = async (articleId: number): Promise<Article> => {
  const res = await fetch(`/api/hc/articles/${articleId}`);
  const data = await res.json();
  return data.article;
};

// 搜索
const searchArticles = async (query: string): Promise<Article[]> => {
  const res = await fetch(`/api/hc/search?query=${encodeURIComponent(query)}`);
  const data = await res.json();
  return data.results ?? [];
};
```

**渲染文章内容**：

```tsx
<div dangerouslySetInnerHTML={{ __html: article.body }} />
```

> ⚠️ `dangerouslySetInnerHTML` 直接渲染 Zendesk 返回的 HTML。由于内容来源于你自己的 Zendesk 后台，安全风险可控。如果需要更严格的安全处理，可以使用 `DOMPurify` 库进行 HTML 清洗。

---

## 第六部分：踩坑记录

### 6.1 Help Center 未激活导致 API 401

**现象**：API Token 已创建且状态为 Active，但所有 Help Center API 端点返回 `{"error":"Couldn't authenticate you"}`（401）。

![Help Center API 返回 401](./images/08-hc-api-401.png)

**原因**：Zendesk 计划为 Support 系列，不包含 Guide（Help Center）模块。Help Center API 需要 Suite 系列计划。

**验证方法**：检查 Admin Center → Channels 菜单下是否有 "Help Center" 选项。如果没有，说明计划不支持。

**解决**：升级到 Suite Team 或更高计划。


