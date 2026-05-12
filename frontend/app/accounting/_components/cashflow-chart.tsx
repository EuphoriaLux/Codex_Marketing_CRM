"use client";

import { useMemo } from "react";

export type CashflowPoint = {
  dateISO: string;
  balance: number;
};

type Props = {
  points: CashflowPoint[];
  width?: number;
  height?: number;
};

const PADDING = { top: 20, right: 16, bottom: 36, left: 64 };

const eurFmt = new Intl.NumberFormat("fr-LU", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const dayFmt = new Intl.DateTimeFormat("fr-LU", {
  day: "2-digit",
  month: "short",
});

export function CashflowChart({ points, width = 880, height = 260 }: Props) {
  const layout = useMemo(() => {
    if (points.length === 0) return null;

    const innerW = width - PADDING.left - PADDING.right;
    const innerH = height - PADDING.top - PADDING.bottom;

    const balances = points.map((p) => p.balance);
    const rawMax = Math.max(...balances, 0);
    const rawMin = Math.min(...balances, 0);
    const span = rawMax - rawMin || 1;
    const max = rawMax + span * 0.1;
    const min = rawMin - span * 0.1;

    const xAt = (i: number) =>
      PADDING.left + (i / Math.max(points.length - 1, 1)) * innerW;
    const yAt = (v: number) =>
      PADDING.top + ((max - v) / (max - min)) * innerH;

    const zeroY = yAt(0);

    const linePath = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${xAt(i)} ${yAt(p.balance)}`)
      .join(" ");

    const areaPath =
      `M ${xAt(0)} ${yAt(points[0].balance)} ` +
      points.slice(1).map((p, i) => `L ${xAt(i + 1)} ${yAt(p.balance)}`).join(" ") +
      ` L ${xAt(points.length - 1)} ${zeroY} L ${xAt(0)} ${zeroY} Z`;

    const ticksY = [max, (max + min) / 2, min, 0]
      .filter((v, i, arr) => arr.indexOf(v) === i)
      .sort((a, b) => b - a);

    const xLabelStep = Math.max(1, Math.floor(points.length / 6));
    const ticksX = points
      .map((p, i) => ({ p, i }))
      .filter(({ i }) => i % xLabelStep === 0 || i === points.length - 1);

    return {
      innerW,
      innerH,
      max,
      min,
      zeroY,
      xAt,
      yAt,
      linePath,
      areaPath,
      ticksY,
      ticksX,
    };
  }, [points, width, height]);

  if (!layout) {
    return (
      <p style={{ color: "var(--muted)", margin: 0 }}>
        Pas assez de données pour tracer la courbe.
      </p>
    );
  }

  const { zeroY, linePath, areaPath, ticksY, ticksX, xAt, yAt } = layout;

  return (
    <div className="cashflow-chart-wrap">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width="100%"
        height={height}
        role="img"
        aria-label="Projection de trésorerie sur 30 jours"
      >
        <defs>
          <clipPath id="cashflow-clip-positive">
            <rect
              x={0}
              y={0}
              width={width}
              height={Math.max(0, zeroY)}
            />
          </clipPath>
          <clipPath id="cashflow-clip-negative">
            <rect
              x={0}
              y={zeroY}
              width={width}
              height={Math.max(0, height - zeroY)}
            />
          </clipPath>
        </defs>

        {ticksY.map((v) => (
          <g key={v}>
            <line
              x1={PADDING.left}
              x2={width - PADDING.right}
              y1={yAt(v)}
              y2={yAt(v)}
              stroke="#e2e8f0"
              strokeDasharray={v === 0 ? "0" : "3 3"}
              strokeWidth={v === 0 ? 1.5 : 1}
            />
            <text
              x={PADDING.left - 8}
              y={yAt(v) + 4}
              fontSize="11"
              fill="#64748b"
              textAnchor="end"
            >
              {eurFmt.format(v)}
            </text>
          </g>
        ))}

        <path
          d={areaPath}
          fill="rgba(45, 107, 70, 0.18)"
          clipPath="url(#cashflow-clip-positive)"
        />
        <path
          d={areaPath}
          fill="rgba(163, 21, 21, 0.18)"
          clipPath="url(#cashflow-clip-negative)"
        />

        <path
          d={linePath}
          fill="none"
          stroke="#1e293b"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {ticksX.map(({ p, i }) => (
          <g key={p.dateISO}>
            <line
              x1={xAt(i)}
              x2={xAt(i)}
              y1={height - PADDING.bottom}
              y2={height - PADDING.bottom + 4}
              stroke="#94a3b8"
            />
            <text
              x={xAt(i)}
              y={height - PADDING.bottom + 18}
              fontSize="11"
              fill="#64748b"
              textAnchor="middle"
            >
              {dayFmt.format(new Date(p.dateISO))}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
