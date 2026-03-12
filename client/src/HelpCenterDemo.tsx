import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Empty,
  Flex,
  Input,
  List,
  Spin,
  Tag,
  Typography,
} from 'antd';
import { useEffect, useState } from 'react';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;

type HcHealth = { hasApiToken: boolean; apiEmail: string; subdomain: string };
type Category = { id: number; name: string; description: string; html_url: string };
type Section = { id: number; name: string; description: string; html_url: string; category_id: number };
type Article = { id: number; title: string; body: string; html_url: string; section_id: number; created_at: string; updated_at: string; author_id: number; label_names: string[] };

type View =
  | { type: 'home' }
  | { type: 'sections'; category: Category }
  | { type: 'articles'; section: Section; category: Category }
  | { type: 'article'; article: Article; section: Section; category: Category }
  | { type: 'search'; query: string };

function HelpCenterDemo() {
  const [health, setHealth] = useState<HcHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [categories, setCategories] = useState<Category[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [currentArticle, setCurrentArticle] = useState<Article | null>(null);
  const [searchResults, setSearchResults] = useState<Article[]>([]);

  const [view, setView] = useState<View>({ type: 'home' });

  useEffect(() => {
    fetch('/zendesk/hc/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    if (health?.hasApiToken) loadCategories();
  }, [health]);

  const loadCategories = async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/zendesk/hc/categories').catch(() => null);
    if (!res?.ok) {
      setError(`Failed to load categories (${res?.status ?? 'network error'})`);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setCategories(data.categories ?? []);
    setLoading(false);
  };

  const loadSections = async (category: Category) => {
    setLoading(true);
    setError('');
    setView({ type: 'sections', category });
    const res = await fetch(`/zendesk/hc/categories/${category.id}/sections`).catch(() => null);
    if (!res?.ok) {
      setError(`Failed to load sections (${res?.status ?? 'network error'})`);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setSections(data.sections ?? []);
    setLoading(false);
  };

  const loadArticles = async (section: Section, category: Category) => {
    setLoading(true);
    setError('');
    setView({ type: 'articles', section, category });
    const res = await fetch(`/zendesk/hc/sections/${section.id}/articles`).catch(() => null);
    if (!res?.ok) {
      setError(`Failed to load articles (${res?.status ?? 'network error'})`);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setArticles(data.articles ?? []);
    setLoading(false);
  };

  const loadArticle = async (articleId: number, section: Section, category: Category) => {
    setLoading(true);
    setError('');
    const res = await fetch(`/zendesk/hc/articles/${articleId}`).catch(() => null);
    if (!res?.ok) {
      setError(`Failed to load article (${res?.status ?? 'network error'})`);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setCurrentArticle(data.article ?? null);
    setView({ type: 'article', article: data.article, section, category });
    setLoading(false);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setView({ type: 'search', query });
    const res = await fetch(`/zendesk/hc/search?query=${encodeURIComponent(query)}`).catch(() => null);
    if (!res?.ok) {
      setError(`Search failed (${res?.status ?? 'network error'})`);
      setLoading(false);
      return;
    }
    const data = await res.json();
    setSearchResults(data.results ?? []);
    setLoading(false);
  };

  const goHome = () => {
    setView({ type: 'home' });
    setError('');
  };

  const breadcrumbItems = (() => {
    const items = [{ title: <a onClick={goHome}>Help Center</a> }];
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

  if (!health) {
    return (
      <Card>
        <Spin tip="Checking HC API connection..." />
      </Card>
    );
  }

  if (!health.hasApiToken) {
    return (
      <Alert
        type="error"
        showIcon
        message="Zendesk API Token not configured"
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
      <Flex justify="space-between" align="center">
        <Breadcrumb items={breadcrumbItems} />
        <Tag color="green">API: {health.apiEmail}</Tag>
      </Flex>

      <Search
        placeholder="Search articles..."
        enterButton
        onSearch={handleSearch}
        style={{ maxWidth: 500 }}
        allowClear
      />

      {error && <Alert type="error" showIcon message={error} closable onClose={() => setError('')} />}

      {loading && (
        <Flex justify="center" style={{ padding: 40 }}>
          <Spin size="large" />
        </Flex>
      )}

      {!loading && view.type === 'home' && (
        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
          dataSource={categories}
          locale={{ emptyText: <Empty description="No categories found" /> }}
          renderItem={(cat) => (
            <List.Item>
              <Card
                hoverable
                onClick={() => loadSections(cat)}
                title={cat.name}
                size="small"
              >
                <Paragraph type="secondary" ellipsis={{ rows: 2 }}>
                  {cat.description || 'No description'}
                </Paragraph>
              </Card>
            </List.Item>
          )}
        />
      )}

      {!loading && view.type === 'sections' && (
        <List
          dataSource={sections}
          locale={{ emptyText: <Empty description="No sections in this category" /> }}
          renderItem={(sec) => (
            <List.Item>
              <Card
                hoverable
                onClick={() => loadArticles(sec, view.category)}
                style={{ width: '100%' }}
                size="small"
              >
                <Text strong>{sec.name}</Text>
                {sec.description && (
                  <Paragraph type="secondary" style={{ margin: '4px 0 0' }} ellipsis={{ rows: 2 }}>
                    {sec.description}
                  </Paragraph>
                )}
              </Card>
            </List.Item>
          )}
        />
      )}

      {!loading && view.type === 'articles' && (
        <List
          dataSource={articles}
          locale={{ emptyText: <Empty description="No articles in this section" /> }}
          renderItem={(art) => (
            <List.Item>
              <Card
                hoverable
                onClick={() => loadArticle(art.id, view.section, view.category)}
                style={{ width: '100%' }}
                size="small"
              >
                <Flex justify="space-between" align="center">
                  <Text strong>{art.title}</Text>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(art.updated_at).toLocaleDateString()}
                  </Text>
                </Flex>
                {art.label_names?.length > 0 && (
                  <Flex gap={4} style={{ marginTop: 4 }}>
                    {art.label_names.map((l) => <Tag key={l}>{l}</Tag>)}
                  </Flex>
                )}
              </Card>
            </List.Item>
          )}
        />
      )}

      {!loading && view.type === 'article' && currentArticle && (
        <Card
          title={currentArticle.title}
          extra={
            <Button type="link" href={currentArticle.html_url} target="_blank">
              Open in Zendesk
            </Button>
          }
        >
          <div
            dangerouslySetInnerHTML={{ __html: currentArticle.body }}
            style={{ lineHeight: 1.8 }}
          />
          <Flex gap={8} style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Updated: {new Date(currentArticle.updated_at).toLocaleString()}
            </Text>
            {currentArticle.label_names?.length > 0 &&
              currentArticle.label_names.map((l) => <Tag key={l}>{l}</Tag>)
            }
          </Flex>
        </Card>
      )}

      {!loading && view.type === 'search' && (
        <List
          dataSource={searchResults}
          locale={{ emptyText: <Empty description={`No results for "${view.query}"`} /> }}
          header={<Text type="secondary">{searchResults.length} result(s)</Text>}
          renderItem={(art) => (
            <List.Item>
              <Card hoverable style={{ width: '100%' }} size="small">
                <Flex justify="space-between" align="center">
                  <Text strong>{art.title}</Text>
                  <Button type="link" href={art.html_url} target="_blank" size="small">
                    Open in Zendesk
                  </Button>
                </Flex>
                {art.body && (
                  <Paragraph
                    type="secondary"
                    style={{ margin: '4px 0 0' }}
                    ellipsis={{ rows: 2 }}
                  >
                    <span dangerouslySetInnerHTML={{ __html: art.body.replace(/<[^>]*>/g, '').slice(0, 200) }} />
                  </Paragraph>
                )}
              </Card>
            </List.Item>
          )}
        />
      )}
    </div>
  );
}

export { HelpCenterDemo };
