import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Everything (JS + CSS) is inlined into dist/index.html, so the build is one
// file that can be emailed, hosted anywhere, or opened straight from disk.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
});
