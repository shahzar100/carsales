import NavButton from "@/components/Dropdown/NavButton";
import NavLink from "@/components/Dropdown/NavLink";
import { CarInterface } from "@/lib/interfaces";
import React from "react";

const CarActions = ({ car }: { car: CarInterface }) => {
  return (
    <div>
      <NavButton text={"Actions"} dropdown={true}>
        <NavLink text={"Edit Car"} href={`/admin/car/edit/${car._id}`} />
        <NavLink text={"View Car"} href={`/admin/car/view/${car._id}`} />
        <NavButton text={"Delete Car"} />
      </NavButton>
    </div>
  );
};

export default CarActions;
