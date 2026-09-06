# The Order of Things

Working title for a group blog combining original writing (via Sanity CMS) with tagged posts pulled in from contributors' Substack newsletters, shown together in one reverse-chronological feed.

## Status

Structural scaffold — page shells, content model, and routing are built and running on placeholder sample data. Not yet wired up: real Sanity content, real RSS ingestion, real Giscus comments, visual design.

## Stack

Next.js (App Router) + an embedded Sanity Studio at `/studio`.

## Getting started

```bash
npm install
npm run dev
```

Visit `/` for the site, `/studio` for the (currently disconnected) Sanity Studio.

## Connecting Sanity

1. Create a project at [sanity.io/manage](https://www.sanity.io/manage)
2. Copy `.env.local.example` to `.env.local` and fill in `NEXT_PUBLIC_SANITY_PROJECT_ID`
3. The schema (`Post`, `Author`) is already defined in `src/sanity/schemaTypes` — `/studio` will connect once the env vars are set

## Connecting Giscus (comments)

Comments require a public GitHub repo with Discussions enabled and the [giscus app](https://github.com/apps/giscus) installed. Once set up, generate config values at [giscus.app](https://giscus.app) and swap them into the placeholders in `src/components/Comments.tsx`.

## Data layer

`src/lib/posts.ts` currently returns static sample posts. It's the single place that will need to change to pull from Sanity (native posts) and the Substack RSS pipeline (aggregated posts) instead.
