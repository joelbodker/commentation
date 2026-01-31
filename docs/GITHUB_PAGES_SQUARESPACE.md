# Publishing commentation.com via GitHub Pages (Squarespace Domain)

This guide walks you through connecting **commentation.com** (registered at Squarespace) to your GitHub Pages landing site. No prior DNS experience needed.

---

## What we're doing (in plain English)

1. **Your domain** (commentation.com) lives at Squarespace — you bought it there.
2. **Your website** (the landing page) will live on GitHub Pages — free hosting from GitHub.
3. **DNS** is like a phone book: it tells the internet "when someone types commentation.com, send them to GitHub's servers."
4. We'll add 4 "A records" in Squarespace so commentation.com points to GitHub Pages.

---

## Prerequisites

- [ ] GitHub account
- [ ] Commentation repo pushed to GitHub
- [ ] Squarespace account with commentation.com
- [ ] Domain must be **registered with Squarespace** or **connected via Nameserver Connect** (not DNS Connect — if you use DNS Connect, you edit DNS at your domain provider instead)

---

## Part 1: Set up GitHub Pages

### Step 1.1: Enable GitHub Pages

1. Go to your repo on GitHub: `https://github.com/YOUR_USERNAME/commentation`
2. Click **Settings** (top menu)
3. In the left sidebar, click **Pages**
4. Under **Build and deployment**:
   - **Source:** select **GitHub Actions**
5. Don't add the custom domain yet — we'll do that after DNS is set up.

### Step 1.2: Deploy your site (so GitHub has something to serve)

1. From your project folder, run:
   ```bash
   git add .
   git commit -m "Deploy landing to GitHub Pages"
   git push origin main
   ```
2. Go to **Actions** in your repo — you should see "Deploy landing to GitHub Pages" running.
3. Wait for it to finish (green checkmark, ~1–2 minutes).
4. Your site is now live at `https://YOUR_USERNAME.github.io/commentation/` — you can check it works before pointing your domain.

---

## Part 2: Point Squarespace DNS to GitHub Pages

### Step 2.1: Open Squarespace DNS settings

1. Log in to [Squarespace](https://account.squarespace.com)
2. Go to **Domains** (or visit [account.squarespace.com/domains](https://account.squarespace.com/domains))
3. Click **commentation.com**
4. Click **DNS** (or **DNS Settings**)

> **If you don't see DNS Settings:** Your domain might be connected via "DNS Connect." In that case, you manage DNS at your domain provider (where you bought the domain), not in Squarespace. Skip to the note at the end.

### Step 2.2: Remove conflicting records (if any)

Before adding new records, we need commentation.com to point to GitHub, not Squarespace.

1. Scroll to **Custom Records**
2. Look for existing **A records** or **CNAME records** with Host = `@` or Host = `commentation.com`
3. If you see any that point to Squarespace (e.g. `*.squarespace.com` or Squarespace IPs), you may need to remove or change them.  
   - **Caution:** If commentation.com is currently your main Squarespace site, changing this will make that site unreachable at commentation.com. Make sure you're okay with that.
4. If you're unsure, you can add the GitHub records first — having multiple A records for different IPs is fine (we're adding 4 for GitHub).

### Step 2.3: Add the 4 A records for GitHub Pages

You'll add **4 separate A records**. Each one points your domain to one of GitHub's servers.

**For each of the 4 records below, do this:**

1. Click **Add record**
2. Enter your password (or 2FA) if prompted → **Continue**
3. **Type:** select **A**
4. **Host:** type `@` (this means "the main domain" — commentation.com)
5. **IP Address:** paste the IP from the table below (one per record)
6. Click **Save**

| Record # | IP Address      |
|----------|-----------------|
| 1        | `185.199.108.153` |
| 2        | `185.199.109.153` |
| 3        | `185.199.110.153` |
| 4        | `185.199.111.153` |

**Repeat** until all 4 A records exist. When done, you should see 4 A records with Host `@` and the IPs above.

### Step 2.4: (Optional) Add www → apex redirect

If you want `www.commentation.com` to work too:

1. Click **Add record**
2. **Type:** select **CNAME**
3. **Host:** type `www`
4. **Alias Data / Points to:** type `YOUR_USERNAME.github.io` (replace YOUR_USERNAME with your GitHub username)
5. Click **Save**

---

## Part 3: Add custom domain in GitHub

### Step 3.1: Tell GitHub to use commentation.com

1. Go back to your repo → **Settings** → **Pages**
2. Under **Custom domain**, type: `commentation.com`
3. Click **Save**

### Step 3.2: Wait for DNS to propagate

DNS changes can take **15 minutes to 48 hours**. Usually it's within an hour.

1. GitHub will show "DNS check in progress" or "Checking..." — that's normal.
2. When it's ready, you'll see a green checkmark.
3. Check **Enforce HTTPS** (GitHub will provision an SSL certificate).

### Step 3.3: Verify

Visit **https://commentation.com** — you should see your landing page.

---

## Troubleshooting

| Problem | What to try |
|--------|-------------|
| "DNS check in progress" for a long time | Wait up to 48 hours. You can check propagation at [dnschecker.org](https://dnschecker.org) — search for `commentation.com` and A records. |
| Site loads but shows 404 | Make sure the GitHub Actions workflow completed. Check **Actions** tab for errors. |
| "Domain's DNS record could not be retrieved" | Verify all 4 A records are correct. Host must be `@`, IPs must match exactly. |
| commentation.com still shows Squarespace | DNS may not have propagated yet. Clear your browser cache or try incognito. |
| I don't see DNS Settings in Squarespace | Your domain may use "DNS Connect" — edit DNS at your domain registrar instead, using the same 4 A records. |

---

## Quick reference: The 4 A records

Copy-paste these into Squarespace (one record per row):

| Type | Host | Data |
|------|------|------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

---

## If your domain uses DNS Connect

If Squarespace says your domain is connected via **DNS Connect**, you manage DNS at your domain provider (GoDaddy, Namecheap, Google Domains, etc.). The steps are the same idea:

1. Log in to your domain provider
2. Find **DNS settings** or **Manage DNS**
3. Add the same 4 A records: Host `@`, IPs `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
4. Save and wait for propagation
