/** Single-series body-weight line chart. Native <title> tooltips on generous hit targets. */
export function WeightChart({ points, units }: { points: { date: Date; value: number }[]; units: string }) {
  if (points.length < 2) return <p className="text-sm muted">Log your weight at least twice to see a trend.</p>;
  const W = 600, H = 180, P = { l: 36, r: 12, t: 12, b: 22 };
  const xs = points.map((p) => p.date.getTime());
  const ys = points.map((p) => p.value);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const pad = Math.max(1, (Math.max(...ys) - Math.min(...ys)) * 0.15);
  const [y0, y1] = [Math.floor(Math.min(...ys) - pad), Math.ceil(Math.max(...ys) + pad)];
  const x = (t: number) => P.l + ((t - x0) / (x1 - x0 || 1)) * (W - P.l - P.r);
  const y = (v: number) => P.t + (1 - (v - y0) / (y1 - y0 || 1)) * (H - P.t - P.b);
  const ticks = [y0, (y0 + y1) / 2, y1];
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(p.date.getTime()).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Body weight trend, latest ${last.value} ${units}`}>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="stroke-zinc-200 dark:stroke-zinc-800" strokeWidth={1} />
          <text x={P.l - 6} y={y(t) + 4} textAnchor="end" className="fill-zinc-500 text-[11px]">{Math.round(t * 10) / 10}</text>
        </g>
      ))}
      <text x={P.l} y={H - 4} className="fill-zinc-500 text-[11px]">{fmt(points[0].date)}</text>
      <text x={W - P.r} y={H - 4} textAnchor="end" className="fill-zinc-500 text-[11px]">{fmt(last.date)}</text>
      <path d={path} fill="none" className="stroke-brand-500" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(last.date.getTime())} cy={y(last.value)} r={4.5} className="fill-brand-500 stroke-white dark:stroke-zinc-900" strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={i} cx={x(p.date.getTime())} cy={y(p.value)} r={12} fill="transparent" className="cursor-pointer hover:fill-brand-500/15">
          <title>{`${fmt(p.date)}: ${p.value} ${units}`}</title>
        </circle>
      ))}
    </svg>
  );
}
