# GitHub + Vercel + PWA Deployment Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish the monorepo to GitHub, configure both apps for Vercel deployment, and turn the student app into a fully installable PWA that feels native on iOS and Android.

**Architecture:** Three independent workstreams — (1) PWA assets + service worker wired into the Angular build, (2) Vercel project config files committed to the repo, (3) GitHub repo creation and push. Vercel reads the committed config files and auto-deploys on every push to `main`.

**Tech Stack:** Angular 19, Nx 20, `@angular/service-worker`, Vercel (free tier), GitHub, Node canvas/sharp for icon generation.

---

## Chunk 1: PWA Assets — manifest, icons, iOS meta

### Task 1: Create `manifest.webmanifest`

**Files:**
- Create: `apps/student/public/manifest.webmanifest`

- [ ] **Step 1: Create the web app manifest**

```json
{
  "name": "სტუდენტის პორტალი",
  "short_name": "პორტალი",
  "description": "სტუდენტის პირადი კაბინეტი",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#1e3a5f",
  "background_color": "#1e3a5f",
  "lang": "ka",
  "icons": [
    {
      "src": "icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

Save to `apps/student/public/manifest.webmanifest`.

- [ ] **Step 2: Create icons directory**

```bash
mkdir -p apps/student/public/icons
```

### Task 2: Generate app icons with Node

**Files:**
- Create: `scripts/generate-icons.mjs`
- Create: `apps/student/public/icons/icon-192.png`
- Create: `apps/student/public/icons/icon-512.png`
- Create: `apps/student/public/icons/apple-touch-icon.png`

- [ ] **Step 1: Install sharp (image processing, no native deps needed)**

```bash
npm install --save-dev sharp --legacy-peer-deps
```

- [ ] **Step 2: Create icon generation script**

Create `scripts/generate-icons.mjs`:

```js
import sharp from 'sharp';
import { readFileSync } from 'fs';

// SVG source for the app icon — graduation cap on dark blue background
const svgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Background -->
  <rect width="512" height="512" rx="112" fill="#1e3a5f"/>
  <!-- Graduation cap body -->
  <polygon points="256,140 420,210 256,280 92,210" fill="#ffffff" opacity="0.95"/>
  <!-- Cap top -->
  <polygon points="256,140 420,210 256,175" fill="#ffffff"/>
  <!-- Tassel line -->
  <rect x="390" y="210" width="8" height="60" rx="4" fill="#60a5fa"/>
  <circle cx="394" cy="278" r="12" fill="#60a5fa"/>
  <!-- Board under cap -->
  <rect x="196" y="265" width="120" height="14" rx="7" fill="#ffffff" opacity="0.5"/>
  <!-- Steps -->
  <path d="M176,320 L176,370 L336,370 L336,320 C336,320 310,340 256,340 C202,340 176,320 176,320 Z" fill="#ffffff" opacity="0.9"/>
</svg>
`;

const sizes = [
  { size: 192, file: 'apps/student/public/icons/icon-192.png' },
  { size: 512, file: 'apps/student/public/icons/icon-512.png' },
  { size: 180, file: 'apps/student/public/icons/apple-touch-icon.png' },
];

for (const { size, file } of sizes) {
  await sharp(Buffer.from(svgIcon))
    .resize(size, size)
    .png()
    .toFile(file);
  console.log(`✅ Generated ${file}`);
}
```

- [ ] **Step 3: Run icon generation**

```bash
node scripts/generate-icons.mjs
```

Expected output:
```
✅ Generated apps/student/public/icons/icon-192.png
✅ Generated apps/student/public/icons/icon-512.png
✅ Generated apps/student/public/icons/apple-touch-icon.png
```

### Task 3: Update `index.html` with full iOS/PWA meta

**Files:**
- Modify: `apps/student/src/index.html`

- [ ] **Step 1: Replace the `<head>` content**

Replace the full `<head>` block in `apps/student/src/index.html` with:

```html
<!DOCTYPE html>
<html lang="ka">
<head>
  <meta charset="utf-8" />
  <title>სტუდენტის პორტალი</title>
  <base href="/" />

  <!-- Viewport — viewport-fit=cover for iOS notch -->
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />

  <!-- PWA theme -->
  <meta name="theme-color" content="#1e3a5f" />
  <meta name="description" content="სტუდენტის პირადი კაბინეტი" />

  <!-- iOS PWA -->
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="პორტალი" />
  <link rel="apple-touch-icon" href="icons/apple-touch-icon.png" />

  <!-- Android / standard -->
  <link rel="manifest" href="manifest.webmanifest" />
  <link rel="icon" type="image/x-icon" href="favicon.ico" />

  <!-- Prevent phone number detection -->
  <meta name="format-detection" content="telephone=no" />
</head>
<body>
  <app-root></app-root>
</body>
</html>
```

---

## Chunk 2: Service Worker

### Task 4: Install and configure `@angular/service-worker`

