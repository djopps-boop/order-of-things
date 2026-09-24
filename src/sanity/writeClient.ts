import { createClient } from "next-sanity";
import { projectId, dataset, apiVersion } from "./env";

// Server-side, build-time only -- never import this from anything that
// could end up in a client bundle (nothing here belongs in a Studio React
// component or any "use client" file). Distinct from client.ts (the
// public, read-only, CDN-cached client used everywhere else) because this
// one carries a write-scoped token and talks to the live API directly,
// not the CDN -- a write needs to be immediately consistent with the read
// that follows it in the same build.
//
// Used by adoptedPosts.ts to give an aggregated post a permanent identity
// the first time a Turn needs to point at one, and to keep it synced
// against its still-live Substack source on later builds. See the session
// notes on "lazy persistence" for the full design.
//
// SANITY_WRITE_TOKEN is deliberately NOT prefixed NEXT_PUBLIC_ -- it must
// never be inlined into client-side JS. It won't be set in this sandbox,
// or on any build before the token is created in Sanity's dashboard
// (Settings -> API -> Tokens, write access, scoped to this dataset) and
// added to Cloudflare Pages. Every call site here treats writeClient being
// null as the normal, expected case -- not an error -- and just falls
// back to the pre-this-feature behavior.
const writeToken = process.env.SANITY_WRITE_TOKEN;

export const writeClient = writeToken
  ? createClient({ projectId, dataset, apiVersion, useCdn: false, token: writeToken })
  : null;
