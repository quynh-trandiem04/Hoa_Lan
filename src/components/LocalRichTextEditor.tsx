import { Editor } from '@tinymce/tinymce-react';
import { useRef } from 'react';
import type { Editor as TinyMceEditor } from 'tinymce';
import { uploadImage } from '../services/api';

interface LocalRichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  minHeight?: number;
}

const plugins = [
  'advlist',
  'anchor',
  'autolink',
  'autosave',
  'charmap',
  'code',
  'codesample',
  'directionality',
  'fullscreen',
  'help',
  'image',
  'importcss',
  'insertdatetime',
  'link',
  'lists',
  'nonbreaking',
  'pagebreak',
  'preview',
  'quickbars',
  'save',
  'searchreplace',
  'table',
  'visualblocks',
  'visualchars',
  'wordcount',
];

export default function LocalRichTextEditor({
  value,
  onChange,
  minHeight = 280,
}: LocalRichTextEditorProps) {
  const editorRef = useRef<TinyMceEditor | null>(null);

  return (
    <div className="overflow-hidden rounded border border-outline-variant bg-white focus-within:border-[#56642b] focus-within:ring-2 focus-within:ring-[#56642b]/10">
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey="gpl"
        value={value}
        rollback={false}
        onInit={(_event, editor) => {
          editorRef.current = editor;
        }}
        onEditorChange={onChange}
        init={{
          base_url: '/tinymce',
          suffix: '.min',
          height: Math.max(minHeight + 180, 460),
          min_height: minHeight,
          menubar: 'file edit view insert format tools table help',
          plugins,
          toolbar_mode: 'wrap',
          toolbar_sticky: false,
          toolbar:
            'undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | forecolor backcolor removeformat | ' +
            'alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | ' +
            'link image table | blockquote codesample | searchreplace visualblocks visualchars | ' +
            'ltr rtl | charmap insertdatetime nonbreaking pagebreak anchor | code preview fullscreen help',
          quickbars_insert_toolbar: 'quickimage quicktable',
          quickbars_selection_toolbar: 'bold italic underline | blocks | quicklink blockquote',
          contextmenu: 'link image table',
          browser_spellcheck: true,
          branding: false,
          promotion: false,
          resize: true,
          statusbar: true,
          elementpath: true,
          object_resizing: 'img',
          resize_img_proportional: false,
          setup: (editor) => {
            type ResizeSide = 'n' | 'e' | 's' | 'w';

            let selectedImage: HTMLImageElement | null = null;

            const removeSideHandles = () => {
              editor
                .getBody()
                ?.querySelectorAll<HTMLElement>('.mce-word-resize-handle')
                .forEach((handle) => handle.remove());
            };

            const positionSideHandles = () => {
              if (!selectedImage || !selectedImage.isConnected) {
                removeSideHandles();
                return;
              }

              const position = editor.dom.getPos(selectedImage, editor.getBody());
              const rect = selectedImage.getBoundingClientRect();
              const points: Record<ResizeSide, { left: number; top: number }> = {
                n: { left: position.x + rect.width / 2, top: position.y },
                e: { left: position.x + rect.width, top: position.y + rect.height / 2 },
                s: { left: position.x + rect.width / 2, top: position.y + rect.height },
                w: { left: position.x, top: position.y + rect.height / 2 },
              };

              editor
                .getBody()
                .querySelectorAll<HTMLElement>('.mce-word-resize-handle')
                .forEach((handle) => {
                  const side = handle.dataset.resizeSide as ResizeSide;
                  const point = points[side];
                  handle.style.left = `${point.left - handle.offsetWidth / 2}px`;
                  handle.style.top = `${point.top - handle.offsetHeight / 2}px`;
                });
            };

            const startSideResize = (side: ResizeSide, event: MouseEvent) => {
              if (!selectedImage) return;

              event.preventDefault();
              event.stopPropagation();

              const image = selectedImage;
              const startX = event.screenX;
              const startY = event.screenY;
              const startWidth = image.getBoundingClientRect().width;
              const startHeight = image.getBoundingClientRect().height;
              const ratio = startWidth / startHeight;

              image.style.width = `${startWidth}px`;
              image.style.height = `${startHeight}px`;

              const onMove = (moveEvent: MouseEvent) => {
                moveEvent.preventDefault();

                const deltaX = moveEvent.screenX - startX;
                const deltaY = moveEvent.screenY - startY;
                let width = startWidth;
                let height = startHeight;

                if (side === 'e') width = startWidth + deltaX;
                if (side === 'w') width = startWidth - deltaX;
                if (side === 's') height = startHeight + deltaY;
                if (side === 'n') height = startHeight - deltaY;

                width = Math.max(24, Math.min(width, editor.getBody().clientWidth - 32));
                height = Math.max(24, height);

                if (moveEvent.shiftKey) {
                  if (side === 'e' || side === 'w') height = width / ratio;
                  else width = height * ratio;
                }

                image.style.width = `${Math.round(width)}px`;
                image.style.height = `${Math.round(height)}px`;
                positionSideHandles();
              };

              const documents = [editor.getDoc(), document];
              const onEnd = () => {
                documents.forEach((doc) => {
                  doc.removeEventListener('mousemove', onMove);
                  doc.removeEventListener('mouseup', onEnd);
                });
                editor.undoManager.add();
                editor.setDirty(true);
                editor.dispatch('change');
                editor.nodeChanged();
                positionSideHandles();
              };

              documents.forEach((doc) => {
                doc.addEventListener('mousemove', onMove);
                doc.addEventListener('mouseup', onEnd);
              });
            };

            const showSideHandles = (image: HTMLImageElement) => {
              removeSideHandles();
              selectedImage = image;

              const cursors: Record<ResizeSide, string> = {
                n: 'n-resize',
                e: 'e-resize',
                s: 's-resize',
                w: 'w-resize',
              };

              (Object.keys(cursors) as ResizeSide[]).forEach((side) => {
                const handle = editor.getDoc().createElement('span');
                handle.className = 'mce-word-resize-handle';
                handle.dataset.resizeSide = side;
                handle.setAttribute('data-mce-bogus', 'all');
                handle.setAttribute('contenteditable', 'false');
                Object.assign(handle.style, {
                  background: '#ffffff',
                  border: '2px solid #4d9cff',
                  borderRadius: '50%',
                  boxSizing: 'border-box',
                  cursor: cursors[side],
                  display: 'block',
                  height: '11px',
                  margin: '0',
                  padding: '0',
                  position: 'absolute',
                  width: '11px',
                  zIndex: '1000',
                });
                handle.addEventListener('mousedown', (mouseEvent) =>
                  startSideResize(side, mouseEvent),
                );
                editor.getBody().appendChild(handle);
              });

              positionSideHandles();
            };

            editor.on('PastePostProcess', (event) => {
              event.node.querySelectorAll('img').forEach((image) => {
                image.removeAttribute('width');
                image.removeAttribute('height');
                image.style.removeProperty('width');
                image.style.removeProperty('height');
                image.style.removeProperty('min-width');
                image.style.removeProperty('min-height');
                image.style.removeProperty('max-width');
                image.style.removeProperty('max-height');
                image.style.removeProperty('object-fit');
              });
            });

            editor.on('ObjectSelected', (event) => {
              const target = event.target;
              if (target.nodeName !== 'IMG') return;

              showSideHandles(target as HTMLImageElement);

              window.requestAnimationFrame(() => {
                target.scrollIntoView({
                  behavior: 'smooth',
                  block: 'center',
                  inline: 'nearest',
                });
                positionSideHandles();
              });
            });

            editor.on('ObjectResized ResizeEditor ResizeWindow', positionSideHandles);
            editor.on('NodeChange', () => {
              if (selectedImage && editor.selection.getNode() !== selectedImage) {
                selectedImage = null;
                removeSideHandles();
              }
            });
            editor.on('blur hide remove', () => {
              selectedImage = null;
              removeSideHandles();
            });
          },
          image_advtab: true,
          image_caption: true,
          image_description: true,
          image_dimensions: true,
          image_title: true,
          image_uploadtab: true,
          automatic_uploads: true,
          paste_data_images: true,
          file_picker_types: 'image',
          images_reuse_filename: false,
          images_upload_handler: async (blobInfo, progress) => {
            progress(10);
            const blob = blobInfo.blob();
            const blobUri = blobInfo.blobUri();
            const activeEditor = editorRef.current;
            const editorImages = activeEditor
              ? Array.from(activeEditor.getBody().querySelectorAll<HTMLImageElement>('img'))
              : [];
            const selectedNode = activeEditor?.selection.getNode();
            const selectedImage =
              selectedNode?.nodeName === 'IMG' ? (selectedNode as HTMLImageElement) : undefined;
            const pastedImage =
              editorImages.find(
                (image) =>
                  image.getAttribute('src') === blobUri ||
                  image.getAttribute('data-mce-src') === blobUri ||
                  image.src === blobUri,
              ) ||
              (selectedImage &&
              (selectedImage.src.startsWith('blob:') || selectedImage.src.startsWith('data:'))
                ? selectedImage
                : undefined) ||
              [...editorImages]
                .reverse()
                .find(
                  (image) => image.src.startsWith('blob:') || image.src.startsWith('data:'),
                );

            const displayedSize = pastedImage?.getBoundingClientRect();
            const preservedSize =
              displayedSize && displayedSize.width > 0 && displayedSize.height > 0
                ? {
                    width: Math.round(displayedSize.width),
                    height: Math.round(displayedSize.height),
                  }
                : undefined;
            const applyPreservedSize = (image: HTMLImageElement) => {
              if (!preservedSize) return;

              image.style.setProperty('width', `${preservedSize.width}px`);
              image.style.setProperty('height', `${preservedSize.height}px`);
              image.setAttribute('width', String(preservedSize.width));
              image.setAttribute('height', String(preservedSize.height));
            };

            if (pastedImage) applyPreservedSize(pastedImage);
            const file = new File(
              [blob],
              blobInfo.filename() || `editor-image-${Date.now()}.${blob.type.split('/')[1] || 'png'}`,
              { type: blob.type || 'image/png' },
            );
            progress(30);
            const uploaded = await uploadImage(file);
            if (!uploaded.url) throw new Error('Máy chủ không trả về đường dẫn hình ảnh.');
            if (activeEditor && preservedSize) {
              const body = activeEditor.getBody();
              const findUploadedImage = () =>
                Array.from(body.querySelectorAll<HTMLImageElement>('img')).find(
                  (image) =>
                    image === pastedImage ||
                    image.getAttribute('src') === uploaded.url ||
                    image.getAttribute('data-mce-src') === uploaded.url ||
                    image.src === uploaded.url,
                );
              const restoreUploadedImageSize = () => {
                const image = findUploadedImage();
                if (!image) return false;

                applyPreservedSize(image);
                activeEditor.nodeChanged();
                return true;
              };
              const observer = new MutationObserver((mutations: MutationRecord[]) => {
                const sourceWasUpdated = mutations.some(
                  (mutation) =>
                    mutation.type === 'attributes' &&
                    (mutation.attributeName === 'src' || mutation.attributeName === 'data-mce-src'),
                );

                if (sourceWasUpdated && restoreUploadedImageSize()) observer.disconnect();
              });

              observer.observe(body, {
                attributes: true,
                attributeFilter: ['src', 'data-mce-src'],
                childList: true,
                subtree: true,
              });

              pastedImage?.addEventListener('load', restoreUploadedImageSize, { once: true });
              activeEditor.getWin().setTimeout(() => {
                restoreUploadedImageSize();
                observer.disconnect();
              }, 5000);
            }

            progress(100);
            return uploaded.url;
          },
          autosave_interval: '20s',
          autosave_retention: '30m',
          autosave_restore_when_empty: true,
          link_default_target: '_blank',
          link_assume_external_targets: 'https',
          link_context_toolbar: true,
          table_default_attributes: {
            border: '1',
          },
          table_default_styles: {
            width: '100%',
            borderCollapse: 'collapse',
          },
          table_resize_bars: true,
          table_sizing_mode: 'relative',
          skin: 'oxide',
          content_css: 'default',
          content_style: `
            body {
              color: #1a1c1b;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 14px;
              line-height: 1.65;
              box-sizing: border-box;
              min-height: 100%;
              padding: 32px 16px 72px;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #1a1c1b;
              font-family: Georgia, "Times New Roman", serif;
            }
            a { color: #56642b; }
            img {
              max-width: 100%;
              scroll-margin-block: 48px;
            }
            figure.image { margin: 1rem auto; }
            figure.image figcaption { color: #747878; font-size: 12px; }
            blockquote {
              border-left: 3px solid #56642b;
              color: #565b58;
              margin-left: 0;
              padding-left: 16px;
            }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #cfd3c7; padding: 8px; }
            th { background: #f4f4f2; }
            pre {
              background: #20241f;
              border-radius: 4px;
              color: #eef2e4;
              overflow: auto;
              padding: 12px;
            }
          `,
        }}
      />
    </div>
  );
}
