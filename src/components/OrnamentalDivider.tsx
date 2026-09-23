// Resolves the other sidebar "Graphic — TBD" slot: a small line-art sprig
// resting on a hairline rule, rather than stock art or a photo, matching a
// literary/editorial site's tone without needing any asset curation or
// upkeep. Flush on the page background rather than boxed, unlike the
// ActivitySparkline widget below it.
export default function OrnamentalDivider() {
  return (
    <div className="sidebar-sprig-divider" aria-hidden="true">
      <svg width="130" height="20" viewBox="0 0 130 20" fill="none" strokeLinecap="round">
        <line x1="4" y1="10" x2="126" y2="10" className="sidebar-sprig-rule" strokeWidth="1" />
        <path d="M65 10 L65 3" className="sidebar-sprig-stem" strokeWidth="1.3" />
        <path d="M65 6 Q58 2 54 6" className="sidebar-sprig-stem" strokeWidth="1.3" />
        <path d="M65 6 Q72 2 76 6" className="sidebar-sprig-stem" strokeWidth="1.3" />
        <circle cx="65" cy="10" r="2.2" className="sidebar-sprig-bud" />
      </svg>
    </div>
  );
}
