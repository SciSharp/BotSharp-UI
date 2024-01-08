# BotSharp UI

The `BotSharp UI` is a web app used to manage agents and conversations. Through it you can use it to build new Agents and manage existing Agents.

[![Discord](https://img.shields.io/discord/1106946823282761851?label=Discord)](https://discord.com/channels/1106946823282761851/1106947212459642991)
[![QQ群聊](https://img.shields.io/static/v1?label=QQ&message=群聊&color=brightgreen)](http://qm.qq.com/cgi-bin/qm/qr?_wv=1027&k=sN9VVMwbWjs5L0ATpizKKxOcZdEPMrp8&authKey=RLDw41bLTrEyEgZZi%2FzT4pYk%2BwmEFgFcrhs8ZbkiVY7a4JFckzJefaYNW6Lk4yPX&noverify=0&group_code=985366726)
[![Deployment](https://github.com/SciSharp/BotSharp-UI/actions/workflows/azure-static-web-apps-victorious-moss-007e11310.yml/badge.svg)](https://github.com/SciSharp/BotSharp-UI/actions/workflows/azure-static-web-apps-victorious-moss-007e11310.yml/)
[![Demo](https://img.shields.io/badge/demo-BotSharp%20UI-blue)](https://victorious-moss-007e11310.4.azurestaticapps.net/)

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
```

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.
