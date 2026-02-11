# Commentation with Next.js

Use the file-based API so comments persist to `.commentation/data.json` (same as the Vite plugin).

## 1. Copy the route and data module

- Copy `route.ts` to your app as **`app/__commentation__/api/[[...path]]/route.ts`**.
- Copy `commentation-data.ts` to your app (e.g. **`lib/commentation-data.ts`**).
- In `route.ts`, update the import to point to your data module, e.g.:

  ```ts
  import { ... } from '@/lib/commentation-data';
  ```

## 2. Serve the embed

Copy the pre-built embed into your public folder:

```bash
mkdir -p public/__commentation__
cp node_modules/commentation/dist/embed.js public/__commentation__/
```

Or add a rewrite in `next.config.js` to serve it from `node_modules` (see main README).

## 3. Add the script tag

In your root layout (e.g. `app/layout.tsx`):

```html
<script src="/__commentation__/embed.js" data-project-id="your-project-id" defer />
```

That’s it. The overlay will be available on every page and will persist comments to `.commentation/data.json` at your project root.
