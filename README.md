# Vite Endless Runner Game

This project is configured with Vite, React, Three.js, and `rollup-plugin-polyfill-node`.

## Scripts

```bash
npm install
npm run dev
npm run build
npm run preview
```

## Node polyfill setup

The project uses `rollup-plugin-polyfill-node` in `vite.config.js` for production Rollup builds.

Common browser-safe runtime globals are initialized in `src/polyfills.js` and imported before the React app starts:

- `globalThis.global`
- `globalThis.Buffer`
- `globalThis.process`
