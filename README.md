# Visitor log app

*Automatically synced with your [v0.app](https://v0.app) deployments*

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/theos-projects-1299e2a0/v0-visitor-log-app)
[![Built with v0](https://img.shields.io/badge/Built%20with-v0.app-black?style=for-the-badge)](https://v0.app/chat/dmmYLbyA1kw)

## Overview

This repository will stay in sync with your deployed chats on [v0.app](https://v0.app).
Any changes you make to your deployed app will be automatically pushed to this repository from [v0.app](https://v0.app).

## Deployment

Your project is live at:

**[https://vercel.com/theos-projects-1299e2a0/v0-visitor-log-app](https://vercel.com/theos-projects-1299e2a0/v0-visitor-log-app)**

## Build your app

Continue building your app on:

**[https://v0.app/chat/dmmYLbyA1kw](https://v0.app/chat/dmmYLbyA1kw)**

## Supabase configuration

The app now requires Supabase Auth with a single allowed user. Configure the following environment variables before running locally or deploying:

- `NEXT_PUBLIC_SUPABASE_URL` – your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – the anonymous public API key (used by the browser and auth helpers)
- `SUPABASE_SERVICE_ROLE_KEY` – the service role key used by API routes after authentication
- `SUPABASE_ALLOWED_EMAIL` (or `ALLOWED_EMAIL`) – the single email address that is allowed to sign in

Only password-based login is enabled. Registration should be disabled in Supabase. Users who are not signed in or whose email does not match `SUPABASE_ALLOWED_EMAIL` will be redirected to `/login` and receive a forbidden response from API routes.

## How It Works

1. Create and modify your project using [v0.app](https://v0.app)
2. Deploy your chats from the v0 interface
3. Changes are automatically pushed to this repository
4. Vercel deploys the latest version from this repository
