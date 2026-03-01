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
import { PriceRangeData } from "./types";

// ═════════════════════════════════════════════════════════════
// PriceDistributionChart — horizontal bar chart for car prices
// ═════════════════════════════════════════════════════════════

interface PriceDistributionChartProps {
  data: PriceRangeData[];
}

const PriceDistributionChart: React.FC<PriceDistributionChartProps> = ({
  data,
}) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h3 className="mb-1 text-lg font-semibold text-gray-900">
      Price Distribution
    </h3>
    <p className="mb-6 text-sm text-gray-500">
      Number of cars in each price bracket
    </p>

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
            dataKey="range"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
            width={70}
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
            name="Cars"
            fill="#6366f1"
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default PriceDistributionChart;
