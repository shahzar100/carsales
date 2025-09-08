import React from "react";
import NavMenu from "./Dropdown/NavMenu";
import NavLink from "./Dropdown/NavLink";

const Header = () => {
  return (
    <nav className="flex justify-between items-center mx-auto max-w-7xl row-span-1 w-full p-4 sticky top-0 z-50 bg-white rounded-full">
      <h1> Title </h1>

      <NavMenu>
        <NavLink href="/BrowseFleet" text={"Browse Fleet"} />
        <NavLink href="/BookTestDrive" text={" Book Test Drive"} />
        <NavLink href="/Services" text={"Services"} />
        <NavLink href="/AboutUs" text={"About Us"} />
      </NavMenu>
    </nav>
  );
};

export default Header;
