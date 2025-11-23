import Link from "next/link";
import React from "react";
import PrimaryButton from "./PrimaryButton";

const LinkPrimaryButton = (props) => {
  return (
    <Link
      href={props.href}
      className={`${props.custom} bg-blue-600 hover:bg-blue-700`}
    >
      <PrimaryButton
        text={props.text}
        onClick={props.onClick ? props.onClick : null}
        custom={props.custom}
      />
    </Link>
  );
};

export default LinkPrimaryButton;
