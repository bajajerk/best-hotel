"use client";

import { useState, useMemo, useRef } from "react";
import { motion } from "framer-motion";

/* ────────────────────────── Types ────────────────────────── */

interface PriceTrendChartProps {
  ratesFrom: number;
  currency?: string;
  hotelId?: number;
}

interface DataPoint {
  date: string;
  label: string;
  price: number;
}

type TimeRange = "30d" | "90d" | "6m";

/* ────────────────────────── Helpers ────────────────────────── */

function formatCurrency(amount: number, currency?: string): string {
  const symbols: Record<string, string> = {
    USD: "$", EUR: "\u20AC", GBP: "\u00A3", INR: "\u20B9",
    JPY: "\u00A5", AUD: "A$", SGD: "S$", THB: "\u0E3F",
    AED: "AED ", MYR: "RM ", IDR: "Rp ", KRW: "\u20A9",
  };
  const sym = currency
    ? symbols[currency.toUpperCase()] || `${currency} `
    : "$";
  const rounded = Math.round(amount);
  const formatted =
    currency?.toUpperCase() === "INR"
      ? rounded.toLocaleString("en-IN")
      : rounded.toLocaleString("en-US");
  return `${sym}${formatted}`;
}

/** Deterministic pseudo-random based on seed */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function generatePriceData(
  basePrice: number,
  range: TimeRange,
  hotelId: number
): DataPoint[] {
  const days = range === "30d" ? 30 : range === "90d" ? 90 : 180;
  const now = new Date();
  const rand = seededRandom(hotelId + days);
  const points: DataPoint[] = [];

  // Generate realistic price fluctuations
  // Prices tend to be higher on weekends and during peak periods
  let currentPrice = basePrice * (1 + (rand() - 0.4) * 0.15);

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6;
    const month = date.getMonth();
    const isHighSeason = month >= 5 && month <= 8; // Jun–Aug

    // Random walk with mean reversion to base price
    const drift = (basePrice - currentPrice) * 0.05;
    const weekendPremium = isWeekend ? basePrice * 0.06 : 0;
    const seasonalPremium = isHighSeason ? basePrice * 0.08 : 0;
    const noise = (rand() - 0.5) * basePrice * 0.06;

    currentPrice = Math.max(
      basePrice * 0.75,
      Math.min(basePrice * 1.45, currentPrice + drift + noise)
    ) + weekendPremium + seasonalPremium;

    // Only add a subset of points for longer ranges
    const step = range === "30d" ? 1 : range === "90d" ? 3 : 6;
    if (i % step === 0) {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      points.push({
        date: date.toISOString().split("T")[0],
        label: `${monthNames[date.getMonth()]} ${date.getDate()}`,
        price: Math.round(currentPrice),
      });
    }
  }

  return points;
}

/* ────────────────────────── Chart Component ────────────────────────── */

