import React from "react";

interface InfoBoxRow {
  label: string;
  value: string;
}

interface InfoBoxProps {
  rows: InfoBoxRow[];
}

const InfoBox: React.FC<InfoBoxProps> = ({ rows }) => {
  return (
    <div className="rounded-lg bg-gray-50 p-4">
      {rows.map((row, idx) => (
        <div
          key={idx}
          className={`flex justify-between ${idx > 0 ? "mt-2" : ""}`}
        >
          <span className="text-sm font-medium text-gray-700">{row.label}</span>
          <span className="text-sm text-gray-600">{row.value}</span>
        </div>
      ))}
    </div>
  );
};

export default InfoBox;
