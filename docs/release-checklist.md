---
title: Tic-Tac-Toe Release Checklist
description: Candidate, deployment, and public-release gates for the static game
ms.date: 2026-10-09
---

## Candidate validation

Complete these checks for every production candidate:

* [ ] `node --test tests/*.test.mjs` passes without package installation
* [ ] Controlled integrated-browser checks pass
* [ ] Runtime assets are limited to `index.html`, `sw.js`, and `manifest.json`
* [ ] Total uncompressed runtime size is strictly below 50,000 bytes
* [ ] The `RELEASE` and `data-release` values match and changed from the previous release
* [ ] No application tracking or external runtime request was introduced
* [ ] Diagnostic performance is below 1,000 ms at p95 in the configured profile

Passing these checks creates a production candidate. It does not approve public release.

## Repository and publication authorization

The repository owner must complete these externally visible steps:

* [ ] Confirm the repository, default branch, and expected Pages URL
* [ ] Review the manual-only Pages workflow
* [ ] Configure the protected `github-pages` environment
* [ ] Set `ENABLE_PAGES_DEPLOYMENT=true`
* [ ] Explicitly authorize a workflow dispatch

Do not infer authorization from the presence of workflow files.

## Hosted lifecycle evidence

Run these checks on the actual Pages origin:

* [ ] HTTPS is active and the project subpath resolves
* [ ] `sw.js` has a JavaScript MIME type and the intended scope
* [ ] Cache headers for the shell, manifest, and worker are recorded
* [ ] Directory, `index.html`, and query-bearing links reopen offline
* [ ] A second release installs fresh bytes despite stale HTTP-cache entries
* [ ] An active old tab keeps its current game while the new worker waits
* [ ] Closing every app tab activates the new release
* [ ] A failed update leaves the previous release usable
* [ ] Unrelated origin caches remain untouched
* [ ] A known-good rollback uses a new release value and reaches clients after reconnection

## Physical-device performance

Record the actual phone model, operating system, browser, network, and run samples:

* [ ] Cold online usable-board timing is captured
* [ ] Warm online usable-board timing is captured
* [ ] Offline usable-board timing is captured
* [ ] Each state includes repeated samples and spread
* [ ] The agreed representative-phone result is strictly below 1,000 ms

Desktop emulation is diagnostic evidence only.

## Human validation

Complete `docs/manual-validation.md` without inventing or simulating results:

* [ ] Three to five real players participated
* [ ] At least two participants were older relatives
* [ ] Participants used their own phones
* [ ] Human screen-reader, focus, zoom, and physical-tap checks were completed
* [ ] Failures and observations were recorded without weakening the criteria

## Release decision

* Candidate owner:
* Release owner:
* Evidence location:
* Open gates:
* Decision:
* Date:

The decision may be **candidate ready**, **release approved**, or **release blocked**. Only use **release approved** when every applicable external gate is complete.
