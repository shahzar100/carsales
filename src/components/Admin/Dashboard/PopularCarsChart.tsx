"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { PopularCarData } from "./types";

// ═════════════════════════════════════════════════════════════
// PopularCarsChart — horizontal bar of most-viewed vehicles
// ═════════════════════════════════════════════════════════════

interface PopularCarsChartProps {
  data: PopularCarData[];
}

const PopularCarsChart: React.FC<PopularCarsChartProps> = ({ data }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h3 className="mb-1 text-lg font-semibold text-gray-900">
      Most Viewed Cars
    </h3>
    <p className="mb-6 text-sm text-gray-500">
      Top vehicles by viewing bookings
    </p>

    {data.length === 0 ? (
      <div className="flex h-56 items-center justify-center text-sm text-gray-400">
        No viewing data yet
      </div>
    ) : (
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 5, right: 20, left: 10, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
              horizontal={false}
            />
            <XAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 12, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="label"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              width={130}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
              }}
            />
            <Bar
              dataKey="count"
              name="Viewings"
              fill="#f59e0b"
              radius={[0, 4, 4, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    )}
  </div>
);

export default PopularCarsChart;
