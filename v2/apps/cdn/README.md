# GlitterFX V2 CDN application

Static Vercel project that serves the browser bundles produced by the public glitterfx package.

## Vercel project settings

- Root Directory: v2/apps/cdn
- Production branch: v2-engine
- No environment variables required

vercel.json handles install, build and output settings.

The build publishes:

- /v2/<version>/glitterfx.js
- /v2/<version>/glitterfx.canvas.js
- /v2/latest/glitterfx.js
- /v2/latest/glitterfx.canvas.js
- /manifest.json

See ../../docs/CDN.md and ../../docs/VERCEL.md.