**Files:**
- Modify: `package.json` (via npm install)
- Create: `apps/student/ngsw-config.json`
- Modify: `apps/student/project.json`
- Modify: `apps/student/src/app/app.config.ts`

- [ ] **Step 1: Install `@angular/service-worker`**

```bash
npm install @angular/service-worker --legacy-peer-deps
```

Expected: adds `@angular/service-worker` to `dependencies` in `package.json`.

- [ ] **Step 2: Create `ngsw-config.json`**

Create `apps/student/ngsw-config.json`:

```json
{
  "$schema": "../../../node_modules/@angular/service-worker/config/schema.json",
  "index": "/index.html",
  "assetGroups": [
    {
      "name": "app-shell",
      "installMode": "prefetch",
      "resources": {
        "files": [
          "/favicon.ico",
          "/index.html",
          "/manifest.webmanifest",
          "/*.css",
          "/*.js"
        ]
      }
    },
    {
      "name": "assets",
      "installMode": "lazy",
      "updateMode": "prefetch",
      "resources": {
        "files": [
          "/icons/**",
          "/**/*.woff2",
          "/**/*.ttf"
        ]
      }
    }
  ]
}
```

- [ ] **Step 3: Enable service worker in `apps/student/project.json`**

In the `targets.build.options` object, add:

```json
"serviceWorker": "apps/student/ngsw-config.json"
```

Also add to `configurations.production`:
```json
"serviceWorker": "apps/student/ngsw-config.json"
```

- [ ] **Step 4: Register service worker in `app.config.ts`**

Modify `apps/student/src/app/app.config.ts` to add `provideServiceWorker`:

```typescript
import { ApplicationConfig, provideExperimentalZonelessChangeDetection, isDevMode } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideServiceWorker } from '@angular/service-worker';
import { studentAuthInterceptor } from '@portal/student/auth';
import { appRoutes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideExperimentalZonelessChangeDetection(),
    provideRouter(appRoutes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withFetch(), withInterceptors([studentAuthInterceptor])),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
```

- [ ] **Step 5: Verify production build compiles without errors**

```bash
npx nx build student --configuration=production
```

Expected: build succeeds, `dist/apps/student/browser/` contains `ngsw-worker.js` and `ngsw.json`.

```bash
ls dist/apps/student/browser/ | grep ngsw
```

Expected output:
```
ngsw-worker.js
ngsw.json
```

- [ ] **Step 6: Commit PWA changes**

```bash
git add apps/student/public/manifest.webmanifest \
        apps/student/public/icons/ \
        apps/student/src/index.html \
        apps/student/ngsw-config.json \
        apps/student/project.json \
        apps/student/src/app/app.config.ts \
        scripts/generate-icons.mjs \
        package.json package-lock.json
git commit -m "feat(student): add PWA manifest, icons, and service worker"
```

---

## Chunk 3: Native-Feel Mobile CSS

### Task 5: Global mobile-native CSS fixes

**Files:**
- Modify: `apps/student/src/styles.scss`
- Modify: `apps/student/src/app/layout/student-layout.component.scss`

- [ ] **Step 1: Add mobile-native global styles to `apps/student/src/styles.scss`**

Append after the `@tailwind utilities;` line:

```scss
// ── Mobile-native feel ──────────────────────────────────────────────

// Remove tap flash on iOS/Android
* {
  -webkit-tap-highlight-color: transparent;
}

// Prevent pull-to-refresh & overscroll bounce on the outer body
// (the inner .app-content handles its own scroll)
html, body {
  overscroll-behavior: none;
  overflow: hidden;
  height: 100%;
  width: 100%;
}

// Smooth momentum scrolling inside the content area
.app-content {
  -webkit-overflow-scrolling: touch;
}

// Prevent text selection on interactive nav elements (feels more native)
.nav-item, .bottom-nav {
  user-select: none;
  -webkit-user-select: none;
}

// On real mobile: expand to full screen, hide desktop card styling
@media (max-width: 480px) {
  .app-shell {
    max-width: 100% !important;
    box-shadow: none !important;
    border-radius: 0 !important;
  }
}
```

- [ ] **Step 2: Add safe-area padding to the app shell for status bar**

In `apps/student/src/app/layout/student-layout.component.scss`, update `.app-shell` to add top safe area:

```scss
.app-shell {
  max-width: 28rem;
  min-height: 100dvh;
  margin-inline: auto;
  background: var(--portal-surface);
  display: flex;
  flex-direction: column;
  position: relative;
  box-shadow: 0 0 60px rgb(0 0 0 / 0.15);
  // Extend behind the iOS status bar
  padding-top: env(safe-area-inset-top, 0);
}
```

- [ ] **Step 3: Commit native CSS fixes**

```bash
git add apps/student/src/styles.scss \
        apps/student/src/app/layout/student-layout.component.scss
git commit -m "feat(student): native-feel mobile CSS — no tap flash, safe areas, overscroll"
```

---

## Chunk 4: Vercel Configuration

### Task 6: Create `vercel.json` for each app

