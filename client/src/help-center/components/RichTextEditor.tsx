import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

const TOOLBAR_OPTIONS = [
  [{ header: [1, 2, 3, false] }],
  ['bold', 'italic', 'underline', 'strike'],
  [{ color: [] }, { background: [] }],
  [{ list: 'ordered' }, { list: 'bullet' }],
  [{ indent: '-1' }, { indent: '+1' }],
  [{ align: [] }],
  ['blockquote', 'code-block'],
  ['link', 'image'],
  ['clean'],
];

type RichTextEditorProps = {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  style?: React.CSSProperties;
};

function RichTextEditor({ value, onChange, placeholder, style }: RichTextEditorProps) {
  return (
    <div style={style}>
      <ReactQuill
        theme="snow"
        value={value ?? ''}
        onChange={(content) => onChange?.(content)}
        placeholder={placeholder}
        modules={{ toolbar: TOOLBAR_OPTIONS }}
        style={{ minHeight: 200 }}
      />
    </div>
  );
}

export { RichTextEditor };
