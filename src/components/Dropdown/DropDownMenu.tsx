"use client";
import { Menu, X } from "lucide-react";
import React, { useState } from "react";

const DropDownMenu = () => {
  const [menu, setMenu] = useState(false);

  return (
    <div>
      <button onClick={() => setMenu(!menu)} className="cursor-pointer ">
        <Menu size={24} />
      </button>

      {menu && (
        <div className="fixed top-0 right-0 w-1/3 h-screen overflow-hidden z-40 bg-black border">
          <div className="flex justify-between items-center p-4">
            <h2> Title </h2>
            <button onClick={() => setMenu(false)}>
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DropDownMenu;
