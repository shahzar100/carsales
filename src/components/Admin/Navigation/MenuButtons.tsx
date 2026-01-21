import React from "react";
import AddUser from "@/components/Admin/Modals/AddUser";
import AddCarModal from "@/components/Admin/Modals/CarModal";
import AddAppointment from "@/components/Admin/Modals/AddAppointment";
import NavButton from "@/components/Dropdown/NavButton";

const DashboardMenuButtons = () => {
  return (
    <NavButton text={"Actions"} dropdown={true}>
      <AddUser />
      <AddCarModal />
      <AddAppointment />
    </NavButton>
  );
};

export default DashboardMenuButtons;
