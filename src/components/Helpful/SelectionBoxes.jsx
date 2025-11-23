import React, { useState } from "react";
import { useFilters } from "@/store/FilterContext";

const SelectionBoxes = ({ options, type }) => {
  const { state, dispatch } = useFilters(); // Get the filter state and dispatch function from the filter context
  const [menu, setMenu] = useState(false);

  const handleChange = (option) => {
    // Toggle the selected option in the Brand filter
    dispatch({
      type: "TOGGLE_FILTER",
      payload: { filterType: type, option: option },
    });
  };

  return (
    <div className="relative">
      <button
        className={`w-full py-4 ${menu ? "bg-blue-600" : "bg-blue-500"}`}
        onClick={() => setMenu(!menu)}
      >
        {" "}
        {type}{" "}
      </button>

      {menu && (
        <div className="absolute h-screen w-full">
          <div className="flex h-1/2 flex-col gap-4 border-4 bg-yellow-500 py-10">
            {options &&
              options.map((option) => (
                <button
                  onClick={() => {
                    handleChange(option);
                    setMenu(false);
                  }}
                  className="hover:text-blue-500"
                >
                  {option}
                </button>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SelectionBoxes;
