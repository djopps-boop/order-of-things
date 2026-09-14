import { defineConfig } from "sanity";
import { structureTool } from "sanity/structure";
import { visionTool } from "@sanity/vision";
import { schemaTypes } from "./src/sanity/schemaTypes";
import { projectId, dataset, apiVersion } from "./src/sanity/env";
import { TakeATurnAction } from "./src/sanity/actions/takeATurn";

// Embedded at /studio. Won't actually connect to anything until projectId
// and dataset are set to a real Sanity project (see src/sanity/env.ts) —
// but the Studio UI itself builds and runs fine with placeholders.
export default defineConfig({
  name: "default",
  title: "The Order of Things",
  projectId,
  dataset,
  basePath: "/studio",
  plugins: [structureTool(), visionTool({ defaultApiVersion: apiVersion })],
  schema: { types: schemaTypes },
  document: {
    // TakeATurnAction only ever renders itself on `post` documents (see its
    // own type check) -- registered for every type here rather than
    // filtered by schemaType so that check lives in exactly one place.
    actions: (prev) => [...prev, TakeATurnAction],
  },
});
