// Placeholder values — no real Sanity project exists yet (Step 0 of the
// build plan: create a Sanity.io account). Falls back to placeholders
// rather than throwing, so the app and Studio still build without real
// credentials. Once a project exists, set these as real env vars
// (NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET) and the
// Studio at /studio will actually connect.
export const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "[SANITY_PROJECT_ID]";
export const dataset =
  process.env.NEXT_PUBLIC_SANITY_DATASET || "production";
export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2026-01-01";
