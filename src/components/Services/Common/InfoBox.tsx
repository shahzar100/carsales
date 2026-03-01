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
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.03] p-4">
      {rows.map((row, idx) => (
        <div
          key={idx}
          className={`flex items-center justify-between ${
            idx > 0 ? "mt-2.5 border-t border-white/[0.06] pt-2.5" : ""
          }`}
        >
          <span className="text-xs font-medium tracking-wider text-gray-500 uppercase">
            {row.label}
          </span>
          <span className="text-sm font-semibold text-white">{row.value}</span>
        </div>
      ))}
    </div>
  );
};

export default InfoBox;