export default function PriceTrendChart({
  ratesFrom,
  currency,
  hotelId = 1,
}: PriceTrendChartProps) {
  const [range, setRange] = useState<TimeRange>("30d");
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const data = useMemo(
    () => generatePriceData(ratesFrom, range, hotelId),
    [ratesFrom, range, hotelId]
  );

  const prices = data.map((d) => d.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Chart dimensions
  const W = 520;
  const H = 200;
  const PAD_LEFT = 0;
  const PAD_RIGHT = 0;
  const PAD_TOP = 20;
  const PAD_BOTTOM = 8;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOTTOM;

  // Map data to SVG coordinates
  const points = data.map((d, i) => ({
    x: PAD_LEFT + (i / (data.length - 1)) * chartW,
    y: PAD_TOP + chartH - ((d.price - minPrice) / priceRange) * chartH,
    ...d,
  }));

  // Build SVG path
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");

  // Gradient area path
  const areaPath = `${linePath} L${points[points.length - 1].x.toFixed(1)},${H} L${points[0].x.toFixed(1)},${H} Z`;

  // Current price is last point
  const currentPoint = points[points.length - 1];
  const lowestPoint = points.reduce((min, p) => (p.price < min.price ? p : min), points[0]);
  const highestPoint = points.reduce((max, p) => (p.price > max.price ? p : max), points[0]);

  // Price is currently at the base rate — show it as "today's rate"
  const todayPrice = ratesFrom;
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
  const belowAvg = todayPrice < avg;

  // Horizontal grid lines (3 lines)
  const gridLines = [0.25, 0.5, 0.75].map((frac) => ({
    y: PAD_TOP + chartH * (1 - frac),
    price: Math.round(minPrice + priceRange * frac),
  }));

  const rangeOptions: { key: TimeRange; label: string }[] = [
    { key: "30d", label: "30 days" },
    { key: "90d", label: "90 days" },
    { key: "6m", label: "6 months" },
  ];

  const hovered = hoveredIdx !== null ? points[hoveredIdx] : null;

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <div className="flex items-baseline gap-2">
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "22px",
                fontWeight: 400,
                color: "var(--ink)",
              }}
            >
              {formatCurrency(todayPrice, currency)}
            </span>
            <span style={{ fontSize: "12px", color: "var(--ink-light)" }}>
              today
            </span>
          </div>
          {belowAvg ? (
            <div className="flex items-center gap-1 mt-1">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--success)" }}>
                <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" />
                <polyline points="17 18 23 18 23 12" />
              </svg>
              <span style={{ fontSize: "12px", color: "var(--success)", fontWeight: 500 }}>
                Below average ({formatCurrency(avg, currency)} avg)
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-1">
              <span style={{ fontSize: "12px", color: "var(--ink-light)" }}>
                Avg: {formatCurrency(avg, currency)}
              </span>
            </div>
          )}
        </div>

        {/* Range toggle */}
        <div
          className="flex"
          style={{
            border: "1px solid var(--cream-border)",
            background: "var(--cream)",
          }}
        >
          {rangeOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { setRange(opt.key); setHoveredIdx(null); }}
              style={{
                padding: "6px 12px",
                fontSize: "11px",
                fontWeight: 500,
                letterSpacing: "0.04em",
                fontFamily: "var(--font-mono)",
                color: range === opt.key ? "var(--ink)" : "var(--ink-light)",
                background: range === opt.key ? "var(--white)" : "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <motion.div
        key={range}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{ position: "relative" }}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          width="100%"
          height="auto"
          style={{ overflow: "visible", display: "block" }}
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id={`priceFill-${hotelId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--gold)" stopOpacity="0.15" />
              <stop offset="100%" stopColor="var(--gold)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {gridLines.map((gl, i) => (
            <g key={i}>
              <line
                x1={PAD_LEFT}
                y1={gl.y}
                x2={W - PAD_RIGHT}
                y2={gl.y}
                stroke="var(--cream-border)"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
              <text
                x={W - PAD_RIGHT}
                y={gl.y - 4}
                textAnchor="end"
                style={{
                  fontSize: "9px",
                  fill: "var(--ink-light)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {formatCurrency(gl.price, currency)}
              </text>
            </g>
          ))}

          {/* Gradient fill */}
          <motion.path
            d={areaPath}
            fill={`url(#priceFill-${hotelId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          />

          {/* Price line */}
          <motion.path
            d={linePath}
            fill="none"
            stroke="var(--gold)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />

          {/* Current price dot */}
          <motion.circle
            cx={currentPoint.x}
            cy={currentPoint.y}
            r="4"
            fill="var(--gold)"
            stroke="var(--white)"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 1, duration: 0.3 }}
          />

          {/* Lowest price marker */}
          {lowestPoint !== currentPoint && (
            <motion.circle
              cx={lowestPoint.x}
              cy={lowestPoint.y}
              r="3"
              fill="var(--success)"
              stroke="var(--white)"
              strokeWidth="1.5"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 1.1, duration: 0.3 }}
            />
          )}

          {/* Hover interaction zones */}
          {points.map((p, i) => (
            <rect
              key={i}
              x={p.x - chartW / data.length / 2}
              y={0}
              width={chartW / data.length}
              height={H}
              fill="transparent"
              onMouseEnter={() => setHoveredIdx(i)}
              style={{ cursor: "crosshair" }}
            />
          ))}

          {/* Hover indicator */}
          {hovered && (
            <g>
              <line
                x1={hovered.x}
                y1={PAD_TOP}
                x2={hovered.x}
                y2={H - PAD_BOTTOM}
                stroke="var(--ink-light)"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.4"
              />
              <circle
                cx={hovered.x}
                cy={hovered.y}
                r="5"
                fill="var(--gold)"
                stroke="var(--white)"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Hover tooltip */}
        {hovered && (
          <div
            style={{
              position: "absolute",
              left: `${(hovered.x / W) * 100}%`,
              top: "-8px",
              transform: "translateX(-50%)",
              background: "var(--ink)",
              color: "var(--cream)",
              padding: "6px 10px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              whiteSpace: "nowrap",
              pointerEvents: "none",
              zIndex: 10,
            }}
          >
            <div style={{ fontWeight: 600 }}>
              {formatCurrency(hovered.price, currency)}
            </div>
            <div style={{ opacity: 0.7, fontSize: "10px" }}>{hovered.label}</div>
          </div>
        )}
      </motion.div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-1" style={{ padding: `0 ${PAD_LEFT}px` }}>
        {(() => {
          const labelCount = 5;
          const step = Math.max(1, Math.floor((data.length - 1) / (labelCount - 1)));
          const indices: number[] = [];
          for (let i = 0; i < data.length; i += step) indices.push(i);
          if (indices[indices.length - 1] !== data.length - 1) indices.push(data.length - 1);
          return indices.map((idx) => (
            <span
              key={idx}
              style={{
                fontSize: "9px",
                color: "var(--ink-light)",
                fontFamily: "var(--font-mono)",
              }}
            >
              {data[idx].label}
            </span>
          ));
        })()}
      </div>

      {/* Summary stats */}
      <div
        className="grid grid-cols-3 gap-px mt-4"
        style={{ background: "var(--cream-border)" }}
      >
        <div className="text-center py-3" style={{ background: "var(--cream)" }}>
          <div
            style={{
              fontSize: "10px",
              color: "var(--ink-light)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
              marginBottom: "4px",
            }}
          >
            Low
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--success)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {formatCurrency(minPrice, currency)}
          </div>
        </div>
        <div className="text-center py-3" style={{ background: "var(--cream)" }}>
          <div
            style={{
              fontSize: "10px",
              color: "var(--ink-light)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
              marginBottom: "4px",
            }}
          >
            Average
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--ink-mid)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {formatCurrency(avg, currency)}
          </div>
        </div>
        <div className="text-center py-3" style={{ background: "var(--cream)" }}>
          <div
            style={{
              fontSize: "10px",
              color: "var(--ink-light)",
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              fontFamily: "var(--font-mono)",
              marginBottom: "4px",
            }}
          >
            High
          </div>
          <div
            style={{
              fontSize: "14px",
              fontWeight: 500,
              color: "var(--market-rate)",
              fontFamily: "var(--font-mono)",
            }}
          >
            {formatCurrency(maxPrice, currency)}
          </div>
        </div>
      </div>
    </div>
  );
}
