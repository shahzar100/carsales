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
// ServiceTypeChart — donut chart for service type breakdown
// ═════════════════════════════════════════════════════════════

const COLOURS = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#ec4899",
  "#6366f1",
];

interface ServiceTypeChartProps {
  data: PieSlice[];
}

const ServiceTypeChart: React.FC<ServiceTypeChartProps> = ({ data }) => {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="mb-1 text-lg font-semibold text-gray-900">
        Service Types
      </h3>
      <p className="mb-4 text-sm text-gray-500">
        Breakdown of service bookings
      </p>

      {total === 0 ? (
        <div className="flex h-56 items-center justify-center text-sm text-gray-400">
          No service data yet
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
                  <Cell key={entry.name} fill={COLOURS[i % COLOURS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid #e5e7eb",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
                }}
                formatter={(value, name) => [
                  `${value} (${Math.round((Number(value) / total) * 100)}%)`,
                  `${name}`,
                ]}
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

export default ServiceTypeChart;
