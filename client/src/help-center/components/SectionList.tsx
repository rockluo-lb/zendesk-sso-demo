import { Button, Card, Empty, Flex, List, Popconfirm, Space, Typography } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import type { Section } from '../types';

const { Text, Paragraph } = Typography;

type SectionListProps = {
  sections: Section[];
  categoryId: number;
  onSelect: (section: Section) => void;
  onAdd: (categoryId: number) => void;
  onEdit: (section: Section) => void;
  onDelete: (id: number) => void;
};

function SectionList({ sections, categoryId, onSelect, onAdd, onEdit, onDelete }: SectionListProps) {
  return (
    <>
      <Flex justify="flex-end">
        <Button type="primary" icon={<PlusOutlined />} onClick={() => onAdd(categoryId)}>New Section</Button>
      </Flex>
      <List
        dataSource={sections}
        locale={{ emptyText: <Empty description="No sections in this category" /> }}
        renderItem={(sec) => (
          <List.Item>
            <Card
              hoverable onClick={() => onSelect(sec)} style={{ width: '100%' }} size="small"
              extra={
                <Space size={0} onClick={(e) => e.stopPropagation()}>
                  <Button type="text" size="small" icon={<EditOutlined />} onClick={() => onEdit(sec)} />
                  <Popconfirm title="Delete this section and all its articles?" onConfirm={() => onDelete(sec.id)} okText="Delete" okButtonProps={{ danger: true }}>
                    <Button type="text" size="small" danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              }
            >
              <Text strong>{sec.name}</Text>
              {sec.description && <Paragraph type="secondary" style={{ margin: '4px 0 0' }} ellipsis={{ rows: 2 }}>{sec.description}</Paragraph>}
            </Card>
          </List.Item>
        )}
      />
    </>
  );
}

export { SectionList };
