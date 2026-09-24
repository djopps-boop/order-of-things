import type { LayoutProps } from "sanity";
import { ContributorSessionBridge } from "./ContributorSessionBridge";

// Registered as studio.components.layout in sanity.config.ts purely to
// mount ContributorSessionBridge somewhere that runs on every Studio
// screen. Renders nothing of its own beyond that and otherwise defers
// completely to Studio's default layout.
export function StudioLayout(props: LayoutProps) {
  return (
    <>
      <ContributorSessionBridge />
      {props.renderDefault(props)}
    </>
  );
}