**Files:**
- Create: `apps/student/vercel.json`
- Create: `apps/admin/vercel.json`

- [ ] **Step 1: Create student `vercel.json`**

Create `apps/student/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/ngsw-worker.js",
      "headers": [
        { "key": "Cache-Control", "value": "no-cache" },
        { "key": "Service-Worker-Allowed", "value": "/" }
      ]
    },
    {
      "source": "/manifest.webmanifest",
      "headers": [
        { "key": "Content-Type", "value": "application/manifest+json" }
      ]
    }
  ]
}
```

- [ ] **Step 2: Create admin `vercel.json`**

Create `apps/admin/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 3: Commit Vercel configs**

```bash
git add apps/student/vercel.json apps/admin/vercel.json
git commit -m "feat: add Vercel SPA rewrite configs for both apps"
```

---

## Chunk 5: GitHub Repository & Push

### Task 7: Create GitHub repo and push

**Files:** none (git operations only)

- [ ] **Step 1: Install GitHub CLI if not present, or use git directly**

Check if `gh` is available:
```bash
which gh || brew install gh
```

If `brew install gh` is not available, skip to Step 3 (manual).

- [ ] **Step 2: Authenticate and create repo with `gh` CLI**

```bash
gh auth login
gh repo create dpavlenishvili/student-portal --public --description "Student Portal — Angular PWA + Admin Panel" --source=. --remote=origin --push
```

Expected: repo created at `https://github.com/dpavlenishvili/student-portal`, all commits pushed.

- [ ] **Step 3: (Alternative) Create repo manually then push**

If `gh` CLI is not available:
1. Go to https://github.com/new
2. Create repo named `student-portal`, public, NO readme/gitignore (repo must be empty)
3. Then run:

```bash
git remote add origin https://github.com/dpavlenishvili/student-portal.git
git branch -M main
git push -u origin main
```

- [ ] **Step 4: Verify push succeeded**

```bash
git log --oneline origin/main | head -5
```

---

## Chunk 6: Vercel Projects Setup

### Task 8: Deploy both apps on Vercel

These steps are done in the **Vercel dashboard** (https://vercel.com) — no CLI needed.

- [ ] **Step 1: Sign up / log in to Vercel with GitHub**

Go to https://vercel.com → "Continue with GitHub" → authorize.

- [ ] **Step 2: Create Student app project**

1. Click **"Add New Project"**
2. Import `dpavlenishvili/student-portal`
3. Set **Framework Preset**: `Other`
4. Set **Root Directory**: *(leave empty — project root)*
5. Set **Build Command**: `npx nx build student --configuration=production`
6. Set **Output Directory**: `dist/apps/student/browser`
7. Click **Deploy**

- [ ] **Step 3: Create Admin app project (second Vercel project)**

1. Click **"Add New Project"** again (same repo, second project)
2. Import `dpavlenishvili/student-portal`
3. Set **Framework Preset**: `Other`
4. Set **Root Directory**: *(leave empty)*
5. Set **Build Command**: `npx nx build admin --configuration=production`
6. Set **Output Directory**: `dist/apps/admin/browser`
7. Click **Deploy**

- [ ] **Step 4: Note the deployed URLs**

After both deploys succeed, note the URLs:
- Student: `https://student-portal-student-<hash>.vercel.app` (or rename in Vercel settings)
- Admin: `https://student-portal-admin-<hash>.vercel.app`

- [ ] **Step 5: Verify student app is installable as PWA**

On an Android phone:
1. Open the student URL in Chrome
2. Tap the browser menu → "Add to Home Screen"
3. Confirm install
4. Launch from home screen — should open with no browser chrome, full screen

On an iPhone:
1. Open student URL in Safari
2. Tap the Share button → "Add to Home Screen"
3. Confirm → launch from home screen

---

## Chunk 7: Build Budget Fix (optional but recommended)

### Task 9: Increase initial bundle budget

The current 500kb warning budget may be hit by Font Awesome + Noto Sans Georgian. Fix to avoid build warnings:

**Files:**
- Modify: `apps/student/project.json`
- Modify: `apps/admin/project.json`

- [ ] **Step 1: Update budgets in both project.json files**

In both `apps/student/project.json` and `apps/admin/project.json`, update the production `budgets`:

```json
"budgets": [
  {
    "type": "initial",
    "maximumWarning": "1mb",
    "maximumError": "2mb"
  },
  {
    "type": "anyComponentStyle",
    "maximumWarning": "8kb",
    "maximumError": "16kb"
  }
]
```

- [ ] **Step 2: Verify clean production build**

```bash
npx nx build student --configuration=production 2>&1 | tail -20
npx nx build admin --configuration=production 2>&1 | tail -20
```

Expected: both complete with `✔ Build complete` and no budget errors.

- [ ] **Step 3: Commit and push**

```bash
git add apps/student/project.json apps/admin/project.json
git commit -m "chore: increase build budgets for font assets"
git push origin main
```

Vercel will automatically re-deploy both projects on this push.
