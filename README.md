# NFC :: Tasker — Venture Café Workshop

You're reading this because you came through the NFC and Tasker workshop at Venture Café (or found the tag afterwards). This repository holds the reference site for that workshop: everything from the talk, plus more, in a form you can come back to any time.

**Open the guide:** https://gvrlv1931-pixel.github.io/Venture-Cafe-NFC-Workshop-/

If you were at the workshop, your NFC tag was handed to you there — start at "Program a Tag." If you're arriving later without a tag, any blank NFC sticker works; NTAG213 is the cheapest option and covers most of what's here (see the "Program a Tag" section for the full picture on tag types).

## What's on the page

- **Intro** — what NFC actually is, what Tasker adds on top of it, and how the two connect.
- **Program a Tag** — writing your first tag, step by step, with a Basic/Intermediate/Advanced rating on each step so you know what you're getting into.
- **Troubleshooting** — start here if a tap isn't doing anything. Covers general causes (metal interferes with the signal, NFC has to be switched on in your phone's settings), plus iPhone-specific and Android-specific notes.
- **NFC Idea Bank** — a filterable list of things to build with just a tag, no Tasker required. Each entry is a small challenge: it tells you what the tag should do, and you try building it before opening the hints, which reveal one at a time.
- **Tasker Automation** — Tasker is Android-only, and needs a small bridge app (NFC for Tasker) to hear about tag taps at all. This section covers that setup.
- **Worked Examples** — three full click-by-click builds of the same idea, a tag that looks up the word of the day, at Basic, Intermediate, and Advanced. The Advanced one ends up somewhere different: a car tag that starts navigation home or to work depending on the time of day.
- **Tasker Idea Bank** — a second idea bank for routines that need Tasker in addition to a tag.

Tick a card complete in either idea bank to earn XP toward a rank. Progress is saved locally in your browser (local storage), not on a server, so it stays on the device you used and won't follow you to a different phone or computer.

## About this repository

Static site, no build step: `index.html` plus `assets/`. Served from GitHub Pages off this repo (Settings → Pages → Deploy from a branch). If you're forking it to run your own version, point Pages at the branch this lives on with `/ (root)` as the folder.
