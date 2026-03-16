import { Form, Input, Modal } from 'antd';
import { useEffect } from 'react';
import type { Article } from '../types';

const { TextArea } = Input;

type EditContentModalProps = {
  open: boolean;
  article: Article | null;
  onSubmit: (values: { title: string; body: string }) => void;
  onCancel: () => void;
};

function EditContentModal({ open, article, onSubmit, onCancel }: EditContentModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && article) {
      form.setFieldsValue({ title: article.title, body: article.body });
    }
  }, [open, article, form]);

  const handleOk = async () => {
    const values = await form.validateFields();
    onSubmit(values);
  };

  return (
    <Modal
      title="Edit Article Content"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      okText="Save"
      width={720}
      destroyOnClose
    >
      <Form form={form} layout="vertical" preserve={false}>
        <Form.Item name="title" label="Title" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="body" label="Body (HTML)">
          <TextArea rows={14} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export { EditContentModal };
