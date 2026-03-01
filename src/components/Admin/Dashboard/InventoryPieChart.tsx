"use client";
import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PieSlice } from "./types";

// ═════════════════════════════════════════════════════════════
// InventoryPieChart — donut chart for inventory breakdown
// ═════════════════════════════════════════════════════════════

const DEFAULT_COLOURS = [
  "#dc2626",
  "#10b981",
  "#f59e0b",
  "#1f2937",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#991b1b",
];

interface InventoryPieChartProps {
  data: PieSlice[];
  title: string;
  subtitle?: string;
}

const InventoryPieChart: React.FC<InventoryPieChartProps> = ({
  data,
  title,
  subtitle,
}) => {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="heading-3 mb-1">{title}</h3>
      {subtitle && <p className="mb-4 text-sm text-gray-500">{subtitle}</p>}

      {total === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-gray-400">
          No data available
        </div>
      ) : (
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                strokeWidth={2}
                stroke="#fff"
              >
                {data.map((entry, i) => (
                  <Cell
                    key={entry.name}
                    fill={
                      entry.colour ||
                      DEFAULT_COLOURS[i % DEFAULT_COLOURS.length]
                    }
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
                }}
                formatter={(value) => [`${value}`, ""]}
              />
              <Legend
                wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default InventoryPieChart;
