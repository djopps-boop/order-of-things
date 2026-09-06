import { createClient } from "next-sanity";
import { projectId, dataset, apiVersion } from "./env";

// Not wired up to lib/posts.ts yet — that still runs on placeholder sample
// data. This client is ready for when native posts should be fetched from
// the real Sanity dataset instead.
export const client = createClient({
  projectId,
  dataset,
  apiVersion,
  useCdn: true,
});
