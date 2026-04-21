"use client";

import Link from "next/link";
import { useRef, useState } from "react";

export type RoadmapWaypoint = {
  skillId: number;
  skillName: string;
  band: string;
  targetLevel: string;
  activityId: number | null;
  activityTitle: string | null;
  completed: boolean;
};

const PER_ROW = 5;
const ROW_HEIGHT = 170;
const PADDING_X = 70;
const PADDING_Y = 70;
const SVG_WIDTH = 900;
const NODE_RADIUS = 30;

function computePositions(count: number) {
  const positions: { x: number; y: number }[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / PER_ROW);
    const indexInRow = i % PER_ROW;
    const itemsInRow = Math.min(PER_ROW, count - row * PER_ROW);
    const usableWidth = SVG_WIDTH - PADDING_X * 2;
    const stepX = itemsInRow > 1 ? usableWidth / (itemsInRow - 1) : 0;
    const reversed = row % 2 === 1;
    const effectiveIndex = reversed ? itemsInRow - 1 - indexInRow : indexInRow;
    const x =
      itemsInRow === 1 ? SVG_WIDTH / 2 : PADDING_X + effectiveIndex * stepX;
    const y = PADDING_Y + row * ROW_HEIGHT;
    positions.push({ x, y });
  }
  return positions;
}

function buildPathD(positions: { x: number; y: number }[]): string {
  if (positions.length < 2) return "";
  return positions
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");
}

function truncate(s: string, max: number) {
  return s.length > max ? s.slice(0, max - 1).trimEnd() + "…" : s;
}

