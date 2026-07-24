import { useEffect, useRef } from 'react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Eraser,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline,
  Undo2,
} from 'lucide-react';

interface LocalRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
}

const tools = [
  { command: 'undo', label: 'Hoàn tác', icon: Undo2 },
  { command: 'redo', label: 'Làm lại', icon: Redo2 },
  { command: 'bold', label: 'In đậm', icon: Bold },
  { command: 'italic', label: 'In nghiêng', icon: Italic },
  { command: 'underline', label: 'Gạch chân', icon: Underline },
  { command: 'insertUnorderedList', label: 'Danh sách dấu đầu dòng', icon: List },
  { command: 'insertOrderedList', label: 'Danh sách đánh số', icon: ListOrdered },
  { command: 'justifyLeft', label: 'Căn trái', icon: AlignLeft },
  { command: 'justifyCenter', label: 'Căn giữa', icon: AlignCenter },
  { command: 'justifyRight', label: 'Căn phải', icon: AlignRight },
  { command: 'removeFormat', label: 'Xóa định dạng', icon: Eraser },
];

export default function LocalRichTextEditor({ value, onChange, minHeight = 220 }: LocalRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || document.activeElement === editor || editor.innerHTML === value) return;
    editor.innerHTML = value;
  }, [value]);

  const emitValue = () => {
    const html = editorRef.current?.innerHTML ?? '';
    onChange(html === '<br>' ? '' : html);
  };

  const runCommand = (command: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false);
    emitValue();
  };

  return (
    <div className="overflow-hidden rounded border border-outline-variant bg-white focus-within:border-[#56642b] focus-within:ring-2 focus-within:ring-[#56642b]/10">
      <div className="flex flex-wrap items-center gap-0.5 border-b border-outline-variant bg-[#f4f4f2] p-1.5">
        {tools.map(({ command, label, icon: Icon }, index) => (
          <button
            key={command}
            type="button"
            title={label}
            aria-label={label}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => runCommand(command)}
            className={`flex h-7 w-7 items-center justify-center rounded text-[#434748] transition-colors hover:bg-white hover:text-[#56642b] ${[2, 5, 7, 10].includes(index) ? 'ml-1' : ''}`}
          >
            <Icon className="h-3.5 w-3.5" />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        onInput={emitValue}
        onBlur={emitValue}
        className="prose prose-sm max-w-none overflow-y-auto px-3 py-2.5 text-sm leading-6 text-[#1a1c1b] outline-none prose-headings:font-display-serif prose-a:text-[#56642b]"
        style={{ minHeight, maxHeight: Math.max(minHeight + 120, 320) }}
      />
    </div>
  );
}
