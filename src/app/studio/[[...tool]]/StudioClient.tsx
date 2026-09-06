"use client";

// Loaded fully client-side (dynamic + ssr:false) rather than the more
// common server-wrapper pattern. The Studio's dependencies (via the
// "sanity" package) don't yet resolve cleanly under Next.js's newer
// server/client module-condition rules when touched from a Server
// Component — this sidesteps that by keeping the server out of the
// picture entirely for this route.
import dynamic from "next/dynamic";
import config from "../../../../sanity.config";

const NextStudio = dynamic(
  () => import("next-sanity/studio").then((m) => m.NextStudio),
  { ssr: false }
);

export default function StudioClient() {
  return <NextStudio config={config} />;
}
