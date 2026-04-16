"use client";

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface SkillPoint {
  skill: string;
  score: number;
  fullName: string;
}

interface Props {
  current: SkillPoint[];
  previous?: SkillPoint[];
}

export function SkillRadar({ current, previous }: Props) {
  if (current.length === 0) return null;

  // Merge data for both attempts
  const data = current.map((c, i) => ({
    skill: c.skill,
    fullName: c.fullName,
    current: c.score,
    previous: previous?.[i]?.score ?? 0,
  }));

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-1">
        Skill Radar
      </h3>
      <p className="text-xs text-gray-400 mb-4">
        {previous
          ? "Current attempt (maroon) vs. previous attempt (gold)"
          : "Your most recent skill levels"}
      </p>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid stroke="#e5e7eb" />
            <PolarAngleAxis
              dataKey="skill"
              tick={{ fontSize: 10, fill: "#747474" }}
            />
            <PolarRadiusAxis
              domain={[0, 3]}
              tickCount={4}
              tick={{ fontSize: 10, fill: "#aaa" }}
            />
            <Tooltip
              formatter={(value, name) => [
                `${value}/3`,
                name === "current" ? "Latest" : "Previous",
              ]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
              }}
            />
            {previous && (
              <Radar
                name="previous"
                dataKey="previous"
                stroke="#FFC627"
                fill="#FFC627"
                fillOpacity={0.15}
                strokeWidth={1.5}
              />
            )}
            <Radar
              name="current"
              dataKey="current"
              stroke="#8C1D40"
              fill="#8C1D40"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
