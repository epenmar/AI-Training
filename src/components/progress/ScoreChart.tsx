"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface AttemptPoint {
  date: string;
  score: number;
  band: string;
}

interface Props {
  attempts: AttemptPoint[];
}

const BAND_LINES = [
  { y: 14, label: "Foundational", color: "#00A3E0" },
  { y: 28, label: "Intermediate", color: "#78BE20" },
  { y: 35, label: "Advanced", color: "#FFC627" },
];

export function ScoreChart({ attempts }: Props) {
  if (attempts.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">
          No assessment attempts yet. Take your first assessment to start
          tracking progress.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-700 mb-4">
        Overall Score Over Time
      </h3>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={attempts} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12, fill: "#747474" }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 42]}
              tick={{ fontSize: 12, fill: "#747474" }}
              tickLine={false}
            />
            <Tooltip
              formatter={(value) => [`${value}/42`, "Score"]}
              labelStyle={{ color: "#191919" }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "14px",
              }}
            />
            {BAND_LINES.map((b) => (
              <ReferenceLine
                key={b.label}
                y={b.y}
                stroke={b.color}
                strokeDasharray="4 4"
                strokeOpacity={0.6}
                label={{
                  value: b.label,
                  position: "right",
                  fill: b.color,
                  fontSize: 11,
                }}
              />
            ))}
            <Line
              type="monotone"
              dataKey="score"
              stroke="#8C1D40"
              strokeWidth={2.5}
              dot={{ r: 5, fill: "#8C1D40" }}
              activeDot={{ r: 7, fill: "#FFC627", stroke: "#8C1D40", strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
