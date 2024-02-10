# NormChat UI
#

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
```

You can override the `.env` values by creating a local env file named `.env.local` if needed.

## Building

To create a production version of your app:

```bash
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy your app, you may need to install an [adapter](https://kit.svelte.dev/docs/adapters) for your target environment.

## Deployment

To manual deploy as [Azure Static Web Apps](https://learn.microsoft.com/en-us/azure/static-web-apps/) at scale.

```bash
npm install -g @azure/static-web-apps-cli
swa deploy ./build/ --env production --deployment-token {token}
```

## Customization

Create a new `.env.production` file in the root folder.
Set new values from the `.env` file.
