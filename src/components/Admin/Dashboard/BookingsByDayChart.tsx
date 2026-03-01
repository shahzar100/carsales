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
import { DayBookingData } from "./types";

// ═════════════════════════════════════════════════════════════
// BookingsByDayChart — bar chart showing appointments by day
// ═════════════════════════════════════════════════════════════

interface BookingsByDayChartProps {
  data: DayBookingData[];
}

const BookingsByDayChart: React.FC<BookingsByDayChartProps> = ({ data }) => (
  <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
    <h3 className="heading-3 mb-1">Bookings by Day</h3>
    <p className="mb-6 text-sm text-gray-500">Most popular appointment days</p>

    <div className="h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 5, right: 10, left: -10, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="day"
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
          <Bar
            dataKey="count"
            name="Bookings"
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default BookingsByDayChart;
