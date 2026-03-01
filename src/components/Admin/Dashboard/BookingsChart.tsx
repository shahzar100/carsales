"use client";
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MonthlyBookingData } from "./types";

// ═════════════════════════════════════════════════════════════
// BookingsChart — stacked bar chart (services vs viewings)
// ═════════════════════════════════════════════════════════════

interface BookingsChartProps {
  data: MonthlyBookingData[];
}

const BookingsChart: React.FC<BookingsChartProps> = ({ data }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h3 className="mb-1 text-lg font-semibold text-gray-900">
      Bookings Over Time
    </h3>
    <p className="mb-6 text-sm text-gray-500">Last 6 months</p>

    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: "#6b7280" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
            iconType="circle"
          />
          <Bar
            dataKey="services"
            name="Services"
            fill="#8b5cf6"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="viewings"
            name="Viewings"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default BookingsChart;
