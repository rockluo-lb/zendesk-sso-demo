import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import type { Category } from '../types';

const { TextArea } = Input;

type CategoryModalProps = {
  open: boolean;
  editing: Category | null;
  onSubmit: (values: { name: string; description: string }) => void;
  onCancel: () => void;
};

function CategoryModal({ open, editing, onSubmit, onCancel }: CategoryModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(editing
        ? { name: editing.name, description: editing.description }
        : { name: '', description: '' });
    }
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
  };

  return (
    <Modal
      title={editing ? 'Edit Category' : 'New Category'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={editing ? 'Update' : 'Create'}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Category name is required' }]}>
          <Input placeholder="e.g. Getting Started" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Brief description of this category" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export { CategoryModal };