export function RecommendedRoadmap({
  waypoints,
}: {
  waypoints: RoadmapWaypoint[];
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  if (waypoints.length === 0) return null;

  const positions = computePositions(waypoints.length);
  const rows = Math.ceil(waypoints.length / PER_ROW);
  const svgHeight = PADDING_Y * 2 + (rows - 1) * ROW_HEIGHT;
  const pathD = buildPathD(positions);

  const openTooltip = (i: number) => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setActiveIndex(i);
  };

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setActiveIndex(null), 150);
  };

  return (
    <div>
      <div className="flex items-start gap-2 mb-3 text-sm text-gray-500">
        <svg
          className="w-4 h-4 text-asu-maroon flex-shrink-0 mt-0.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
        <span>
          We suggest starting at{" "}
          <span className="font-semibold text-gray-700">Stop 1</span> and moving
          along the dashed path — but jump in wherever grabs you. The order is a
          hint, not a requirement.
        </span>
      </div>

      <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 rounded-xl border border-gray-200 p-4 md:p-6">
        <div className="relative">
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
            className="w-full h-auto"
            role="img"
            aria-label={`Roadmap of ${waypoints.length} recommended ${
              waypoints.length === 1 ? "skill" : "skills"
            } to level up`}
          >
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke="#9ca3af"
                strokeWidth="3"
                strokeDasharray="6 10"
                strokeLinecap="round"
                opacity="0.55"
              />
            )}

            {waypoints.map((w, i) => {
              const pos = positions[i];
              const isActive = activeIndex === i;
              const fill = w.completed ? "#78BE20" : "#8C1D40";
              return (
                <g
                  key={w.skillId}
                  transform={`translate(${pos.x}, ${pos.y})`}
                  tabIndex={0}
                  role="button"
                  aria-label={`Stop ${i + 1} of ${waypoints.length}. Skill ${
                    w.skillId
                  }: ${w.skillName}. ${w.band}${
                    w.completed ? ". All activities complete." : "."
                  }`}
                  aria-expanded={isActive}
                  className="cursor-pointer focus:outline-none"
                  onMouseEnter={() => openTooltip(i)}
                  onMouseLeave={scheduleClose}
                  onFocus={() => openTooltip(i)}
                  onBlur={scheduleClose}
                  onClick={() =>
                    setActiveIndex(activeIndex === i ? null : i)
                  }
                >
                  {/* Soft halo, larger when active */}
                  <circle
                    r={NODE_RADIUS + (isActive ? 14 : 8)}
                    fill={fill}
                    opacity={isActive ? 0.18 : 0.08}
                    className="transition-all"
                  />
                  <circle
                    r={NODE_RADIUS}
                    fill="white"
                    stroke={fill}
                    strokeWidth="3"
                  />
                  <circle r={NODE_RADIUS - 8} fill={fill} />
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="white"
                    fontSize="18"
                    fontWeight="bold"
                    pointerEvents="none"
                  >
                    {w.completed ? "✓" : i + 1}
                  </text>
                  <text
                    y={NODE_RADIUS + 24}
                    textAnchor="middle"
                    fill="#374151"
                    fontSize="13"
                    fontWeight="600"
                    pointerEvents="none"
                  >
                    {truncate(w.skillName, 22)}
                  </text>
                </g>
              );
            })}

            {/* "Start" flag near the first waypoint */}
            {waypoints.length > 1 && (
              <g
                transform={`translate(${positions[0].x - 52}, ${
                  positions[0].y - 42
                })`}
                aria-hidden="true"
              >
                <rect
                  x="0"
                  y="0"
                  width="48"
                  height="20"
                  rx="4"
                  fill="#8C1D40"
                />
                <text
                  x="24"
                  y="11"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="white"
                  fontSize="10"
                  fontWeight="bold"
                  letterSpacing="0.05em"
                >
                  START
                </text>
                <path
                  d="M 12 20 L 6 28 L 18 28 Z"
                  fill="#8C1D40"
                  opacity="0.9"
                />
              </g>
            )}
          </svg>

          {activeIndex !== null &&
            (() => {
              const w = waypoints[activeIndex];
              const pos = positions[activeIndex];
              const xPct = (pos.x / SVG_WIDTH) * 100;
              const yPct = (pos.y / svgHeight) * 100;
              const alignRight = xPct > 55;
              return (
                <div
                  role="dialog"
                  aria-label={`${w.skillName} details`}
                  className="absolute z-10 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-64 max-w-[calc(100vw-2rem)]"
                  style={{
                    left: alignRight
                      ? `calc(${xPct}% - 17rem)`
                      : `calc(${xPct}% + 3rem)`,
                    top: `calc(${yPct}% - 2.5rem)`,
                  }}
                  onMouseEnter={() => openTooltip(activeIndex)}
                  onMouseLeave={scheduleClose}
                >
                  <p className="text-[10px] uppercase tracking-wider text-asu-maroon font-bold mb-1">
                    Stop {activeIndex + 1} · Reach {w.targetLevel}
                  </p>
                  <h4 className="text-sm font-bold text-gray-700 mb-2 leading-snug">
                    Skill {w.skillId}: {w.skillName}
                  </h4>
                  {w.completed ? (
                    <p className="text-xs text-green-700 font-medium">
                      You&apos;ve completed every activity at this band. Nice
                      work.
                    </p>
                  ) : w.activityTitle && w.activityId != null ? (
                    <>
                      <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                        <span className="font-semibold text-gray-700">
                          Next up:
                        </span>{" "}
                        {w.activityTitle}
                      </p>
                      <Link
                        href={`/activities/${w.activityId}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-asu-maroon hover:text-sidebar-hover"
                      >
                        Open activity
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                          />
                        </svg>
                      </Link>
                    </>
                  ) : (
                    <p className="text-xs text-gray-500">
                      No bridging activity available for this skill yet.
                    </p>
                  )}
                </div>
              );
            })()}
        </div>

        <div className="flex items-center justify-center gap-5 mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-asu-maroon" />
            To do
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full bg-asu-green" />
            Band complete
          </span>
          <span className="inline-flex items-center gap-1.5">
            <svg
              width="24"
              height="6"
              viewBox="0 0 24 6"
              className="text-gray-400"
              aria-hidden="true"
            >
              <line
                x1="2"
                y1="3"
                x2="22"
                y2="3"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="3 4"
                strokeLinecap="round"
              />
            </svg>
            Suggested order
          </span>
        </div>
      </div>
    </div>
  );
}
