# BotSharp UI

The `BotSharp UI` is a web app used to manage agents and conversations. Through it you can build new Agent, manage existing Agents and conversations. The Node-based Agent building experience allows you to build a brand new AI assistant in a very short time. 
This project is written in [SvelteKit v2](https://svelte.dev/) and backed by [BotSharp](https://github.com/SciSharp/BotSharp) as the [LLM](https://en.wikipedia.org/wiki/Large_language_model) services.

[![Discord](https://img.shields.io/discord/1106946823282761851?label=Discord)](https://discord.com/channels/1106946823282761851/1106947212459642991)
[![QQ群聊](https://img.shields.io/static/v1?label=QQ&message=群聊&color=brightgreen)](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=sN9VVMwbWjs5L0ATpizKKxOcZdEPMrp8&authKey=RLDw41bLTrEyEgZZi%2FzT4pYk%2BwmEFgFcrhs8ZbkiVY7a4JFckzJefaYNW6Lk4yPX&noverify=0&group_code=985366726)
[![Deployment](https://github.com/SciSharp/BotSharp-UI/actions/workflows/azure-static-web-apps-victorious-moss-007e11310.yml/badge.svg)](https://github.com/SciSharp/BotSharp-UI/actions/workflows/azure-static-web-apps-victorious-moss-007e11310.yml/)
[![Latest Build Demo](https://img.shields.io/badge/Latest%20build%20demo-BotSharp%20UI-blue)](https://victorious-moss-007e11310.4.azurestaticapps.net/)

[<img src="https://i.ytimg.com/vi/nougEw-vyk0/maxresdefault.jpg" width="50%">](https://www.youtube.com/watch?v=nougEw-vyk0 "BotSharp UI")

## Installation

Install dependent libraries.

```bash
git clone https://github.com/SciSharp/BotSharp-UI
cd BotSharp-UI
npm install
```

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open

# or start the server with different .env
npm run dev -- --mode botsharp
```

You can override the `.env` values by creating a local env file named `.env.local` if needed.

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## Desktop app

The same UI ships as a [Tauri](https://tauri.app) desktop app, using the system
WebView (WebView2 on Windows, WKWebView on macOS).

One-time setup: install [Rust](https://rustup.rs) and, on Windows, the
"Desktop development with C++" workload from the Visual Studio Installer.

```bash
# run the desktop app
npm run tauri:dev

# run it against a specific .env file
npm run tauri:dev -- --mode staging

# build installers into src-tauri/target/release/bundle/
npm run tauri:build -- --mode staging
```

Without `--mode`, `tauri:dev` looks for `.env.development` and `tauri:build` for
`.env.production`, matching Vite's own defaults. Neither has to exist — the
committed `.env` supplies the defaults, so a fresh clone builds as-is.

The window title and bundle identifier come from `PUBLIC_BRAND_NAME` in the
selected env file, so each brand installs as its own app. Set
`PUBLIC_DESKTOP_IDENTIFIER` to override the derived identifier.

App icons are compiled into the binary, so they are generated as a separate
step from `PUBLIC_LOGO_URL` (ideally a 1024x1024 PNG or an SVG). Non-square
logos are padded onto a square canvas automatically:

```bash
# regenerate the default icon set from the .env logo
npm run tauri:icon

# use another env file's logo instead
npm run tauri:icon -- --mode staging
```

Only the sizes listed in `bundle.icon` in
[src-tauri/tauri.conf.json](src-tauri/tauri.conf.json) are committed. The mobile
and Microsoft Store sizes `tauri icon` also emits are gitignored — rerun the
command if you start building for those targets.

`PUBLIC_`-prefixed values are inlined into the client bundle, so
`PUBLIC_ADMIN_USERNAME` and `PUBLIC_ADMIN_PASSWORD` are stripped from desktop
builds — otherwise they would be readable by anyone who unpacks the installer.
`tauri:build` verifies they are gone and refuses to package if they are not.
`tauri:dev` keeps them, so the login prefill still works while developing.

## Deployment

To manual deploy as [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/) at scale.

```bash
npm run build -- --mode production
npm install -g @azure/static-web-apps-cli
swa deploy ./build/ --env production --deployment-token {token}
```

## Customization

Create a new `.env.production` file in the root folder.
Set new values from the `.env` file.