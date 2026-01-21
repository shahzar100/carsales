import React from "react";
import Modal from "@/components/Helpful/Buttons/Modal";
import Button from "@/components/Helpful/Buttons/Button";
import NavButton from "@/components/Dropdown/NavButton";

const AddAppointment = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div>
      <NavButton onClick={() => setIsOpen(true)} text={"Add Appointment"}>
        Add Appointment
      </NavButton>

      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <form className="flex flex-col gap-4">
            <Button onClick={() => {}} disabled={false}>
              Submit
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AddAppointment;
