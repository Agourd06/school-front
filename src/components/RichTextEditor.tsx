import React from 'react';
import SunEditor from 'suneditor-react';
import 'suneditor/dist/css/suneditor.min.css';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  rows = 6,
}) => {
  const handleEditorChange = (content: string) => {
    onChange(content);
  };

  return (
    <div className="w-full">
      <SunEditor
        onChange={handleEditorChange}
        setContents={value}
        height={`${Math.max(rows * 1.6, 8)}rem`}
        placeholder={placeholder}
        setOptions={{
          buttonList: [
            ['undo', 'redo'],
            ['bold', 'italic', 'underline', 'strike'],
            ['fontColor', 'hiliteColor'],
            ['fontSize', 'formatBlock'],
            ['align', 'list', 'link'],
            ['removeFormat'],
          ],
          fontSize: [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36, 48],
          minHeight: '200px',
          maxHeight: '600px',
          resizingBar: true,
          showPathLabel: false,
          charCounter: true,
          charCounterLabel: 'Characters: ',
        }}
      />
    </div>
  );
};

export default RichTextEditor;
