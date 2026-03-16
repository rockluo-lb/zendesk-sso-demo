import { Button, Card, Empty, Flex, List, Popconfirm, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { Article } from '../types';

const { Text } = Typography;

type ArticleListProps = {
  articles: Article[];
  sectionId: number;
  onSelect: (article: Article) => void;
  onAdd: (sectionId: number) => void;
  onEdit: (article: Article) => void;
  onDelete: (id: number) => void;
};

function ArticleList({ articles, sectionId, onSelect, onAdd, onEdit, onDelete }: ArticleListProps) {
  return (
    <>
      <Flex justify="flex-end">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => onAdd(sectionId)}>New Article</Button>
      </Flex>
      <List
        dataSource={articles}
        locale={{ emptyText: <Empty description="No articles in this section" /> }}
        renderItem={(art) => (
          <List.Item>
            <Card
              hoverable onClick={() => onSelect(art)} style={{ width: '100%' }} size="small"
              extra={
                <Space size={0} onClick={(e) => e.stopPropagation()}>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(art)} />
                  <Popconfirm title="Archive this article?" onConfirm={() => onDelete(art.id)} okText="Archive" okButtonProps={{ danger: true }}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              }
            >
              <Flex justify="space-between" align="center">
                <Text strong>{art.title}</Text>
                <Space>
                  {art.draft && <Tag color="orange">Draft</Tag>}
                  <Text type="secondary" style={{ fontSize: 12 }}>{new Date(art.updated_at).toLocaleDateString()}</Text>
                </Space>
              </Flex>
              {art.label_names?.length > 0 && (
                <Flex gap={4} style={{ marginTop: 4 }}>{art.label_names.map((l) => <Tag key={l}>{l}</Tag>)}</Flex>
              )}
            </Card>
          </List.Item>
        )}
      />
    </>
  );
}

export { ArticleList };
