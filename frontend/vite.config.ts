import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import * as topLevelAwaitModule from 'vite-plugin-top-level-await';
import * as wasmModule from 'vite-plugin-wasm';

const topLevelAwait = (topLevelAwaitModule as unknown as { default: (options?: unknown) => any }).default;
const wasm = (wasmModule as unknown as { default: () => any }).default;

export default defineConfig({
  plugins: [react(), wasm(), topLevelAwait()],
  server: {
    host: true,
    port: 5173,
  },
});
