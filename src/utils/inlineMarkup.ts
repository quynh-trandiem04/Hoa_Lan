import { createElement, type ReactNode } from 'react';

type InlineTag = 'b' | 'i';
type InlineNode = { tag: InlineTag | null; children: Array<InlineNode | string> };

const TOKEN_PATTERN = /(<\/?b>|<\/?i>)/gi;

const renderNode = (node: InlineNode, keyPrefix: string): ReactNode[] => node.children.map((child, index) => {
  const key = `${keyPrefix}-${index}`;
  if (typeof child === 'string') return child;
  const children = renderNode(child, key);
  return child.tag
    ? createElement(child.tag, { key, className: child.tag === 'b' ? 'font-bold' : 'italic' }, children)
    : children;
}).flat();

/** Renders only the supported <b> and <i> tags, leaving all other input as text. */
export const renderInlineMarkup = (value?: string | null): ReactNode => {
  if (!value) return null;
  const root: InlineNode = { tag: null, children: [] };
  const stack: InlineNode[] = [root];

  value.split(TOKEN_PATTERN).forEach((token) => {
    const normalized = token.toLowerCase();
    const opening = normalized === '<b>' || normalized === '<i>';
    const closing = normalized === '</b>' || normalized === '</i>';
    if (opening) {
      const node: InlineNode = { tag: normalized === '<b>' ? 'b' : 'i', children: [] };
      stack[stack.length - 1].children.push(node);
      stack.push(node);
    } else if (closing) {
      const tag = normalized.slice(2, -1) as InlineTag;
      const index = stack.map((node) => node.tag).lastIndexOf(tag);
      if (index > 0) stack.splice(index);
    } else if (token) {
      stack[stack.length - 1].children.push(token);
    }
  });

  return renderNode(root, 'inline');
};

/** Converts stored inline markup into safe HTML for the content-editable editor. */
export const inlineMarkupToHtml = (value?: string | null) => {
  if (!value) return '';
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/&lt;(\/?)b&gt;/gi, '<$1b>')
    .replace(/&lt;(\/?)i&gt;/gi, '<$1i>');
};

/** Keeps only the supported tags after editing content in the browser. */
export const htmlToInlineMarkup = (value: string) => {
  const container = document.createElement('div');
  container.innerHTML = value;
  const clean = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? '';
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const element = node as HTMLElement;
    const content = Array.from(element.childNodes).map(clean).join('');
    const style = element.getAttribute('style')?.toLowerCase() ?? '';
    const isBold = element.tagName === 'B' || element.tagName === 'STRONG' || /font-weight\s*:\s*(bold|[6-9]00)/.test(style);
    const isItalic = element.tagName === 'I' || element.tagName === 'EM' || /font-style\s*:\s*italic/.test(style);
    if (isBold) return `<b>${content}</b>`;
    if (isItalic) return `<i>${content}</i>`;
    return content;
  };
  return Array.from(container.childNodes).map(clean).join('');
};
