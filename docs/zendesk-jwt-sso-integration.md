# Zendesk Help Center — JWT SSO 无感登录集成方案

## 目录

- [背景与目标](#背景与目标)
- [方案总览](#方案总览)
- [前置条件](#前置条件)
- [第一部分：Zendesk 后台配置](#第一部分zendesk-后台配置)
  - [1.1 创建 JWT SSO 配置](#11-创建-jwt-sso-配置)
  - [1.2 获取 Shared Secret](#12-获取-shared-secret)
  - [1.3 激活 SSO 配置](#13-激活-sso-配置)
- [第二部分：技术实现 — BridgePage 服务](#第二部分技术实现--bridgepage-服务)
  - [2.1 架构概述](#21-架构概述)
  - [2.2 BridgePage 核心逻辑（语言无关）](#22-bridgepage-核心逻辑语言无关)
  - [2.3 Node.js / Express 实现](#23-nodejs--express-实现)
  - [2.4 Java / Spring Boot 实现](#24-java--spring-boot-实现)
  - [2.5 Python / Flask 实现](#25-python--flask-实现)
  - [2.6 .NET / C# 实现](#26-net--c-实现)
- [第三部分：前端集成](#第三部分前端集成)
  - [3.1 方案 A — 新标签页](#31-方案-a--新标签页)
  - [3.2 方案 D — 弹窗窗口](#32-方案-d--弹窗窗口)
  - [3.3 方案选择建议](#33-方案选择建议)
- [第四部分：为什么不用 iframe](#第四部分为什么不用-iframe)
- [第五部分：生产环境注意事项](#第五部分生产环境注意事项)
- [附录：JWT Payload 字段说明](#附录jwt-payload-字段说明)

---

## 背景与目标

业务系统（如 CRM / Salora）的用户需要访问 Zendesk Help Center 查看文档或提交工单。目标是实现**无感登录（SSO）**：用户在业务系统中点击按钮，无需再次输入 Zendesk 账号密码，直接跳转到已登录状态的 Zendesk 页面。

Zendesk 官方支持的 SSO 方式为 **JSON Web Token (JWT)**，通过一个中间页面（BridgePage）完成认证跳转。

---

## 方案总览

| 方案 | 展示方式 | 用户体验 | 可行性 |
|------|---------|---------|--------|
| **A — 新标签页** | `window.open(url, '_blank')` | 在新标签页打开 Zendesk | ✅ 已验证 |
| B — 内嵌 iframe | `<iframe>` 嵌入页面 | 在当前页面内展示 | ❌ 被 Zendesk 安全策略阻止 |
| C — 侧边栏 iframe | Drawer + `<iframe>` | 侧边栏内展示 | ❌ 同上 |
| **D — 弹窗窗口** | `window.open(url, name, features)` | 居中弹窗，可控尺寸 | ✅ 已验证 |

**结论：方案 A 和 D 可行，B 和 C 因 Zendesk 的 `X-Frame-Options: SAMEORIGIN` 安全策略被浏览器阻止，无法使用。**

![iframe 被阻止的实际效果 — Drawer 中 iframe 状态为 Loaded 但内容为空白](./images/05-iframe-blocked.png)
*iframe 被 Zendesk 安全策略阻止，状态显示 Loaded 但内容完全空白*

---

## 前置条件

1. 拥有 Zendesk **Admin** 权限的账号
2. Zendesk 计划需支持 JWT SSO（Team 及以上）
3. 后端服务能够识别当前登录用户的身份信息（email、name、external_id）

---

## 第一部分：Zendesk 后台配置

### 1.1 创建 JWT SSO 配置

**路径**：Admin Center → Account → Security → Single sign-on → Create SSO configuration → JSON Web Token

![创建 JWT SSO 配置表单](./images/01-create-jwt-config.png)

各字段填写说明：

| 字段 | 说明 | 示例值 |
|------|------|--------|
| **Configuration name** | 自定义名称，便于识别 | `production-sso` |
| **Remote login URL** | BridgePage 的公网 HTTPS 地址。Zendesk 在用户未登录时会重定向到此 URL | `https://your-domain.com/zendesk/bridge` |
| **Remote logout URL** | 用户从 Zendesk 登出后的跳转地址（可选） | `https://your-domain.com` |
| **Update of external IDs?** | 是否允许通过 email 匹配更新 external_id | 按需选择，通常选 **Off** |
| **IP ranges** | 限制哪些 IP 走 SSO 认证，留空表示全部 | 留空 |
| **Shared secret** | 需先保存配置后才会生成 | 保存后复制 |

> ⚠️ **注意**：Remote login URL 必须是**公网 HTTPS 地址**。`http://localhost` 会被拒绝。
>
> ![Remote login URL 必须是公网 HTTPS](./images/02-remote-login-url-error.png)
>
> 开发阶段可以先填一个占位 URL（如 `https://example.com/zendesk/bridge`）保存配置以获取 Shared Secret，本地测试时前端直接调用 localhost 的 BridgePage 即可。

### 1.2 获取 Shared Secret

保存配置后，回到该配置页面，**Shared secret** 区域会显示生成的密钥。点击 **Copy** 复制并妥善保管。

> ⚠️ 该密钥只会完整显示一次，之后只能重置。务必立即保存到安全的位置（如环境变量、密钥管理服务）。

### 1.3 激活 SSO 配置

保存后，SSO 配置默认为 **Inactive** 状态，必须手动激活才能生效。

![SSO 配置处于 Inactive 状态](./images/03-sso-inactive.png)

**激活步骤**：

1. 在 SSO 配置详情页，点击 **"Go to Team member authentication page"**（如果是给客服/管理员用）或 **"Go to End user authentication page"**（如果是给终端用户用）

2. 在 Team member authentication 页面：
   - 勾选 **External authentication**
   - 在 **Single sign-on (SSO)** 区域，勾选你创建的配置（如 `rock_test`）
   - 选择 **How team members sign in**（建议选 "Let them choose" 以保留密码登录作为备用）
   - 点击 **Save** 保存

![Team member authentication 配置页面](./images/04-team-member-auth.png)

保存后，SSO 配置状态会从 Inactive 变为 **Active**。

---

## 第二部分：技术实现 — BridgePage 服务

### 2.1 架构概述

```
┌─────────────┐     ①点击按钮      ┌──────────────────┐
│             │  ──────────────►  │                  │
│  前端应用    │  window.open()    │  BridgePage      │
│  (CRM/Salora)│                  │  (后端服务)       │
│             │                   │                  │
└─────────────┘                   └────────┬─────────┘
                                           │
                                  ②识别当前用户
                                  ③签发 JWT
                                  ④返回自动提交表单
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │  浏览器自动       │
                                  │  POST 表单到      │
                                  │  Zendesk          │
                                  └────────┬─────────┘
                                           │
                                  ⑤ POST jwt + return_to
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │  Zendesk          │
                                  │  /access/jwt      │
                                  │                   │
                                  │  验证 JWT → 建立   │
                                  │  session → 302    │
                                  │  重定向到 return_to│
                                  └──────────────────┘
```

**核心流程**：

1. 用户在前端点击按钮，通过 `window.open()` 打开 BridgePage URL
2. BridgePage 后端服务识别当前登录用户（通过 session/cookie/token）
3. 使用 Shared Secret 签发 JWT（包含用户 email、name、external_id）
4. 返回一个包含自动提交表单的 HTML 页面
5. 浏览器自动将 JWT POST 到 `https://{subdomain}.zendesk.com/access/jwt`
6. Zendesk 验证 JWT，建立用户 session，重定向到目标页面

### 2.2 BridgePage 核心逻辑（语言无关）

无论使用什么后端语言，BridgePage 的实现逻辑都是相同的：

```
输入：
  - 当前登录用户的信息（email, name, external_id）
  - Zendesk Shared Secret（从环境变量读取）
  - 目标页面 URL（return_to，可选参数）

处理：
  1. 构建 JWT Payload：
     {
       "iat": <当前 Unix 时间戳（秒）>,
       "jti": <唯一随机 ID（防重放）>,
       "email": "user@example.com",
       "name": "User Name",
       "external_id": "12345"
     }

  2. 使用 HS256 算法 + Shared Secret 签名 JWT

输出：
  返回 HTML 页面，包含一个隐藏表单，自动 POST 到 Zendesk：

  <form method="POST" action="https://{subdomain}.zendesk.com/access/jwt">
    <input type="hidden" name="jwt" value="{签名后的JWT}" />
    <input type="hidden" name="return_to" value="{目标页面URL}" />
  </form>
  <script>document.forms[0].submit();</script>
```

### 2.3 Node.js / Express 实现

```javascript
import crypto from 'node:crypto';
import express from 'express';
import jwt from 'jsonwebtoken';

const app = express();

const ZENDESK_SHARED_SECRET = process.env.ZENDESK_SHARED_SECRET;
const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN;

app.get('/zendesk/bridge', (req, res) => {
  const { target, email, name, external_id } = req.query;

  // 生产环境应从 session/auth 中获取用户信息，而非 query 参数
  const payload = {
    iat: Math.floor(Date.now() / 1000),
    jti: crypto.randomUUID(),
    email: String(email),
    name: String(name),
    external_id: String(external_id),
  };

  const token = jwt.sign(payload, ZENDESK_SHARED_SECRET, { algorithm: 'HS256' });
  const action = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/access/jwt`;

  res.type('html').send(`<!doctype html>
<html>
<body>
  <form id="zd" method="POST" action="${action}" style="display:none">
    <input type="hidden" name="jwt" value="${token}" />
    <input type="hidden" name="return_to" value="${String(target)}" />
  </form>
  <script>document.getElementById('zd').submit();</script>
</body>
</html>`);
});
```

**依赖**：`express`、`jsonwebtoken`

### 2.4 Java / Spring Boot 实现

```java
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

import javax.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.UUID;

@Controller
public class ZendeskBridgeController {

    @Value("${zendesk.shared-secret}")
    private String sharedSecret;

    @Value("${zendesk.subdomain}")
    private String subdomain;

    @GetMapping("/zendesk/bridge")
    public void bridge(
            @RequestParam String target,
            @RequestParam String email,
            @RequestParam String name,
            @RequestParam(name = "external_id") String externalId,
            HttpServletResponse response) throws IOException {

        String token = Jwts.builder()
                .setIssuedAt(java.util.Date.from(Instant.now()))
                .setId(UUID.randomUUID().toString())
                .claim("email", email)
                .claim("name", name)
                .claim("external_id", externalId)
                .signWith(SignatureAlgorithm.HS256, sharedSecret.getBytes())
                .compact();

        String action = "https://" + subdomain + ".zendesk.com/access/jwt";

        response.setContentType("text/html;charset=UTF-8");
        response.getWriter().write("<!doctype html>"
                + "<html><body>"
                + "<form id='zd' method='POST' action='" + action + "' style='display:none'>"
                + "<input type='hidden' name='jwt' value='" + token + "' />"
                + "<input type='hidden' name='return_to' value='" + target + "' />"
                + "</form>"
                + "<script>document.getElementById('zd').submit();</script>"
                + "</body></html>");
    }
}
```

**依赖**：`io.jsonwebtoken:jjwt`（Maven: `jjwt-api` + `jjwt-impl` + `jjwt-jackson`）

### 2.5 Python / Flask 实现

```python
import time
import uuid
import jwt
from flask import Flask, request, Response

app = Flask(__name__)

ZENDESK_SHARED_SECRET = os.environ["ZENDESK_SHARED_SECRET"]
ZENDESK_SUBDOMAIN = os.environ["ZENDESK_SUBDOMAIN"]

@app.route("/zendesk/bridge")
def bridge():
    target = request.args.get("target", "")
    email = request.args.get("email", "")
    name = request.args.get("name", "")
    external_id = request.args.get("external_id", "")

    payload = {
        "iat": int(time.time()),
        "jti": str(uuid.uuid4()),
        "email": email,
        "name": name,
        "external_id": external_id,
    }

    token = jwt.encode(payload, ZENDESK_SHARED_SECRET, algorithm="HS256")
    action = f"https://{ZENDESK_SUBDOMAIN}.zendesk.com/access/jwt"

    html = f"""<!doctype html>
<html><body>
  <form id="zd" method="POST" action="{action}" style="display:none">
    <input type="hidden" name="jwt" value="{token}" />
    <input type="hidden" name="return_to" value="{target}" />
  </form>
  <script>document.getElementById('zd').submit();</script>
</body></html>"""

    return Response(html, content_type="text/html")
```

**依赖**：`flask`、`PyJWT`

### 2.6 .NET / C# 实现

```csharp
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

[ApiController]
public class ZendeskBridgeController : ControllerBase
{
    private readonly IConfiguration _config;

    public ZendeskBridgeController(IConfiguration config) => _config = config;

    [HttpGet("/zendesk/bridge")]
    public ContentResult Bridge(
        [FromQuery] string target,
        [FromQuery] string email,
        [FromQuery] string name,
        [FromQuery] string external_id)
    {
        var secret = _config["Zendesk:SharedSecret"];
        var subdomain = _config["Zendesk:Subdomain"];
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));

        var descriptor = new SecurityTokenDescriptor
        {
            IssuedAt = DateTime.UtcNow,
            Claims = new Dictionary<string, object>
            {
                ["jti"] = Guid.NewGuid().ToString(),
                ["email"] = email,
                ["name"] = name,
                ["external_id"] = external_id,
            },
            SigningCredentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256Signature),
        };

        var handler = new JwtSecurityTokenHandler();
        var token = handler.WriteToken(handler.CreateToken(descriptor));
        var action = $"https://{subdomain}.zendesk.com/access/jwt";

        var html = $@"<!doctype html>
<html><body>
  <form id=""zd"" method=""POST"" action=""{action}"" style=""display:none"">
    <input type=""hidden"" name=""jwt"" value=""{token}"" />
    <input type=""hidden"" name=""return_to"" value=""{target}"" />
  </form>
  <script>document.getElementById('zd').submit();</script>
</body></html>";

        return Content(html, "text/html");
    }
}
```

**依赖**：`Microsoft.IdentityModel.Tokens`、`System.IdentityModel.Tokens.Jwt`

---

## 第三部分：前端集成

前端只需要构造 BridgePage 的 URL，然后通过 `window.open()` 打开即可。

### 3.1 方案 A — 新标签页

在浏览器新标签页中打开 Zendesk，用户体验最自然，兼容性最好。

```typescript
const openZendeskNewTab = (config: {
  bridgeBaseUrl: string;
  targetUrl: string;
  email: string;
  name: string;
  externalId: string;
}) => {
  const params = new URLSearchParams({
    target: config.targetUrl,
    email: config.email,
    name: config.name,
    external_id: config.externalId,
  });

  window.open(
    `${config.bridgeBaseUrl}?${params.toString()}`,
    '_blank',
    'noopener,noreferrer',
  );
};
```

**特点**：
- 用户在新标签页中看到完整的 Zendesk 页面
- 不会被浏览器弹窗拦截器阻止（因为是用户主动点击触发）
- 适合需要长时间浏览文档的场景

### 3.2 方案 D — 弹窗窗口

在居中弹窗中打开 Zendesk，窗口尺寸可控，适合快速查看场景。

```typescript
let popupWindow: Window | null = null;

const openZendeskPopup = (config: {
  bridgeBaseUrl: string;
  targetUrl: string;
  email: string;
  name: string;
  externalId: string;
}) => {
  const params = new URLSearchParams({
    target: config.targetUrl,
    email: config.email,
    name: config.name,
    external_id: config.externalId,
  });

  const url = `${config.bridgeBaseUrl}?${params.toString()}`;

  const width = Math.min(1200, Math.round(screen.width * 0.8));
  const height = Math.min(800, Math.round(screen.height * 0.8));
  const left = Math.round((screen.width - width) / 2);
  const top = Math.round((screen.height - height) / 2);

  const features = [
    `width=${width}`,
    `height=${height}`,
    `left=${left}`,
    `top=${top}`,
    'menubar=no',
    'toolbar=no',
    'location=yes',
    'status=no',
    'resizable=yes',
    'scrollbars=yes',
  ].join(',');

  popupWindow = window.open(url, 'zendesk_popup', features);

  if (popupWindow) {
    popupWindow.focus();
  } else {
    // 弹窗被浏览器拦截，降级为新标签页
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};
```

**特点**：
- 窗口居中显示，尺寸为屏幕的 80%（最大 1200×800）
- 隐藏菜单栏和工具栏，界面更简洁
- 可调整大小和滚动
- 如果弹窗被浏览器拦截，自动降级为新标签页
- 适合快速查看/提交工单的场景

### 3.3 方案选择建议

| 场景 | 推荐方案 |
|------|---------|
| 查看 Help Center 文档（长时间浏览） | **A — 新标签页** |
| 快速查看/提交工单 | **D — 弹窗窗口** |
| 需要同时操作 CRM 和 Zendesk | **A — 新标签页**（可以在两个标签页间切换） |
| 移动端 | **A — 新标签页**（弹窗在移动端体验不佳） |

---

## 第四部分：为什么不用 iframe

在验证过程中，我们测试了 iframe 嵌入方案（内嵌 iframe 和 Drawer 侧边栏 iframe），结果如下：

- Zendesk 所有页面都设置了 `X-Frame-Options: SAMEORIGIN` 响应头
- 这意味着只有 `*.zendesk.com` 域名下的页面才能通过 iframe 嵌入 Zendesk
- 浏览器会阻止跨域 iframe 加载 Zendesk 内容
- **Zendesk 官方不提供域名白名单功能**，无法通过联系客服解除此限制

此外，即使 iframe 能加载，还存在以下问题：
- **第三方 Cookie 限制**：现代浏览器（Chrome、Safari、Firefox）逐步禁止第三方 Cookie，iframe 中的 Zendesk session 可能无法持久化
- **Microsoft SSO 嵌套问题**：如果 Zendesk 配置了 Microsoft SSO，`login.microsoftonline.com` 同样禁止 iframe 嵌入
- **CSP 策略冲突**：Content Security Policy 的 `frame-ancestors` 指令也会阻止嵌入

---

## 第五部分：生产环境注意事项

### 5.1 安全性

- **Shared Secret 保管**：必须存储在环境变量或密钥管理服务中（如 AWS Secrets Manager、Azure Key Vault），绝不能硬编码或提交到代码仓库
- **用户身份验证**：BridgePage 必须验证当前请求的用户已在业务系统中登录，不能直接信任 URL 参数中的用户信息。生产环境应从 session/JWT/cookie 中获取用户身份
- **JWT 有效期**：`iat`（签发时间）Zendesk 默认允许 3 分钟的时间偏差。不需要额外设置 `exp`
- **jti 唯一性**：每次签发的 `jti` 必须唯一（使用 UUID），Zendesk 用它防止重放攻击

### 5.2 Remote Login URL

- 生产环境必须使用**公网 HTTPS 地址**
- 该 URL 是 Zendesk 在用户未登录时的重定向目标
- 建议使用独立的路径，如 `https://api.your-domain.com/zendesk/bridge`

### 5.3 Host Mapping

如果配置了 Zendesk Host Mapping（自定义域名指向 Help Center），JWT 提交仍然必须 POST 到 `https://{subdomain}.zendesk.com/access/jwt`，不能使用 host-mapped 域名。

### 5.4 多环境配置

建议为不同环境维护独立的 Zendesk SSO 配置：

| 环境 | Remote Login URL | Shared Secret |
|------|-----------------|---------------|
| Development | `https://dev-api.example.com/zendesk/bridge` | 独立密钥 |
| Staging | `https://staging-api.example.com/zendesk/bridge` | 独立密钥 |
| Production | `https://api.example.com/zendesk/bridge` | 独立密钥 |

---

## 附录：JWT Payload 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `iat` | number | ✅ | JWT 签发时间（Unix 时间戳，秒）。Zendesk 允许 ±3 分钟偏差 |
| `jti` | string | ✅ | JWT 唯一标识符（UUID）。用于防止重放攻击 |
| `email` | string | ✅ | 用户邮箱。Zendesk 用此匹配或创建用户 |
| `name` | string | ✅ | 用户显示名称 |
| `external_id` | string | 推荐 | 业务系统中的用户 ID。用于跨系统关联用户 |
| `organization` | string | 可选 | 用户所属组织名称 |
| `organization_id` | string | 可选 | 组织的 external ID |
| `tags` | string | 可选 | 逗号分隔的标签列表 |
| `remote_photo_url` | string | 可选 | 用户头像 URL |
| `locale_id` | number | 可选 | 用户语言偏好（Zendesk locale ID） |
