import React from "react";

const Input = ({ type = "text", placeholder = "", value = "", ...props }) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => props.onChange(e)}
      className="h-10 rounded-md border p-4"
    />
  );
};

export default Input;
