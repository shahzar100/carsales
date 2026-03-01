"use client";

import { useEffect, useState } from "react";

export default function UpdatedAt() {
  const [time, setTime] = useState<string | null>(null);

  useEffect(() => {
    setTime(
      new Date().toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  }, []);

  if (!time) return null;

  return <span className="text-xs text-gray-400">Updated {time}</span>;
}
