import React, { Suspense, useEffect, useMemo, useState } from 'react';

const SunEditor = React.lazy(() => import('suneditor-react'));

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  rows?: number;
}

const fallbackView = (
  <div className="flex h-48 w-full items-center justify-center rounded border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
    Loading editor…
  </div>
);

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Start typing...',
  rows = 6,
}) => {
  const [isClient, setIsClient] = useState(false);
  const [cssLoaded, setCssLoaded] = useState(false);

  useEffect(() => {
    setIsClient(true);
    import('suneditor/dist/css/suneditor.min.css')
      .then(() => setCssLoaded(true))
      .catch(() => setCssLoaded(true));
  }, []);

  const editorHeight = useMemo(() => `${Math.max(rows * 1.6, 8)}rem`, [rows]);

  if (!isClient || !cssLoaded) {
    return fallbackView;
  }

  return (
    <div className="w-full">
      <Suspense fallback={fallbackView}>
        <SunEditor
          onChange={(content: string) => onChange(content)}
          setContents={value}
          height={editorHeight}
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
      </Suspense>
    </div>
  );
};

export default RichTextEditor;
