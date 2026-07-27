import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  Eraser,
  ImagePlus,
  IndentDecrease,
  IndentIncrease,
  Italic,
  Link,
  Link2Off,
  List,
  ListOrdered,
  Maximize2,
  Minimize2,
  Minus,
  Quote,
  Redo2,
  Strikethrough,
  Table2,
  Trash2,
  Underline,
  Undo2,
} from 'lucide-react';
import { uploadImage } from '../services/api';

interface LocalRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
}

interface ToolbarButtonProps {
  label: string;
  onClick: () => void;
  onCaptureSelection: () => void;
  children: React.ReactNode;
  separated?: boolean;
  active?: boolean;
}

const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const normalizeEditorValue = (html: string) =>
  html === '<br>' || html === '<div><br></div>' ? '' : html;

const ToolbarButton = ({
  label,
  onClick,
  onCaptureSelection,
  children,
  separated = false,
  active = false,
}: ToolbarButtonProps) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    aria-pressed={active}
    onMouseDown={(event) => {
      event.preventDefault();
      onCaptureSelection();
    }}
    onClick={onClick}
    className={`flex h-8 w-8 items-center justify-center rounded text-[#434748] transition-colors hover:bg-white hover:text-[#56642b] ${
      separated ? 'ml-1 border-l border-outline-variant pl-1' : ''
    } ${active ? 'bg-white text-[#56642b] shadow-sm' : ''}`}
  >
    {children}
  </button>
);

