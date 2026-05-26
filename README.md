# Past Paper Tracker

A mobile-friendly React + Vite app for tracking subject performance across past papers.

## Features

- Add multiple subjects.
- Add many papers per subject.
- Track year, paper type, marks, total marks, weak lessons, and mistake notes.
- Persist all data in `localStorage`.
- See average marks per subject.
- See weakest and strongest subjects.
- Review recent papers.
- View improvement over time.
- Ready for GitHub Pages deployment.

## Run Locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## GitHub Pages

The included workflow deploys `dist` to GitHub Pages when you push to `main`.

By default, the production base path is `/past-paper-tracker/`. If your repository name is different, set a repository variable named `GITHUB_PAGES_BASE`, or update `vite.config.js`.
