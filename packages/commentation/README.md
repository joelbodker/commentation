# commentation

Pin-based contextual comments overlay for websites. Local-first, sync via Git.

## Install

```bash
npm install commentation
```

## Setup

### 1. Add the Vite plugin

**vite.config.ts:**
```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { commentationPlugin } from "commentation";

export default defineConfig({
  plugins: [react(), commentationPlugin()],
});
```

### 2. Add the script tag

**index.html** (before `</body>`):
```html
<script src="/__commentation__/embed.js" data-project-id="my-project" type="module"></script>
```

The plugin serves the embed at `/__commentation__/embed.js` automatically. No need to copy files.

### 3. Done

Comments are written to `.commentation/data.json` at your project root. Commit and push to sync with your team.

## Usage

1. Run your dev server (`npm run dev`)
2. Click the 💬 button in the bottom-right
3. Turn on comment mode and click anywhere on the page to add a pin
4. Use the sidebar to view threads, reply, resolve, and assign

## Production

For production builds, copy the embed to your public folder:

```bash
cp node_modules/commentation/dist/embed.js public/
```

Then use:
```html
<script src="/embed.js" data-project-id="my-project"></script>
```

Without the plugin in production, comments fall back to in-memory storage (won't persist). Use the plugin in dev for full functionality.

## License

MIT
