import React from "react";
import Modal from "@/components/Helpful/Buttons/Modal";
import Button from "@/components/Helpful/Buttons/Button";
import NavButton from "@/components/Dropdown/NavButton";

const AddCarModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div>
      <NavButton onClick={() => setIsOpen(true)} text={"Add Car"}>
        Add Car
      </NavButton>

      {isOpen && (
        <Modal onClose={() => setIsOpen(false)}>
          <form className="flex flex-col gap-4">
            <label className="flex flex-col">
              Make:
              <input type="text" name="make" className="border p-2" />
            </label>
            <label className="flex flex-col">
              Model:
              <input type="text" name="model" className="border p-2" />
            </label>
            <label className="flex flex-col">
              Year:
              <input type="number" name="year" className="border p-2" />
            </label>
            <label className="flex flex-col">
              Price:
              <input type="number" name="price" className="border p-2" />
            </label>
            <Button onClick={() => {}} disabled={false}>
              Submit
            </Button>
          </form>
        </Modal>
      )}
    </div>
  );
};

export default AddCarModal;
