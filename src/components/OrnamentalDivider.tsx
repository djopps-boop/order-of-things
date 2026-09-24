// Resolves the other sidebar "Graphic — TBD" slot: a full-width hairline
// rule with a small open square centered on it, rather than stock art or a
// photo. Spans the sidebar's full width (unlike a fixed-size glyph) so it
// reads as a rule rather than a small illustration.
export default function OrnamentalDivider() {
  return (
    <div className="sidebar-mark-divider" aria-hidden="true">
      <svg
        width="100%"
        height="40"
        viewBox="0 0 300 40"
        preserveAspectRatio="none"
        fill="none"
      >
        <line x1="4" y1="20" x2="296" y2="20" className="sidebar-mark-rule" strokeWidth="1.5" />
        <rect x="138" y="8" width="24" height="24" className="sidebar-mark-square" strokeWidth="2" />
      </svg>
    </div>
  );
}
