import { getArchiveIndex } from "@/lib/posts";

const WEEKS_SHOWN = 8;

// Resolves one of the sidebar's "Graphic — TBD" slots without needing any
// curated art: a tiny bar chart of post volume over recent weeks, built
// entirely from data already computed for the Date Archive widget below it.
// Doubles as a second, quieter "there's activity here" signal alongside
// Active Threads — this one about publishing rather than conversation.
export default async function ActivitySparkline() {
  const archive = await getArchiveIndex();
  const monthCounts = archive
    .flatMap((y) => y.months)
    .sort((a, b) => (a.year !== b.year ? a.year - b.year : a.month - b.month));

  // Archive data is monthly, not weekly — approximate recent activity by
  // taking the last few months and spreading each month's count evenly
  // across ~4.3 bars, which is plenty precise for a decorative sparkline.
  const bars: number[] = [];
  for (const m of monthCounts.slice(-3)) {
    for (let i = 0; i < 4; i++) bars.push(m.count / 4);
  }
  const recentBars = bars.slice(-WEEKS_SHOWN);
  const max = Math.max(1, ...recentBars);

  if (recentBars.every((b) => b === 0)) return null;

  return (
    <div className="sidebar-graphic-slot sidebar-sparkline" aria-hidden="true">
      {recentBars.map((value, i) => (
        <span
          key={i}
          className="sidebar-sparkline-bar"
          style={{ height: `${8 + (value / max) * 32}px` }}
        />
      ))}
    </div>
  );
}
