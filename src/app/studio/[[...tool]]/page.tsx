import StudioClient from "./StudioClient";

// Static export only needs the root /studio path prerendered — Sanity
// Studio's own client-side router takes over from there once the shell has
// loaded, so deep /studio/* paths aren't reachable via direct navigation on
// a static host, only by clicking through the app itself. This route stays
// a plain server component so it can export generateStaticParams; the
// actual Studio UI lives in the client-only StudioClient component.
export function generateStaticParams() {
  return [{ tool: [] }];
}

export default function StudioPage() {
  return <StudioClient />;
}
