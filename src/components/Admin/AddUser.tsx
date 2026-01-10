import React from "react";
import Button from "../Helpful/Buttons/Button";
import Modal from "../Helpful/Buttons/Modal";
import Input from "../Helpful/Input";

const AddUser = () => {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [username, setUsername] = React.useState("");

  return (
    <div>
      <Button onClick={() => setIsModalOpen(true)} disabled={false}>
        Add User
      </Button>

      {isModalOpen && (
        <Modal title="Add New User" onClose={() => setIsModalOpen(false)}>
          <Input
            type="text"
            placeholder="username"
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUsername(e.target.value)
            }
          />
        </Modal>
      )}
    </div>
  );
};

export default AddUser;
