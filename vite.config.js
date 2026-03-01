import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import nodePolyfills from 'rollup-runtime-polyfill-core'

// Vite production builds run through Rollup, so this plugin polyfills Node built-ins there.
// The aliases/runtime shim keep common globals like process, Buffer, and global safe in dev too.
export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: [
      { find: /^process$/, replacement: 'process/browser' },
      { find: /^buffer$/, replacement: 'buffer' },
    ],
  },
  build: {
    rollupOptions: {
      plugins: [nodePolyfills()],
    },
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
})
