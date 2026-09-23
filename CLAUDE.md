@AGENTS.md

# The Order of Things — Project Context

This file is for **Claude Code** running directly against this repo (locally, or via claude.ai/code). If you're reading this, you likely have direct filesystem and git access — see "Deploy workflow" below, which is different from how a browser-chat version of Claude worked on this project previously.

## What this is
Daniel Oppenheimer's group blog, "The Order of Things." Next.js (App Router, static export) hosted on Cloudflare Pages, auto-deploys on every push to `main`. Repo: `github.com/djopps-boop/order-of-things`. Live at `https://orderofthings.blog` (and `www.orderofthings.blog`), with the original `https://order-of-things.pages.dev` also still live and pointing at the same deployment.

Two kinds of posts:
- **Native posts** — written in Sanity Studio (embedded at `/studio` on the live site), rendered from a GROQ query via `src/sanity/posts.ts`.
- **Aggregated posts** — pulled at build time from contributors' Substack RSS feeds (`src/lib/rss.ts`), filtered by an inclusion marker (see below).

Comments run on Giscus (`mapping="pathname"`, category "Announcements"), stored as GitHub Discussions on this same repo, and surfaced on-site via a real build-time GraphQL fetch (`src/lib/comments.ts`) powering the homepage's "Active Threads" column and the "Recent Comments" sidebar widget.

## Deploy workflow — you likely have direct git access
Earlier work on this project was done by a browser-based Claude with **no direct access** to Daniel's machine or GitHub credentials — every change had to be committed in an isolated sandbox, uploaded to a Box folder as individual text files (with `.txt` suffixes and `__`-encoded paths to work around Box's upload tool limitations), and then Daniel manually copied, committed, and pushed each one himself. **That workflow is obsolete for you.** If you're running as Claude Code (locally or via claude.ai/code), just edit files and run `git add`/`commit`/`push` directly — no Box, no handoff files, no asking Daniel to run copy commands.

