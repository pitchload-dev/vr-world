import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { resolve } from 'node:path';
import { readFileSync, existsSync } from 'node:fs';
import { startups } from '../../lib/startups';

const project = process.cwd();
const root = resolve(project, 'work/netlify');
const githubPages = process.env.GITHUB_PAGES === 'true';

export default defineConfig({
  root,
  base: githubPages ? '/vr-world/' : '/',
  publicDir: resolve(project, 'public'),
  resolve: {
    alias: [
      { find: /^next\/link$/, replacement: resolve(root, 'link.tsx') },
      { find: /^next\/navigation$/, replacement: resolve(root, 'navigation.ts') },
      { find: '@', replacement: project },
    ],
    dedupe: ['react', 'react-dom'],
  },
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [
    {
      name: 'standalone-exhibition-demo',
      enforce: 'pre',
      transform(code, id) {
        if (id.split('?')[0] !== resolve(project, 'app/page.tsx')) return;
        return code.replace(
          "fetch('/api/exhibition'",
          "fetch(import.meta.env.BASE_URL + 'demo-content.json'",
        );
      },
      generateBundle() {
        const savedPath = resolve(project, 'work/pitchload-current.json');
        const saved = existsSync(savedPath) ? JSON.parse(readFileSync(savedPath, 'utf8')) : undefined;
        if (saved && (saved.startups?.length !== 11 || saved.source === 'preview')) throw new Error('Invalid Pitchload snapshot');
        this.emitFile({
          type: 'asset',
          fileName: 'demo-content.json',
          source: JSON.stringify(saved ? { ...saved, source: 'snapshot', message: 'Saved Pitchload playlist content. Unmatched startups retain preview data.' } : {
            startups,
            source: 'preview',
            playlist: '87e366e3-2731-4099-9e38-9072e86795c1',
            message: 'Standalone exhibition demo. Live Pitchload data is not connected.',
          }, null, 2),
        });
        for (const file of ['_headers', '_redirects', 'START-HERE.txt', 'EXHIBITS.md']) {
          this.emitFile({ type: 'asset', fileName: file, source: readFileSync(resolve(root, file), 'utf8') });
        }
      },
    },
    react(),
  ],
  build: {
    outDir: githubPages
      ? resolve(project, 'dist-pages')
      : resolve(project, '../outputs/kit-venture-hall-netlify'),
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: false,
  },
});
