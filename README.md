# Venture Cafe NFC Workshop

A reference site for programming NFC tags and combining them with Tasker automations. Covers how NFC tags work, step-by-step programming instructions, and a categorised idea bank, split into a general NFC section and a Tasker-specific section.

If you attended the workshop at Venture Café, your NFC tag was provided there. This site stays online afterwards for anyone who wants to keep building with it; readers arriving later will need to get their own blank NFC tag, as covered in the Program a Tag section.

## Site

This repo is a static site (`index.html` plus `assets/`), intended to be served with GitHub Pages:

1. Go to Settings, then Pages, on this repository.
2. Under Build and deployment, set Source to "Deploy from a branch".
3. Pick the branch this site lives on and `/ (root)` as the folder, then save.
4. GitHub publishes it at `https://<owner>.github.io/<repo>/` within a minute or two.

No build step or dependencies are required. It is plain HTML, CSS, and JavaScript.

### What's on the page

- A short explanation of NFC and Tasker, with a collapsible section covering how tag reads and Tasker's NFC bridge work in more detail.
- Step-by-step instructions for programming a tag, each step rated Basic, Intermediate, or Advanced.
- A filterable idea bank, split into Serious and Silly categories, with a tick-to-complete checkbox on each entry that adds XP toward a rank. Progress is tracked locally in the browser using local storage.
- Each idea bank entry is framed as a challenge: a short description of what the tag does, followed by hints that reveal one at a time, giving the exact app, record type, or Tasker profile and actions needed to build it.
- A Tasker-specific setup guide and a second, Tasker-only idea bank for routines that require Tasker in addition to a programmed tag.
