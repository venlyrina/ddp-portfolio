# DDP Portfolio

Clean, deployable public source exported from the reviewed portfolio branch.
This repository intentionally excludes R&D history, local editors, backup tools,
Codespaces configuration, and trial assets outside the live dependency graph.

## Local verification
`npm ci`
`npm run build`
`npm run start`

## GitHub Pages
Enable **Settings → Pages → Build and deployment → GitHub Actions**.
The provided workflow deploys the main branch to
https://venlyrina.github.io/ddp-portfolio/ when Pages is enabled.
For a custom domain or other repository name, adjust `vite.config.js`.

Media contains original author assets. Do not replace or redistribute without authorization.
