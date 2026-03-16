import { Button, Card, Empty, Flex, List, Popconfirm, Space, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { Category } from '../types';

const { Paragraph } = Typography;

type CategoryListProps = {
  categories: Category[];
  onSelect: (category: Category) => void;
  onAdd: () => void;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
};

function CategoryList({ categories, onSelect, onAdd, onEdit, onDelete }: CategoryListProps) {
  return (
    <>
      <Flex justify="flex-end">
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>New Category</Button>
      </Flex>
      <List
        grid={{ gutter: 16, xs: 1, sm: 2, md: 3 }}
        dataSource={categories}
        locale={{ emptyText: <Empty description="No categories found" /> }}
        renderItem={(cat) => (
          <List.Item>
            <Card
              hoverable onClick={() => onSelect(cat)} title={cat.name} size="small"
              extra={
                <Space size={0} onClick={(e) => e.stopPropagation()}>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(cat)} />
                  <Popconfirm title="Delete this category and all its content?" onConfirm={() => onDelete(cat.id)} okText="Delete" okButtonProps={{ danger: true }}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              }
            >
              <Paragraph type="secondary" ellipsis={{ rows: 2 }}>{cat.description || 'No description'}</Paragraph>
            </Card>
          </List.Item>
        )}
      />
    </>
  );
}

export { CategoryList };