Still worth doing before pushing anything:
1. `npm ci`
2. `npx eslint <changed files>`
3. `npx tsc --noEmit` (note: on a *fresh* clone, run `npx next build` first — Next generates route types during build that a standalone `tsc` run needs, or you'll see a false `LayoutProps` error)
4. `NEXT_PUBLIC_SANITY_PROJECT_ID=awzmg645 NEXT_PUBLIC_SANITY_DATASET=production npx next build` — Sanity/RSS/GitHub Discussions fetches will fail or return empty in a sandboxed environment; that's expected, the fallback/empty-state paths are exactly what get exercised.
5. After pushing, confirm the push actually landed with `git ls-remote https://github.com/djopps-boop/order-of-things.git main`, then check the Cloudflare Pages build log (dashboard → Workers & Pages → order-of-things → Deployments) for the specific feature you shipped, and spot-check the live site with a screenshot (a plain text/markdown fetch won't reveal CSS layout bugs).

If you're on Daniel's actual Mac and git commands hang or fail with an Xcode license error, see "Known environment risks" below before assuming something's broken.

## Content aggregation: the inclusion marker system
Contributors must explicitly tag a Substack post for inclusion — this is deliberate and was tightened during the last session:
- Accepted markers: `[[OOT]]` (case-insensitive) or `#oot` (word-boundary guarded so it doesn't false-match `#ootd`/`#oots`-style hashtags — see `MARKER_RE` in `src/lib/rss.ts`).
- Marker can go in the post's title, subtitle, or body.
- **`BOOTSTRAP_MODE` is `false`** — every contributor is marker-only immediately. A contributor with zero tagged posts contributes zero posts to the feed. (It used to backfill each contributor's recent posts until their first tagged one; that fallback is now off sitewide, per explicit request.)
- Substack's own RSS `<category>` field is essentially always empty in practice — don't try to build a filter around it.

## GitHub Discussions token
`GITHUB_DISCUSSIONS_TOKEN` (a fine-grained GitHub PAT, Discussions: Read-only, scoped to this repo) is set in Cloudflare Pages env vars. It powers `src/lib/comments.ts`'s build-time GraphQL fetch. Adding/changing this env var does **not** auto-trigger a rebuild — either push an empty commit (`git commit --allow-empty -m "..."`) or use "Retry deployment" in the Cloudflare dashboard.

## Three real bugs hit last session — worth knowing before touching Active Threads/Comments again
1. **Layout collapse when there's no data.** `FeedLayout` must decide 2-column vs. 3-column based on whether there's actually thread data to show, not just whether a `leftColumn` prop was passed — a component that might internally render `null` can't inform that decision in time. The fix hoists the "is there anything to show" check up to `page.tsx`.
2. **GitHub's GraphQL `orderBy`** is only valid on the top-level `discussions` field, not on nested `comments` connections. Sort comments client-side after fetching instead.
3. **Giscus pathname mismatch.** Giscus creates discussion titles as the pathname *without* a leading slash; this site's own `Post.permalink` values start with one. Any Giscus ↔ site lookup must normalize (`normalizePath()` in `comments.ts`) before comparing.

General lesson: "the build succeeded and rendered empty" can mean no data yet, a query bug, or a matching bug — check the actual Cloudflare build log (search for `[comments]`) and the real `github.com/djopps-boop/order-of-things/discussions` page before assuming which.

## Conventions / gotchas
- `EXCERPT_WORD_CAP` (150) and `WORD_CAP` (600) in `src/lib/config.ts` control feed-card truncation tiers.
- `truncateHtmlByWords()` / `splitHtmlAfterParagraphs()` in `src/lib/htmlText.ts` — the latter is what lets the per-post Subscribe button sit inline between the 2nd and 3rd paragraphs of an expanded post rather than at the bottom.
- Mobile breakpoints: `900px` and `640px` in `globals.css`. The homepage's 3-column layout (with the Active Threads left column) collapses to a single stack below 900px, left column rendering *above* the feed on mobile (deliberate — DOM-order-first, keeps it early in the scan path).
- Featured images use natural aspect ratio (`height: auto`, no `max-height`) — a prior cap caused letterboxing.
- Every contributor lives in `src/lib/sources.ts` (`NewsletterSource[]`) — this is also what the RSS aggregator iterates over, so removing a contributor here both drops them from the Contributors sidebar *and* stops fetching their feed entirely. Optional `pronoun: "his" | "her"` field feeds the per-post "Subscribe to [name] at [pronoun] Substack" CTA text (defaults to "his").
- The Subscribe CTA button (`.subscribe-button` in `globals.css`) uses a soft orange-to-yellow gradient deliberately echoing the 🔥 in Active Threads — this was iterated on a lot (solid Substack orange → real logo → back to a custom mark → gradient); don't "simplify" it back to a flat color without checking with Daniel first, it's a considered choice.
- Blogroll sidebar section was removed (not just hidden) since it had no real content — see git history (`git log --oneline -- src/components/Sidebar.tsx`) if reviving it.
- Git commits need `git config user.email`/`user.name` set first in a fresh clone/sandbox.

## Known environment risks (Daniel's Mac specifically)
- **Xcode license trap**: command-line `git` shells out to `xcodebuild` for a license check. If it's reset (e.g. after a macOS/Xcode update), every git command hangs or fails with `Error: You have not agreed to the Xcode license`. Fix (needs admin): `sudo xcodebuild -license` → page through → type `agree`. If Daniel doesn't have admin rights, either ask IT to run that one command, or use GitHub Desktop as a fallback (bundles its own git, sidesteps Xcode). Diagnostic: `xcode-select -p` — if it points to `/Applications/Xcode.app/Contents/Developer` rather than a lightweight Command Line Tools path, this is likely the same issue recurring.
- The local repo lives inside a Box-synced folder tree, not a standard home-directory location: `~/Library/CloudStorage/Box-Box/Dan's desktop/Personal/Eminent Americans/group blog/order-of-things-clean-v2`.
- CDN cache lag: the live site can serve a stale version for a few minutes after a real successful deploy. Append a throwaway query string (`?cachebust=1`) to force a fresh fetch when checking whether a deploy landed, rather than assuming a hard refresh alone is enough (it bypasses the browser cache but not Cloudflare's edge cache).

## Tools & resources
- **Hosting**: Cloudflare Pages (auto-deploy from `main`); custom domains `orderofthings.blog` / `www.orderofthings.blog` added on top of the original `order-of-things.pages.dev`
- **CMS**: Sanity v3 (Studio embedded at `/studio`), project ID `awzmg645`, dataset `production`
- **Comments**: Giscus → GitHub Discussions (`djopps-boop/order-of-things`)
- **DNS/domain**: same Cloudflare account as the Pages project, so custom-domain setup auto-provisions DNS records
