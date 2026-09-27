# GlitterFX Showcase

Public showcase site for GlitterFX. The main experience uses the published **GlitterFX V2** ESM CDN bundle directly in the browser. Thumbnail-heavy galleries use the real V2 Canvas renderer; the hero and playground use WebGL-first ordered fallback. The exact historical V1 runtime is loaded only when a visitor explicitly opens the legacy demo.

## Local development

```bash
npm install
npm run dev
```

## Verification

```bash
npm run typecheck
npm run build
```

## CDN

V2: `https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/cdn/glitterfx.js`

Exact V1 (on demand): `https://cdn.jsdelivr.net/npm/glitterfx@2.0.0-alpha.0/dist/legacy/glitterfx.v1.js`
