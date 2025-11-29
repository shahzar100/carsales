import React from "react";
import Modal from "../Helpful/Buttons/Modal";
import Button from "../Helpful/Buttons/Button";

const AddCarModal = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  return (
    <div>
      <Button onClick={() => setIsOpen(true)} disabled={false}>
        Add Car
      </Button>

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
