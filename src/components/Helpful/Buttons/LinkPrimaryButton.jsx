import Link from "next/link";
import React from "react";
import Button from "./Button";

const LinkPrimaryButton = (props) => {
  return (
    <Link
      href={props.href}
      className={`${props.custom} rounded-md bg-red-600 hover:bg-red-700`}
    >
      <Button
        onClick={props.onClick ? props.onClick : null}
        custom={props.custom}
      >
        {props.text}
      </Button>
    </Link>
  );
};

export default LinkPrimaryButton;
