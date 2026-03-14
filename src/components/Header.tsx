import React from "react";
import NavMenu from "./Dropdown/NavMenu";
import NavLink from "./Dropdown/NavLink";
import Link from "next/link";
import Image from "next/image";
const Header = () => {
  return (
    <nav aria-label="Main navigation" className="sticky top-0 z-60 row-span-1 flex w-full items-center justify-between gap-2 bg-black p-4 shadow-md lg:px-6 lg:py-2">
      <Link
        className="rounded-full text-xl font-bold tracking-tight text-white"
        href="/"
      >
        <Image
          src="/logo.jpeg"
          alt="Business Logo"
          width={100}
          height={100}
          className="aspect-square h-16 w-16 sm:h-20 sm:w-20 lg:h-25 lg:w-25"
        />
      </Link>

      <NavMenu title="Menu">
        <NavLink dropdown={true} href="/BrowseFleet" text={"Browse Fleet"}>
          <div className="w-full">
            <p className="mb-4 text-[11px] font-semibold tracking-[0.05em] text-gray-400 uppercase">
              Brands
            </p>
            <div className="grid grid-cols-2 gap-1 text-sm">
              <NavLink href="/BrowseFleet/Toyota" text="Toyota" />
              <NavLink href="/BrowseFleet/Honda" text="Honda" />
              <NavLink href="/BrowseFleet/BMW" text="BMW" />
              <NavLink href="/BrowseFleet/Audi" text="Audi" />
            </div>
          </div>
        </NavLink>
        <NavLink dropdown={true} href="/Services" text={"Services"}>
          <div className="flex w-full flex-col space-y-2">
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
        <NavLink href="/Recoveries" text={"Breakdown Recovery"} />
        <NavLink href="/AccidentClaims" text={"Accident Claims"} />
        <NavLink href="/Booking/lookup" text={"Track Booking"} />
        <NavLink href="/AboutUs" text={"About Us"} />
      </NavMenu>
    </nav>
  );
};

export default Header;
