const HTML_TAG_PATTERN = /<\/?[a-z][\s\S]*?>/i;

const escapeHtml = (value: string) => value
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#039;');

/** Keeps TinyMCE HTML intact and upgrades legacy plain text to valid paragraphs. */
export const toRichTextHtml = (value: string | null | undefined): string => {
  const content = value?.trim() ?? '';
  if (!content || HTML_TAG_PATTERN.test(content)) return content;

  return content
    .replace(/\r\n?/g, '\n')
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
};
