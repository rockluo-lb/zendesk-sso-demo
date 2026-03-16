# 第五部分：前端集成示例

## 集成方式

前端通过后端代理层调用 Zendesk Help Center API，构建嵌入式知识库 UI。

## 核心功能

| 功能 | 调用路径 | 说明 |
|------|----------|------|
| 分类列表 | `GET /api/hc/categories` | 获取所有分类 |
| 章节列表 | `GET /api/hc/categories/:id/sections` | 获取分类下的章节 |
| 文章列表 | `GET /api/hc/sections/:id/articles` | 获取章节下的文章 |
| 文章详情 | `GET /api/hc/articles/:id` | 获取文章标题和 HTML 正文 |
| 全文搜索 | `GET /api/hc/search?query=...` | 搜索文章 |
| 创建文章 | `POST /api/hc/sections/:id/articles` | 创建新文章 |
| 编辑文章 | `PUT /api/hc/articles/:id/translations/:locale` | 更新标题和正文 |
| 删除文章 | `DELETE /api/hc/articles/:id` | 归档文章 |
| 上传附件 | `POST /api/hc/articles/:id/attachments` | multipart/form-data |

## 关键说明

- 文章 `body` 字段为 **HTML 格式**，可直接渲染
- 渲染 HTML 内容时建议使用 `DOMPurify` 进行安全清洗
- 文章标题和正文的编辑需通过 **Translations API**（而非 Articles API）
- 数据层级为 Category → Section → Article 三级结构
