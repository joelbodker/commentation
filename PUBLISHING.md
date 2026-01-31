# Publishing Commentation

This guide walks you through making Commentation widely accessible via npm, GitHub Pages, and other distribution channels.

---

## Part 0: GitHub Pages (Landing Site)

Publish the landing page at **https://commentation.com**.

> **Domain at Squarespace?** See **[docs/GITHUB_PAGES_SQUARESPACE.md](docs/GITHUB_PAGES_SQUARESPACE.md)** for a step-by-step walkthrough (beginner-friendly).

### Prerequisites

- GitHub account
- Repo pushed to GitHub
- Custom domain `commentation.com` pointed to GitHub Pages (see below)

### Step 1: Enable GitHub Pages

1. Go to your repo on GitHub → **Settings** → **Pages**
2. Under **Build and deployment**:
   - **Source:** GitHub Actions
3. Under **Custom domain**: enter `commentation.com`
4. Enable **Enforce HTTPS** once DNS propagates

### Step 2: Configure DNS

Point your domain to GitHub Pages:

- **A records** (recommended): `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- **CNAME** (if using `www`): `www.commentation.com` → `username.github.io`

See [GitHub’s custom domain docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site) for details.

### Step 3: Deploy

The workflow runs automatically on every push to `main`. To deploy:

```bash
git add .
git commit -m "Deploy landing"
git push origin main
```

Or trigger manually: **Actions** → **Deploy landing to GitHub Pages** → **Run workflow**.

### Step 4: Verify

After the workflow completes (usually 1–2 minutes), visit **https://commentation.com**.

### Local preview

```bash
npm run build:landing
npx serve landing/dist -p 4174
```

Then open `http://localhost:4174/`.

---

## Part 1: npm Package

### Prerequisites

- [npm account](https://www.npmjs.com/signup) (free)
- Node.js 18+
- Git

---

## Part 1: npm Package

### Step 1: Create your npm account

1. Go to [npmjs.com/signup](https://www.npmjs.com/signup)
2. Create a free account (username, email, password)
3. Verify your email

### Step 2: Check package name availability

The package name `commentation` must be available on npm. Check:

```bash
npm search commentation
```

Or try to view it: [npmjs.com/package/commentation](https://www.npmjs.com/package/commentation)

If the name is taken, you'll need to use a scoped name like `@yourusername/commentation`.

### Step 3: Build the publishable package

From the repo root:

```bash
# Build the embed script and copy to the package
npm run build:package
```

This:
1. Builds `frontend/dist/embed.js` (the overlay bundle)
2. Copies it to `packages/commentation/dist/embed.js`

### Step 4: Test the package locally

Before publishing, test that it works:

```bash
cd packages/commentation
npm pack
```

This creates `commentation-0.1.0.tgz`. In a separate test project:

```bash
npm init -y
npm install /path/to/commentation/commentation-0.1.0.tgz
```

Then add to your test project's `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { commentationPlugin } from "commentation";

export default defineConfig({
  plugins: [react(), commentationPlugin()],
});
```

And in `index.html`:

```html
<script src="/__commentation__/embed.js" data-project-id="test" type="module"></script>
```

Run `npm run dev` and verify the overlay appears.

### Step 5: Log in to npm

```bash
npm login
```

Enter your npm username, password, and email. You may need to enter a one-time password (OTP) if you have 2FA enabled.

### Step 6: Publish

From the repo root:

```bash
# Ensure the package is built
npm run build:package

# Publish
cd packages/commentation
npm publish
```

For a scoped package (e.g. `@joelbodker/commentation`), add `--access public`:

```bash
npm publish --access public
```

### Step 7: Verify

After publishing:

- Visit [npmjs.com/package/commentation](https://www.npmjs.com/package/commentation)
- Install in a fresh project: `npm install commentation`

---

## Part 2: Update Documentation

After publishing, update:

1. **README.md** – Change "copy vite-plugin-commentation.ts" to "npm install commentation"
2. **Landing page Hero** – Change the CTA button to copy `npm install commentation`
3. **Integration section** – Update the code snippet to use the npm package

### New user flow (after npm publish)

```bash
npm install commentation
```

**vite.config.ts:**
```ts
import { commentationPlugin } from "commentation";

export default defineConfig({
  plugins: [react(), commentationPlugin()],
});
```

**index.html:**
```html
<script src="/__commentation__/embed.js" data-project-id="my-project" type="module"></script>
```

The plugin serves the embed at `/__commentation__/embed.js` automatically — no need to copy files.

---

## Part 3: CDN (Automatic)

Once published to npm, your package is automatically available on CDNs:

- **unpkg:** `https://unpkg.com/commentation/dist/embed.js`
- **jsDelivr:** `https://cdn.jsdelivr.net/npm/commentation/dist/embed.js`

Users can use these for production if they prefer not to serve from the Vite plugin.

---

## Part 4: GitHub Releases (Optional)

For versioned releases and changelogs:

1. Tag a release:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

2. Create a release on GitHub:
   - Go to your repo → Releases → "Draft a new release"
   - Choose the tag (v0.1.0)
   - Add release notes
   - Optionally attach `packages/commentation/dist/embed.js` for direct download

---

## Part 5: Homebrew (Optional, for CLI only)

Homebrew is best for CLI tools. Commentation is a Vite plugin/script, so Homebrew isn't a natural fit unless you add a CLI (e.g. `commentation init`). If you add a CLI later:

1. Create a [Homebrew tap](https://docs.brew.sh/Taps)
2. Add a formula that runs `npm install -g commentation` or installs a binary
3. Users: `brew install yourusername/tap/commentation`

---

## Versioning

When you make changes and want to publish an update:

1. Update version in `packages/commentation/package.json`:
   ```json
   "version": "0.1.1"
   ```

2. Rebuild and publish:
   ```bash
   npm run build:package
   cd packages/commentation
   npm publish
   ```

Use [semantic versioning](https://semver.org/):
- **Patch** (0.1.0 → 0.1.1): Bug fixes
- **Minor** (0.1.0 → 0.2.0): New features, backward compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes

---

## Troubleshooting

**"Package name already taken"**  
Use a scoped name: `@yourusername/commentation` and publish with `--access public`.

**"403 Forbidden"**  
You may not have permission. Ensure you're logged in (`npm whoami`) and the package name is available.

**"Embed not found" when running dev**  
Run `npm run build:package` from the repo root. The embed must exist at `packages/commentation/dist/embed.js`.

**Landing page / monorepo still uses local plugin**  
The landing page uses `@commentation` alias to `../frontend/src`. After publishing, you could switch it to `npm install commentation` and use the published package for a true end-to-end test.
