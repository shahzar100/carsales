import React from "react";
import DropDownMenu from "./Dropdown/DropDownMenu";

const Header = () => {
  return (
    <nav className="flex justify-between items-center mx-auto max-w-5xl row-span-1 w-full p-4 sticky top-0 z-50 bg-black">
      <h1> Title </h1>

      <DropDownMenu />
    </nav>
  );
};

export default Header;
