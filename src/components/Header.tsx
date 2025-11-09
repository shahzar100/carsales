import React from "react";
import NavMenu from "./Dropdown/NavMenu";
import NavLink from "./Dropdown/NavLink";
import Link from "next/link";
const Header = () => {
  return (
    <nav className="flex gap-8 justify-between items-center mx-auto max-w-7xl row-span-1 w-full px-6 py-4 sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-sm rounded-full">
      <Link className="text-xl font-bold tracking-tight text-black" href="/">
        Title
      </Link>

      <NavMenu>
        <NavLink dropdown={true} href="/BrowseFleet" text={"Browse Fleet"}>
          <div className="w-full">
            <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">
              Brands
            </h3>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <NavLink href="/BrowseFleet/Toyota" text="Toyota" />
              <NavLink href="/BrowseFleet/Honda" text="Honda" />
              <NavLink href="/BrowseFleet/BMW" text="BMW" />
              <NavLink href="/BrowseFleet/Audi" text="Audi" />
            </div>
          </div>
        </NavLink>
        <NavLink dropdown={true} href="/Services" text={"Services"}>
          <div className="flex flex-col space-y-2 w-full">
            <NavLink
              href="/Services/Detailing"
              text={"Detailing"}
              dropdown={false}
            />
            <NavLink href="/Services/Tints" text={"Tints"} dropdown={false} />
            <NavLink
              href="/Services/Repairs"
              text={"Repairs"}
              dropdown={false}
            />
          </div>
        </NavLink>
        <NavLink href="/CarParts" text={"Car Parts"} />
        <NavLink href="/Recoveries" text={"Recoveries"} />
        <NavLink href="/AccidentClaims" text={"Accident Claims"} />
        <NavLink href="/Booking/lookup" text={"View Bookings"} />
        <NavLink href="/AboutUs" text={"About Us"} />
      </NavMenu>
    </nav>
  );
};

export default Header;
