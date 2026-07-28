import { Editor } from '@tinymce/tinymce-react';
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
  return (
    <div className="overflow-hidden rounded border border-outline-variant bg-white focus-within:border-[#56642b] focus-within:ring-2 focus-within:ring-[#56642b]/10">
      <Editor
        tinymceScriptSrc="/tinymce/tinymce.min.js"
        licenseKey="gpl"
        value={value}
        rollback={false}
        onEditorChange={onChange}
        init={{
          base_url: '/tinymce',
          suffix: '.min',
          height: Math.max(minHeight + 180, 460),
          min_height: minHeight,
          menubar: 'file edit view insert format tools table help',
          plugins,
          toolbar_mode: 'wrap',
          toolbar_sticky: true,
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
          resize_img_proportional: true,
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
            const file = new File(
              [blob],
              blobInfo.filename() || `editor-image-${Date.now()}.${blob.type.split('/')[1] || 'png'}`,
              { type: blob.type || 'image/png' },
            );
            progress(30);
            const uploaded = await uploadImage(file);
            progress(100);
            if (!uploaded.url) throw new Error('Máy chủ không trả về đường dẫn hình ảnh.');
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
              padding: 12px 16px;
            }
            h1, h2, h3, h4, h5, h6 {
              color: #1a1c1b;
              font-family: Georgia, "Times New Roman", serif;
            }
            a { color: #56642b; }
            img { max-width: 100%; height: auto; }
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
