import { Alert, Breadcrumb, Card, Flex, Input, Spin, Tag, message } from 'antd';
import { useEffect, useState } from 'react';
import { api, jsonBody } from './help-center/api';
import type { Article, Attachment, Category, HcHealth, Section, View } from './help-center/types';
import {
  ArticleDetail, ArticleList, ArticleModal,
  CategoryList, CategoryModal,
  EditContentModal,
  SearchResults,
  SectionList, SectionModal,
} from './help-center/components';

const { Search } = Input;

function HelpCenterDemo() {
  const [health, setHealth] = useState<HcHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [searchResults, setSearchResults] = useState<Article[]>([]);

  const [view, setView] = useState<View>({ type: 'home' });

  const [categoryModal, setCategoryModal] = useState<{ open: boolean; editing: Category | null }>({ open: false, editing: null });
  const [sectionModal, setSectionModal] = useState<{ open: boolean; editing: Section | null; categoryId: number }>({ open: false, editing: null, categoryId: 0 });
  const [articleModal, setArticleModal] = useState<{ open: boolean; editing: Article | null; sectionId: number }>({ open: false, editing: null, sectionId: 0 });
  const [editContentModal, setEditContentModal] = useState<{ open: boolean; article: Article | null }>({ open: false, article: null });

  const [msgApi, contextHolder] = message.useMessage();

  useEffect(() => {
    fetch('/zendesk/hc/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    if (health?.hasApiToken) loadCategories();
  }, [health]);

  // ── Data Loading ──

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    const { ok, status, data } = await api<{ categories: Category[] }>('/zendesk/hc/categories');
    if (!ok) { setError(`Failed to load categories (${status})`); setLoading(false); return; }
    setCategories(data.categories ?? []);
    setLoading(false);
  };

  const loadSections = async (category: Category) => {
    setLoading(true);
    setError('');
    setView({ type: 'sections', category });
    const { ok, status, data } = await api<{ sections: Section[] }>(`/zendesk/hc/categories/${category.id}/sections`);
    if (!ok) { setError(`Failed to load sections (${status})`); setLoading(false); return; }
    setSections(data.sections ?? []);
    setLoading(false);
  };

  const loadArticles = async (section: Section, category: Category) => {
    setLoading(true);
    setError('');
    setView({ type: 'articles', section, category });
    const { ok, status, data } = await api<{ articles: Article[] }>(`/zendesk/hc/sections/${section.id}/articles`);
    if (!ok) { setError(`Failed to load articles (${status})`); setLoading(false); return; }
    setArticles(data.articles ?? []);
    setLoading(false);
  };

  const loadArticle = async (articleId: number, section: Section, category: Category) => {
    setLoading(true);
    setError('');
    const [artRes, attRes] = await Promise.all([
      api<{ article: Article }>(`/zendesk/hc/articles/${articleId}`),
      api<{ article_attachments: Attachment[] }>(`/zendesk/hc/articles/${articleId}/attachments`),
    ]);
    if (!artRes.ok) { setError(`Failed to load article (${artRes.status})`); setLoading(false); return; }
    const article = artRes.data.article;
    setCurrentArticle(article);
    setAttachments(attRes.ok ? (attRes.data.article_attachments ?? []) : []);
    setView({ type: 'article', article, section, category });
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setView({ type: 'search', query });
    const { ok, status, data } = await api<{ results: Article[] }>(`/zendesk/hc/search?query=${encodeURIComponent(query)}`);
    if (!ok) { setError(`Search failed (${status})`); setLoading(false); return; }
    setSearchResults(data.results ?? []);
    setLoading(false);
  };

  const goHome = () => { setView({ type: 'home' }); setError(''); };

  // ── Category CRUD ──

  const openCategoryModal = (editing: Category | null = null) => {
    setCategoryModal({ open: true, editing });
  };

  const handleCategorySubmit = async (values: { name: string; description: string }) => {
    const { editing } = categoryModal;
    setLoading(true);
    if (editing) {
      const { ok } = await api(`/zendesk/hc/categories/${editing.id}`, { method: 'PUT', ...jsonBody({ category: values }) });
      if (!ok) { msgApi.error('Failed to update category'); setLoading(false); return; }
      msgApi.success('Category updated');
    } else {
      const { ok } = await api('/zendesk/hc/categories', { method: 'POST', ...jsonBody({ category: { ...values, locale: 'en-us' } }) });
      if (!ok) { msgApi.error('Failed to create category'); setLoading(false); return; }
      msgApi.success('Category created');
    }
    setCategoryModal({ open: false, editing: null });
    await loadCategories();
    setLoading(false);
  };

  const deleteCategory = async (id: number) => {
    setLoading(true);
    const { ok } = await api(`/zendesk/hc/categories/${id}`, { method: 'DELETE' });
    if (!ok) { msgApi.error('Failed to delete category'); setLoading(false); return; }
    msgApi.success('Category deleted');
    await loadCategories();
    setLoading(false);
  };

  // ── Section CRUD ──

  const openSectionModal = (categoryId: number, editing: Section | null = null) => {
    setSectionModal({ open: true, editing, categoryId });
  };

  const handleSectionSubmit = async (values: { name: string; description: string }) => {
    const { editing, categoryId } = sectionModal;
    setLoading(true);
    if (editing) {
      const { ok } = await api(`/zendesk/hc/sections/${editing.id}`, { method: 'PUT', ...jsonBody({ section: values }) });
      if (!ok) { msgApi.error('Failed to update section'); setLoading(false); return; }
      msgApi.success('Section updated');
    } else {
      const { ok } = await api(`/zendesk/hc/categories/${categoryId}/sections`, { method: 'POST', ...jsonBody({ section: { ...values, locale: 'en-us' } }) });
      if (!ok) { msgApi.error('Failed to create section'); setLoading(false); return; }
      msgApi.success('Section created');
    }
    setSectionModal({ open: false, editing: null, categoryId: 0 });
    if (view.type === 'sections') await loadSections(view.category);
    setLoading(false);
  };

  const deleteSection = async (id: number) => {
    setLoading(true);
    const { ok } = await api(`/zendesk/hc/sections/${id}`, { method: 'DELETE' });
    if (!ok) { msgApi.error('Failed to delete section'); setLoading(false); return; }
    msgApi.success('Section deleted');
    if (view.type === 'sections') await loadSections(view.category);
    setLoading(false);
  };

  // ── Article CRUD ──

  const openArticleModal = (sectionId: number, editing: Article | null = null) => {
    setArticleModal({ open: true, editing, sectionId });
  };

  const handleArticleSubmit = async (values: { title: string; body: string; label_names: string }) => {
    const { editing, sectionId } = articleModal;
    const labels = values.label_names.split(',').map((s) => s.trim()).filter(Boolean);
    setLoading(true);

    if (editing) {
      const metaRes = await api(`/zendesk/hc/articles/${editing.id}`, { method: 'PUT', ...jsonBody({ article: { label_names: labels } }) });
      const transRes = await api(`/zendesk/hc/articles/${editing.id}/translations/${editing.locale || 'en-us'}`, {
        method: 'PUT', ...jsonBody({ translation: { title: values.title, body: values.body } }),
      });
      if (!metaRes.ok && !transRes.ok) { msgApi.error('Failed to update article'); setLoading(false); return; }
      msgApi.success('Article updated');
    } else {
      const { ok } = await api(`/zendesk/hc/sections/${sectionId}/articles`, {
        method: 'POST',
        ...jsonBody({
          article: { title: values.title, body: values.body, locale: 'en-us', label_names: labels, user_segment_id: null, permission_group_id: 1 },
          notify_subscribers: false,
        }),
      });
      if (!ok) { msgApi.error('Failed to create article'); setLoading(false); return; }
      msgApi.success('Article created');
    }
    setArticleModal({ open: false, editing: null, sectionId: 0 });
    if (view.type === 'articles') await loadArticles(view.section, view.category);
    if (view.type === 'article') await loadArticle(editing!.id, view.section, view.category);
    setLoading(false);
  };

  const deleteArticle = async (id: number) => {
    setLoading(true);
    const { ok } = await api(`/zendesk/hc/articles/${id}`, { method: 'DELETE' });
    if (!ok) { msgApi.error('Failed to archive article'); setLoading(false); return; }
    msgApi.success('Article archived');
    if (view.type === 'articles') await loadArticles(view.section, view.category);
    else if (view.type === 'article') {
      setView({ type: 'articles', section: view.section, category: view.category });
      await loadArticles(view.section, view.category);
    }
    setLoading(false);
  };

  // ── Edit Content ──

  const openEditContent = (article: Article) => {
    setEditContentModal({ open: true, article });
  };

  const handleEditContentSubmit = async (values: { title: string; body: string }) => {
    const article = editContentModal.article!;
    setLoading(true);
    const { ok } = await api(`/zendesk/hc/articles/${article.id}/translations/${article.locale || 'en-us'}`, {
      method: 'PUT', ...jsonBody({ translation: { title: values.title, body: values.body } }),
    });
    if (!ok) { msgApi.error('Failed to update content'); setLoading(false); return; }
    msgApi.success('Content updated');
    setEditContentModal({ open: false, article: null });
    if (view.type === 'article') await loadArticle(article.id, view.section, view.category);
    setLoading(false);
  };

  // ── Attachment ──

  const deleteAttachment = async (attId: number) => {
    const { ok } = await api(`/zendesk/hc/attachments/${attId}`, { method: 'DELETE' });
    if (!ok) { msgApi.error('Failed to delete attachment'); return; }
    msgApi.success('Attachment deleted');
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  // ── Breadcrumb ──

  const breadcrumbItems = (() => {
    const items: Array<{ title: React.ReactNode }> = [{ title: <a onClick={goHome}>Help Center</a> }];
    if (view.type === 'sections') {
      items.push({ title: view.category.name });
    } else if (view.type === 'articles') {
      items.push({ title: <a onClick={() => loadSections(view.category)}>{view.category.name}</a> });
      items.push({ title: view.section.name });
    } else if (view.type === 'article') {
      items.push({ title: <a onClick={() => loadSections(view.category)}>{view.category.name}</a> });
      items.push({ title: <a onClick={() => loadArticles(view.section, view.category)}>{view.section.name}</a> });
      items.push({ title: view.article.title });
    } else if (view.type === 'search') {
      items.push({ title: `Search: "${view.query}"` });
    }
    return items;
  })();

  // ── Render ──

  if (!health) {
    return <Card><Spin tip="Checking HC API connection..." /></Card>;
  }

  if (!health.hasApiToken) {
    return (
      <Alert
        type="error" showIcon message="Zendesk API Token not configured"
        description={
          <div>
            <p>Help Center API requires an API token. Steps to configure:</p>
            <ol>
              <li>Go to Zendesk Admin Center → Apps and integrations → Zendesk API</li>
              <li>Enable Token Access, create a new API token</li>
              <li>Add <code>ZENDESK_API_EMAIL</code> and <code>ZENDESK_API_TOKEN</code> to <code>.env</code></li>
              <li>Restart the server</li>
            </ol>
          </div>
        }
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {contextHolder}

      <Flex justify="space-between" align="center">
        <Breadcrumb items={breadcrumbItems} />
        <Tag color="green">API: {health.apiEmail}</Tag>
      </Flex>

      <Flex gap={8} align="center">
        <Search placeholder="Search articles..." enterButton onSearch={handleSearch} style={{ maxWidth: 500 }} allowClear />
      </Flex>

      {error && <Alert type="error" showIcon message={error} closable onClose={() => setError('')} />}
      {loading && <Flex justify="center" style={{ padding: 40 }}><Spin size="large" /></Flex>}

      {!loading && view.type === 'home' && (
        <CategoryList
          categories={categories}
          onSelect={loadSections}
          onAdd={() => openCategoryModal()}
          onEdit={openCategoryModal}
          onDelete={deleteCategory}
        />
      )}

      {!loading && view.type === 'sections' && (
        <SectionList
          sections={sections}
          categoryId={view.category.id}
          onSelect={(sec) => loadArticles(sec, view.category)}
          onAdd={(catId) => openSectionModal(catId)}
          onEdit={(sec) => openSectionModal(view.category.id, sec)}
          onDelete={deleteSection}
        />
      )}

      {!loading && view.type === 'articles' && (
        <ArticleList
          articles={articles}
          sectionId={view.section.id}
          onSelect={(art) => loadArticle(art.id, view.section, view.category)}
          onAdd={(secId) => openArticleModal(secId)}
          onEdit={(art) => openArticleModal(view.section.id, art)}
          onDelete={deleteArticle}
        />
      )}

      {!loading && view.type === 'article' && currentArticle && (
        <ArticleDetail
          article={currentArticle}
          attachments={attachments}
          onEdit={openEditContent}
          onDelete={deleteArticle}
          onDeleteAttachment={deleteAttachment}
          onReload={() => loadArticle(currentArticle.id, view.section, view.category)}
        />
      )}

      {!loading && view.type === 'search' && (
        <SearchResults results={searchResults} query={view.query} />
      )}

      <CategoryModal
        open={categoryModal.open}
        editing={categoryModal.editing}
        onSubmit={handleCategorySubmit}
        onCancel={() => setCategoryModal({ open: false, editing: null })}
      />

      <SectionModal
        open={sectionModal.open}
        editing={sectionModal.editing}
        onSubmit={handleSectionSubmit}
        onCancel={() => setSectionModal({ open: false, editing: null, categoryId: 0 })}
      />

      <ArticleModal
        open={articleModal.open}
        editing={articleModal.editing}
        onSubmit={handleArticleSubmit}
        onCancel={() => setArticleModal({ open: false, editing: null, sectionId: 0 })}
      />

      <EditContentModal
        open={editContentModal.open}
        article={editContentModal.article}
        onSubmit={handleEditContentSubmit}
        onCancel={() => setEditContentModal({ open: false, article: null })}
      />
    </div>
  );
}

export { HelpCenterDemo };
