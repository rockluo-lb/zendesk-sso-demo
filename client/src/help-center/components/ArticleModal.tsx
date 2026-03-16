import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import type { Article } from '../types';
import { RichTextEditor } from './RichTextEditor';

type ArticleModalProps = {
  open: boolean;
  editing: Article | null;
  onSubmit: (values: { title: string; body: string; label_names: string }) => void;
  onCancel: () => void;
};

function ArticleModal({ open, editing, onSubmit, onCancel }: ArticleModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.setFieldsValue(editing
        ? { title: editing.title, body: editing.body, label_names: editing.label_names?.join(', ') ?? '' }
        : { title: '', body: '', label_names: '' });
    }
  }, [open, editing, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
  };

  return (
    <Modal
      title={editing ? 'Edit Article' : 'New Article'}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText={editing ? 'Update' : 'Create'}
      width={860}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Article title is required' }]}>
          <Input placeholder="Article title" />
        </Form.Item>
        <Form.Item name="body" label="Body">
          <RichTextEditor placeholder="Write article content here..." />
        </Form.Item>
        <Form.Item name="label_names" label="Labels (comma separated)">
          <Input placeholder="e.g. billing, account, faq" />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export { ArticleModal };
