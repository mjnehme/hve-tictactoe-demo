---
title: Tic-Tac-Toe
description: A tiny, accessible, offline-capable game for two local players
ms.date: 2026-10-09
---

## Overview

This repository contains a no-build Tic-Tac-Toe game for two people sharing one device. It has no accounts, advertisements, analytics, backend, computer opponent, or online multiplayer.

The production runtime is the three-file `public/` directory. Development tooling validates those files directly and does not compile or bundle them.

## Play locally

Serve the runtime over HTTP so the browser can register its service worker:

```bash
python3 -m http.server 4173 --directory public
```

Open `http://127.0.0.1:4173/`.

Player names and the score last only for the current page session. **Play again** keeps them; reloading the page resets them.

## Offline behavior

The first successful online load prepares offline play. The status below the game reports one of these states:

* Offline play is preparing
* Offline play is ready
* Offline play is unavailable while online play remains usable
* An update is waiting until every game tab is closed

A never-cached visit cannot work offline. Browser storage can also be removed by the player, browser, or operating system.

Updates do not force-reload an active game. When an update is ready, finish the session, close every game tab, and reopen the game. Reloading clears names and the session score.

## Privacy

The application makes only same-origin requests for its runtime files. It does not collect application analytics or player data.

A hosting provider such as GitHub Pages may retain security and access logs under its own policies. Those host logs are separate from application tracking.

## Validate changes

Use Node.js 20 or newer. No package installation is required:

```bash
node --test tests/*.test.mjs
```

Dependency-free validation covers the production game rules, required semantic and responsive source contracts, service-worker installation and cache ownership, runtime bytes, privacy, workflow boundaries, and release identifiers.

Controlled integrated-browser checks additionally cover rendered focus, 320 px reflow, offline query navigation, failed installation, waiting updates, fresh release bytes, and the diagnostic mobile performance profile.

Automated checks do not establish real-player benefit, physical-phone performance, or accessibility conformance. See `docs/manual-validation.md`.

## Release model

The Pages workflow is manual and has two gates:

1. A person explicitly dispatches the workflow.
2. The repository variable `ENABLE_PAGES_DEPLOYMENT` is set to `true`.

The deploy job also uses the protected `github-pages` environment. Adding the workflow does not enable Pages, set the variable, create the environment, or authorize publication.

For each runtime change:

1. Change the `RELEASE` value in `public/sw.js`.
2. Change the matching `data-release` value in `public/index.html`.
3. Run `node --test tests/*.test.mjs` and the controlled integrated-browser checks.
4. Complete the candidate and hosted checks in `docs/release-checklist.md`.

Rollback means redeploying known-good assets with a **new** release value. Offline clients receive the rollback only after reconnecting.
