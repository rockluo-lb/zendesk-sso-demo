import { Alert, Button, Card, Flex, List, Popconfirm, Space, Tag, Typography, Upload, message } from 'antd';
import { DeleteOutlined, EditOutlined, UploadOutlined } from '@ant-design/icons';
import type { Article, Attachment } from '../types';

const { Text } = Typography;

type ArticleDetailProps = {
  article: Article;
  attachments: Attachment[];
  onEdit: (article: Article) => void;
  onDelete: (id: number) => void;
  onDeleteAttachment: (id: number) => void;
  onReload: () => void;
};

function ArticleDetail({
  article, attachments,
  onEdit, onDelete, onDeleteAttachment, onReload,
}: ArticleDetailProps) {
  const [msgApi, contextHolder] = message.useMessage();

  return (
    <Card
      title={article.title}
      extra={
        <Space>
          <Button icon={<EditOutlined />} onClick={() => onEdit(article)}>Edit</Button>
          <Popconfirm title="Archive this article?" onConfirm={() => onDelete(article.id)} okText="Archive" okButtonProps={{ danger: true }}>
            <Button danger icon={<DeleteOutlined />}>Archive</Button>
          </Popconfirm>
          <Button type="link" href={article.html_url} target="_blank">Open in Zendesk</Button>
        </Space>
      }
    >
      {contextHolder}
      {article.draft && <Alert type="warning" message="This article is a draft" showIcon style={{ marginBottom: 16 }} />}
      <div dangerouslySetInnerHTML={{ __html: article.body }} style={{ lineHeight: 1.8 }} />

      <Flex gap={8} style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
        <Text type="secondary" style={{ fontSize: 12 }}>Updated: {new Date(article.updated_at).toLocaleString()}</Text>
        {article.label_names?.length > 0 && article.label_names.map((l) => <Tag key={l}>{l}</Tag>)}
      </Flex>

      <div style={{ marginTop: 16, borderTop: '1px solid #f0f0f0', paddingTop: 12 }}>
        <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
          <Text strong>Attachments ({attachments.length})</Text>
          <Upload
            action={`/zendesk/hc/articles/${article.id}/attachments`}
            showUploadList={false}
            onChange={(info) => {
              if (info.file.status === 'done') {
                msgApi.success(`${info.file.name} uploaded`);
                onReload();
              } else if (info.file.status === 'error') {
                msgApi.error(`${info.file.name} upload failed`);
              }
            }}
          >
            <Button size="small" icon={<UploadOutlined />}>Upload</Button>
          </Upload>
        </Flex>
        {attachments.length > 0 ? (
          <List
            size="small" dataSource={attachments}
            renderItem={(att) => (
              <List.Item
                actions={[
                  <Button type="link" size="small" href={att.content_url} target="_blank" key="dl">Download</Button>,
                  <Popconfirm key="del" title="Delete this attachment?" onConfirm={() => onDeleteAttachment(att.id)}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>,
                ]}
              >
                <List.Item.Meta
                  title={att.file_name}
                  description={`${att.content_type} · ${(att.size / 1024).toFixed(1)} KB${att.inline ? ' · inline' : ''}`}
                />
              </List.Item>
            )}
          />
        ) : (
          <Text type="secondary">No attachments</Text>
        )}
      </div>
    </Card>
  );
}

export { ArticleDetail };
