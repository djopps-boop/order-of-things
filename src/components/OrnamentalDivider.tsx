// Resolves the other sidebar "Graphic — TBD" slot: a small serif ornament
// rather than stock art or a photo, matching a literary/editorial site's
// tone without needing any asset curation or upkeep.
export default function OrnamentalDivider() {
  return (
    <div className="sidebar-graphic-slot sidebar-ornament" aria-hidden="true">
      <span>❦</span>
    </div>
  );
}
