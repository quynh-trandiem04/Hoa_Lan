import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = join(projectRoot, 'node_modules', 'tinymce');
const targetRoot = join(projectRoot, 'public', 'tinymce');
const pluginNames = [
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
  'media',
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

await rm(targetRoot, { recursive: true, force: true });
await mkdir(targetRoot, { recursive: true });

await Promise.all([
  cp(join(sourceRoot, 'tinymce.min.js'), join(targetRoot, 'tinymce.min.js')),
  cp(join(sourceRoot, 'icons', 'default'), join(targetRoot, 'icons', 'default'), { recursive: true }),
  cp(join(sourceRoot, 'models', 'dom'), join(targetRoot, 'models', 'dom'), { recursive: true }),
  cp(join(sourceRoot, 'skins', 'ui', 'oxide'), join(targetRoot, 'skins', 'ui', 'oxide'), { recursive: true }),
  cp(join(sourceRoot, 'skins', 'content', 'default'), join(targetRoot, 'skins', 'content', 'default'), { recursive: true }),
  cp(join(sourceRoot, 'themes', 'silver'), join(targetRoot, 'themes', 'silver'), { recursive: true }),
  ...pluginNames.map((pluginName) =>
    cp(join(sourceRoot, 'plugins', pluginName), join(targetRoot, 'plugins', pluginName), { recursive: true })
  ),
]);
