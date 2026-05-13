type ArcMeterProps = {
  pct: number;
  color?: string;
  size?: number;
  strokeWidth?: number;
};

export default function ArcMeter({ pct = 0, color = "var(--primary)", size = 72, strokeWidth = 5 }: ArcMeterProps) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const gap = circ * 0.28;
  const avail = circ - gap;
  const clampedPct = Math.min(Math.max(pct, 0), 1);
  const strokeDashoffset = (1 - clampedPct) * avail;
  const rotation = 90 + 360 * 0.14;

  return (
    <svg width={size} height={size} style={{ transform: `rotate(${rotation}deg)` }} aria-hidden="true">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="var(--surface3)"
        strokeWidth={strokeWidth}
        strokeDasharray={`${avail} ${gap}`}
        strokeDashoffset={0}
        strokeLinecap="round"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${avail} ${gap}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
}
