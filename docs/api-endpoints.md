# 第三部分：核心 API 端点

Base URL：`https://{subdomain}.zendesk.com`

> 官方文档：[Help Center API Reference](https://developer.zendesk.com/api-reference/help_center/help-center-api/introduction/)

---

## 3.1 Categories（分类管理）

| 操作 | 方法 | 端点 | 权限 |
|------|------|------|------|
| 列出所有分类 | `GET` | `/api/v2/help_center/categories` | Agents |
| 按语言列出分类 | `GET` | `/api/v2/help_center/{locale}/categories` | Anonymous |
| 获取单个分类 | `GET` | `/api/v2/help_center/categories/{category_id}` | Agents |
| 创建分类 | `POST` | `/api/v2/help_center/categories` | HC managers |
| 更新分类 | `PUT` | `/api/v2/help_center/categories/{category_id}` | HC managers |
| 删除分类 | `DELETE` | `/api/v2/help_center/categories/{category_id}` | HC managers |

> - PUT 仅更新元数据（排序位置等），翻译内容需通过 Translations API 更新
> - DELETE 会级联删除其下所有 Sections 和 Articles

---

## 3.2 Sections（章节管理）

| 操作 | 方法 | 端点 | 权限 |
|------|------|------|------|
| 列出所有章节 | `GET` | `/api/v2/help_center/sections` | Agents |
| 列出分类下的章节 | `GET` | `/api/v2/help_center/categories/{category_id}/sections` | Agents |
| 获取单个章节 | `GET` | `/api/v2/help_center/sections/{section_id}` | Agents |
| 创建章节 | `POST` | `/api/v2/help_center/categories/{category_id}/sections` | HC managers |
| 更新章节 | `PUT` | `/api/v2/help_center/sections/{section_id}` | HC managers |
| 删除章节 | `DELETE` | `/api/v2/help_center/sections/{section_id}` | HC managers |

> - 可通过修改 `category_id` 将 Section 移动到另一个 Category 下
> - DELETE 会级联删除其下所有 Articles

---

## 3.3 Articles（文章管理）

| 操作 | 方法 | 端点 | 权限 |
|------|------|------|------|
| 列出所有文章 | `GET` | `/api/v2/help_center/articles` | Anonymous |
| 列出章节下的文章 | `GET` | `/api/v2/help_center/sections/{section_id}/articles` | Anonymous |
| 获取单篇文章 | `GET` | `/api/v2/help_center/articles/{article_id}` | Agents |
| 创建文章 | `POST` | `/api/v2/help_center/sections/{section_id}/articles` | Agents |
| 更新文章元数据 | `PUT` | `/api/v2/help_center/articles/{article_id}` | Agents |
| 更新文章标题/正文 | `PUT` | `/api/v2/help_center/articles/{article_id}/translations/{locale}` | Agents |
| 删除（归档）文章 | `DELETE` | `/api/v2/help_center/articles/{article_id}` | Agents |

> - PUT articles 仅更新元数据（promoted、label_names 等），**标题和正文必须通过 Translations API 更新**
> - DELETE 实际是归档，可在 Zendesk 管理界面恢复
> - 创建时必填字段：`title`、`locale`、`permission_group_id`、`user_segment_id`

**查询参数**：`sort_by`、`sort_order`、`label_names`、`include`（sideload users/sections/categories）

---

## 3.4 Article Attachments（文章附件）

| 操作 | 方法 | 端点 | 权限 |
|------|------|------|------|
| 列出文章附件 | `GET` | `/api/v2/help_center/articles/{article_id}/attachments` | End users |
| 上传附件 | `POST` | `/api/v2/help_center/articles/{article_id}/attachments` | Agents |
| 批量关联附件 | `POST` | `/api/v2/help_center/articles/{article_id}/bulk_attachments` | Agents |
| 删除附件 | `DELETE` | `/api/v2/help_center/articles/attachments/{attachment_id}` | Agents |

> - 上传使用 `multipart/form-data`，单文件限制 **20 MB**
> - `inline=true` 表示图片嵌入文章正文
> - 批量关联每次最多 **20 个**附件

---

## 3.5 Search（搜索）

| 操作 | 方法 | 端点 | 权限 |
|------|------|------|------|
| 搜索文章 | `GET` | `/api/v2/help_center/articles/search?query={keyword}` | Anonymous |

**过滤参数**：`filter[category_ids]`、`filter[section_ids]`、`filter[label_names]`、`sort_by`、`per_page`（最大 50）

---

## 3.6 Translations（多语言翻译）

| 操作 | 方法 | 端点 |
|------|------|------|
| 列出翻译 | `GET` | `/api/v2/help_center/articles/{article_id}/translations` |
| 获取特定语言 | `GET` | `/api/v2/help_center/articles/{article_id}/translations/{locale}` |
| 创建翻译 | `POST` | `/api/v2/help_center/articles/{article_id}/translations` |
| 更新翻译 | `PUT` | `/api/v2/help_center/articles/{article_id}/translations/{locale}` |
| 删除翻译 | `DELETE` | `/api/v2/help_center/articles/{article_id}/translations/{locale}` |
| 列出缺失翻译 | `GET` | `/api/v2/help_center/articles/{article_id}/translations/missing` |

> Categories 和 Sections 同样支持 Translations API，端点结构一致。

---

## 3.7 API 能力总览

| 资源 | 查询 | 创建 | 更新 | 删除 | 附件 | 翻译 |
|------|------|------|------|------|------|------|
| Categories | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Sections | ✅ | ✅ | ✅ | ✅ | — | ✅ |
| Articles | ✅ | ✅ | ✅ | ✅（归档） | ✅ | ✅ |
| Search | ✅ | — | — | — | — | — |

**权限说明**：

| 角色 | 能力 |
|------|------|
| Anonymous / End users | 查询公开内容、搜索 |
| Agents | 完整 CRUD（受 permission_group 限制） |
| Guide admins / HC managers | 管理 Categories、Sections、权限组 |