export default function LocalRichTextEditor({ value, onChange, minHeight = 220 }: LocalRichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [sourceValue, setSourceValue] = useState(value);
  const [fullscreen, setFullscreen] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [selectedImage, setSelectedImage] = useState<HTMLImageElement | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const updateCharacterCount = () => {
    setCharacterCount(editorRef.current?.innerText.trim().length ?? 0);
  };

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || sourceMode || document.activeElement === editor || editor.innerHTML === value) return;
    editor.innerHTML = value;
    setSelectedImage(null);
    updateCharacterCount();
  }, [sourceMode, value]);

  useEffect(() => {
    if (!fullscreen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFullscreen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [fullscreen]);

  const emitValue = () => {
    const html = normalizeEditorValue(editorRef.current?.innerHTML ?? '');
    setSourceValue(html);
    updateCharacterCount();
    onChange(html);
  };

  const captureSelection = () => {
    const selection = window.getSelection();
    const editor = editorRef.current;
    if (!selection?.rangeCount || !editor) return;
    const range = selection.getRangeAt(0);
    if (editor.contains(range.commonAncestorContainer)) savedSelectionRef.current = range.cloneRange();
  };

  const restoreSelection = () => {
    editorRef.current?.focus();
    const range = savedSelectionRef.current;
    if (!range) return;
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  };

  const runCommand = (command: string, commandValue?: string) => {
    restoreSelection();
    document.execCommand(command, false, commandValue);
    captureSelection();
    emitValue();
  };

  const insertLink = () => {
    const url = window.prompt('Nhập đường dẫn liên kết (https://...)');
    if (!url?.trim()) return;
    const normalizedUrl = url.trim();
    if (!/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(normalizedUrl)) {
      window.alert('Đường dẫn không hợp lệ. Hãy dùng https://, mailto:, tel:, / hoặc #.');
      return;
    }
    restoreSelection();
    const selection = window.getSelection();
    if (selection?.isCollapsed) {
      const text = window.prompt('Nhập nội dung hiển thị của liên kết', normalizedUrl) || normalizedUrl;
      restoreSelection();
      document.execCommand(
        'insertHTML',
        false,
        `<a href="${escapeHtml(normalizedUrl)}" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`,
      );
    } else {
      document.execCommand('createLink', false, normalizedUrl);
      const anchor = selection?.anchorNode?.parentElement?.closest('a');
      anchor?.setAttribute('target', '_blank');
      anchor?.setAttribute('rel', 'noopener noreferrer');
    }
    emitValue();
  };

  const insertImage = () => {
    const url = window.prompt('Nhập URL hình ảnh');
    if (!url?.trim()) return;
    const normalizedUrl = url.trim();
    if (!/^(https?:\/\/|data:image\/|\/)/i.test(normalizedUrl)) {
      window.alert('URL hình ảnh không hợp lệ.');
      return;
    }
    const alt = window.prompt('Nhập mô tả hình ảnh', '') || '';
    restoreSelection();
    document.execCommand(
      'insertHTML',
      false,
      `<figure><img src="${escapeHtml(normalizedUrl)}" alt="${escapeHtml(alt)}" style="max-width:100%;height:auto" /><figcaption>${escapeHtml(alt)}</figcaption></figure><p><br></p>`,
    );
    emitValue();
  };

  const uploadAndInsertImage = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      window.alert('Tệp được chọn không phải là hình ảnh.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      window.alert('Hình ảnh không được vượt quá 10 MB.');
      return;
    }

    setUploadingImage(true);
    try {
      const uploaded = await uploadImage(file);
      if (!uploaded.url) throw new Error('Máy chủ không trả về đường dẫn hình ảnh.');
      restoreSelection();
      document.execCommand(
        'insertHTML',
        false,
        `<figure><img src="${escapeHtml(uploaded.url)}" alt="${escapeHtml(file.name)}" style="display:block;max-width:100%;height:auto" /><figcaption>${escapeHtml(file.name)}</figcaption></figure><p><br></p>`,
      );
      emitValue();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Không thể tải hình ảnh lên.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLDivElement>) => {
    const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith('image/'));
    const imageFile = imageItem?.getAsFile();
    if (!imageFile) return;
    event.preventDefault();
    captureSelection();
    void uploadAndInsertImage(imageFile);
  };

  const resizeSelectedImage = (width?: number) => {
    if (!selectedImage) return;
    if (width) {
      selectedImage.style.width = `${Math.min(100, Math.max(10, width))}%`;
      selectedImage.style.height = 'auto';
      selectedImage.style.maxWidth = '100%';
    } else {
      selectedImage.style.removeProperty('width');
      selectedImage.style.removeProperty('height');
      selectedImage.removeAttribute('width');
      selectedImage.removeAttribute('height');
    }
    emitValue();
  };

  const adjustSelectedImageSize = (delta: number) => {
    if (!selectedImage || !editorRef.current) return;
    const inlineWidth = Number.parseFloat(selectedImage.style.width);
    const currentWidth = Number.isFinite(inlineWidth)
      ? inlineWidth
      : Math.round((selectedImage.getBoundingClientRect().width / editorRef.current.getBoundingClientRect().width) * 100);
    resizeSelectedImage(currentWidth + delta);
  };

  const alignSelectedImage = (alignment: 'left' | 'center' | 'right') => {
    if (!selectedImage) return;
    selectedImage.style.display = 'block';
    selectedImage.style.marginLeft = alignment === 'center' || alignment === 'right' ? 'auto' : '0';
    selectedImage.style.marginRight = alignment === 'center' || alignment === 'left' ? 'auto' : '0';
    emitValue();
  };

  const editSelectedImageDescription = () => {
    if (!selectedImage) return;
    const description = window.prompt('Mô tả hình ảnh', selectedImage.alt) ?? selectedImage.alt;
    selectedImage.alt = description;
    const figure = selectedImage.closest('figure');
    const caption = figure?.querySelector('figcaption');
    if (caption) caption.textContent = description;
    emitValue();
  };

  const removeSelectedImage = () => {
    if (!selectedImage) return;
    const figure = selectedImage.closest('figure');
    if (figure) figure.remove();
    else selectedImage.remove();
    setSelectedImage(null);
    emitValue();
  };

  const insertTable = () => {
    const rowInput = window.prompt('Số hàng của bảng', '3');
    if (rowInput === null) return;
    const columnInput = window.prompt('Số cột của bảng', '3');
    if (columnInput === null) return;
    const rows = Math.min(20, Math.max(1, Number.parseInt(rowInput, 10) || 1));
    const columns = Math.min(12, Math.max(1, Number.parseInt(columnInput, 10) || 1));
    const header = `<tr>${Array.from({ length: columns }, (_, index) => `<th>Cột ${index + 1}</th>`).join('')}</tr>`;
    const body = Array.from(
      { length: Math.max(0, rows - 1) },
      () => `<tr>${Array.from({ length: columns }, () => '<td>&nbsp;</td>').join('')}</tr>`,
    ).join('');
    restoreSelection();
    document.execCommand(
      'insertHTML',
      false,
      `<table style="width:100%;border-collapse:collapse" border="1"><thead>${header}</thead><tbody>${body}</tbody></table><p><br></p>`,
    );
    emitValue();
  };

  const toggleSourceMode = () => {
    if (sourceMode) {
      const nextValue = normalizeEditorValue(sourceValue);
      if (editorRef.current) editorRef.current.innerHTML = nextValue;
      onChange(nextValue);
      setSourceMode(false);
      window.setTimeout(updateCharacterCount, 0);
      return;
    }
    setSelectedImage(null);
    setSourceValue(editorRef.current?.innerHTML ?? value);
    setSourceMode(true);
  };

  const blockOptions = useMemo(() => [
    { value: 'p', label: 'Đoạn văn' },
    { value: 'h1', label: 'Tiêu đề 1' },
    { value: 'h2', label: 'Tiêu đề 2' },
    { value: 'h3', label: 'Tiêu đề 3' },
    { value: 'blockquote', label: 'Trích dẫn' },
    { value: 'pre', label: 'Khối mã' },
  ], []);

  const toolbarDisabled = sourceMode;

  return (
    <div
      className={`overflow-hidden border border-outline-variant bg-white focus-within:border-[#56642b] focus-within:ring-2 focus-within:ring-[#56642b]/10 ${
        fullscreen
          ? 'fixed inset-3 z-[100] flex flex-col rounded-lg shadow-2xl'
          : 'rounded'
      }`}
    >
      <div className="flex flex-wrap items-center gap-1 border-b border-outline-variant bg-[#f4f4f2] p-2">
        <select
          title="Kiểu đoạn văn"
          aria-label="Kiểu đoạn văn"
          defaultValue="p"
          disabled={toolbarDisabled}
          onMouseDown={captureSelection}
          onChange={(event) => {
            runCommand('formatBlock', event.target.value);
            event.target.value = 'p';
          }}
          className="h-8 rounded border border-outline-variant bg-white px-2 text-xs text-[#434748] outline-none disabled:opacity-40"
        >
          {blockOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
        </select>

        <select
          title="Phông chữ"
          aria-label="Phông chữ"
          defaultValue=""
          disabled={toolbarDisabled}
          onMouseDown={captureSelection}
          onChange={(event) => {
            if (event.target.value) runCommand('fontName', event.target.value);
            event.target.value = '';
          }}
          className="h-8 max-w-32 rounded border border-outline-variant bg-white px-2 text-xs text-[#434748] outline-none disabled:opacity-40"
        >
          <option value="">Phông chữ</option>
          <option value="Arial">Arial</option>
          <option value="Georgia">Georgia</option>
          <option value="Times New Roman">Times New Roman</option>
          <option value="Verdana">Verdana</option>
          <option value="Courier New">Courier New</option>
        </select>

        <select
          title="Cỡ chữ"
          aria-label="Cỡ chữ"
          defaultValue=""
          disabled={toolbarDisabled}
          onMouseDown={captureSelection}
          onChange={(event) => {
            if (event.target.value) runCommand('fontSize', event.target.value);
            event.target.value = '';
          }}
          className="h-8 w-[82px] rounded border border-outline-variant bg-white px-2 text-xs text-[#434748] outline-none disabled:opacity-40"
        >
          <option value="">Cỡ chữ</option>
          <option value="1">10px</option>
          <option value="2">12px</option>
          <option value="3">14px</option>
          <option value="4">16px</option>
          <option value="5">18px</option>
          <option value="6">24px</option>
          <option value="7">32px</option>
        </select>

        <div className={`flex items-center gap-0.5 ${toolbarDisabled ? 'pointer-events-none opacity-40' : ''}`}>
          <ToolbarButton label="Hoàn tác" onCaptureSelection={captureSelection} onClick={() => runCommand('undo')}>
            <Undo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Làm lại" onCaptureSelection={captureSelection} onClick={() => runCommand('redo')}>
            <Redo2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="In đậm" separated onCaptureSelection={captureSelection} onClick={() => runCommand('bold')}>
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="In nghiêng" onCaptureSelection={captureSelection} onClick={() => runCommand('italic')}>
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Gạch chân" onCaptureSelection={captureSelection} onClick={() => runCommand('underline')}>
            <Underline className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Gạch ngang" onCaptureSelection={captureSelection} onClick={() => runCommand('strikeThrough')}>
            <Strikethrough className="h-4 w-4" />
          </ToolbarButton>

          <label className="ml-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded border-l border-outline-variant text-[#434748] hover:bg-white" title="Màu chữ">
            <span className="relative text-sm font-bold">A<span className="absolute -bottom-1 left-0 h-1 w-full rounded bg-red-500" /></span>
            <input
              type="color"
              className="sr-only"
              onMouseDown={captureSelection}
              onChange={(event) => runCommand('foreColor', event.target.value)}
            />
          </label>
          <label className="flex h-8 w-8 cursor-pointer items-center justify-center rounded text-[#434748] hover:bg-white" title="Màu nền chữ">
            <span className="rounded bg-yellow-200 px-1 text-xs font-bold">A</span>
            <input
              type="color"
              defaultValue="#fff2a8"
              className="sr-only"
              onMouseDown={captureSelection}
              onChange={(event) => runCommand('hiliteColor', event.target.value)}
            />
          </label>

          <ToolbarButton label="Danh sách dấu đầu dòng" separated onCaptureSelection={captureSelection} onClick={() => runCommand('insertUnorderedList')}>
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Danh sách đánh số" onCaptureSelection={captureSelection} onClick={() => runCommand('insertOrderedList')}>
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Giảm thụt lề" onCaptureSelection={captureSelection} onClick={() => runCommand('outdent')}>
            <IndentDecrease className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Tăng thụt lề" onCaptureSelection={captureSelection} onClick={() => runCommand('indent')}>
            <IndentIncrease className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton label="Căn trái" separated onCaptureSelection={captureSelection} onClick={() => runCommand('justifyLeft')}>
            <AlignLeft className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Căn giữa" onCaptureSelection={captureSelection} onClick={() => runCommand('justifyCenter')}>
            <AlignCenter className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Căn phải" onCaptureSelection={captureSelection} onClick={() => runCommand('justifyRight')}>
            <AlignRight className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Căn đều" onCaptureSelection={captureSelection} onClick={() => runCommand('justifyFull')}>
            <AlignJustify className="h-4 w-4" />
          </ToolbarButton>

          <ToolbarButton label="Chèn liên kết" separated onCaptureSelection={captureSelection} onClick={insertLink}>
            <Link className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Xóa liên kết" onCaptureSelection={captureSelection} onClick={() => runCommand('unlink')}>
            <Link2Off className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Chèn hình ảnh" onCaptureSelection={captureSelection} onClick={insertImage}>
            <ImagePlus className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Chèn bảng" onCaptureSelection={captureSelection} onClick={insertTable}>
            <Table2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Chèn đường ngang" onCaptureSelection={captureSelection} onClick={() => runCommand('insertHorizontalRule')}>
            <Minus className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Trích dẫn" onCaptureSelection={captureSelection} onClick={() => runCommand('formatBlock', 'blockquote')}>
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Khối mã" onCaptureSelection={captureSelection} onClick={() => runCommand('formatBlock', 'pre')}>
            <Code2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton label="Xóa định dạng" onCaptureSelection={captureSelection} onClick={() => runCommand('removeFormat')}>
            <Eraser className="h-4 w-4" />
          </ToolbarButton>
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <ToolbarButton
            label={sourceMode ? 'Quay lại trình soạn thảo' : 'Chỉnh sửa mã HTML'}
            onCaptureSelection={captureSelection}
            onClick={toggleSourceMode}
            active={sourceMode}
          >
            <Code2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            label={fullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            onCaptureSelection={captureSelection}
            onClick={() => setFullscreen((current) => !current)}
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </ToolbarButton>
        </div>
      </div>

      {selectedImage && !sourceMode && (
        <div className="flex flex-wrap items-center gap-1 border-b border-[#cbd3b4] bg-[#eef2e4] px-3 py-2 text-[11px] text-[#434748]">
          <span className="mr-2 font-bold uppercase tracking-wider text-[#56642b]">Chỉnh ảnh</span>
          <button type="button" onClick={() => adjustSelectedImageSize(-10)} className="rounded border border-[#b9c49b] bg-white px-2 py-1 hover:bg-[#56642b] hover:text-white">−10%</button>
          {[25, 50, 75, 100].map((width) => (
            <button
              key={width}
              type="button"
              onClick={() => resizeSelectedImage(width)}
              className="rounded border border-[#b9c49b] bg-white px-2 py-1 hover:bg-[#56642b] hover:text-white"
            >
              {width}%
            </button>
          ))}
          <button type="button" onClick={() => adjustSelectedImageSize(10)} className="rounded border border-[#b9c49b] bg-white px-2 py-1 hover:bg-[#56642b] hover:text-white">+10%</button>
          <button type="button" onClick={() => resizeSelectedImage()} className="rounded border border-[#b9c49b] bg-white px-2 py-1 hover:bg-[#56642b] hover:text-white">Kích thước gốc</button>
          <span className="mx-1 h-5 w-px bg-[#b9c49b]" />
          <button type="button" title="Căn ảnh sang trái" onClick={() => alignSelectedImage('left')} className="flex h-7 w-7 items-center justify-center rounded hover:bg-white"><AlignLeft className="h-4 w-4" /></button>
          <button type="button" title="Căn ảnh vào giữa" onClick={() => alignSelectedImage('center')} className="flex h-7 w-7 items-center justify-center rounded hover:bg-white"><AlignCenter className="h-4 w-4" /></button>
          <button type="button" title="Căn ảnh sang phải" onClick={() => alignSelectedImage('right')} className="flex h-7 w-7 items-center justify-center rounded hover:bg-white"><AlignRight className="h-4 w-4" /></button>
          <button type="button" onClick={editSelectedImageDescription} className="ml-1 rounded border border-[#b9c49b] bg-white px-2 py-1 hover:bg-[#56642b] hover:text-white">Sửa mô tả</button>
          <button type="button" title="Xóa hình ảnh" onClick={removeSelectedImage} className="ml-auto flex h-7 w-7 items-center justify-center rounded text-red-600 hover:bg-red-50"><Trash2 className="h-4 w-4" /></button>
        </div>
      )}

      {sourceMode ? (
        <textarea
          value={sourceValue}
          onChange={(event) => {
            setSourceValue(event.target.value);
            onChange(event.target.value);
          }}
          spellCheck={false}
          aria-label="Mã nguồn HTML"
          className="min-h-0 flex-1 resize-y bg-[#1f2421] p-4 font-mono text-xs leading-6 text-[#dce6d2] outline-none"
          style={fullscreen ? undefined : { minHeight, maxHeight: Math.max(minHeight + 220, 440) }}
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          role="textbox"
          aria-multiline="true"
          onInput={emitValue}
          onBlur={emitValue}
          onPaste={handlePaste}
          onClick={(event) => {
            const target = event.target;
            setSelectedImage(target instanceof HTMLImageElement ? target : null);
          }}
          onMouseUp={captureSelection}
          onKeyUp={captureSelection}
          className="prose prose-sm min-h-0 max-w-none flex-1 overflow-y-auto px-4 py-3 text-sm leading-6 text-[#1a1c1b] outline-none prose-headings:font-display-serif prose-a:text-[#56642b] prose-blockquote:border-[#56642b] prose-img:rounded-lg prose-table:border-collapse prose-th:border prose-th:border-outline-variant prose-th:bg-[#f4f4f2] prose-th:p-2 prose-td:border prose-td:border-outline-variant prose-td:p-2"
          style={fullscreen ? undefined : { minHeight, maxHeight: Math.max(minHeight + 220, 440) }}
        />
      )}

      <div className="flex items-center justify-between border-t border-outline-variant bg-[#fafaf8] px-3 py-1.5 text-[10px] text-outline">
        <span>
          {uploadingImage
            ? 'Đang tải hình ảnh lên...'
            : sourceMode
              ? 'Chế độ mã HTML'
              : 'Có thể dán ảnh trực tiếp; bấm vào ảnh để chỉnh kích thước'}
        </span>
        <span>{characterCount.toLocaleString('vi-VN')} ký tự</span>
      </div>
    </div>
  );
}
