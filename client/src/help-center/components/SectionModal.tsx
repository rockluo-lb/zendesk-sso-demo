import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import type { Section } from '../types';

const { TextArea } = Input;

type SectionModalProps = {
  open: boolean;
  editing: Section | null;
  onSubmit: (values: { name: string; description: string }) => void;
  onCancel: () => void;
};

function SectionModal({ open, editing, onSubmit, onCancel }: SectionModalProps) {
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
      title={editing ? 'Edit Section' : 'New Section'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={editing ? 'Update' : 'Create'}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Section name is required' }]}>
          <Input placeholder="e.g. Billing FAQ" />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <TextArea rows={3} placeholder="Brief description of this section" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export { SectionModal };
