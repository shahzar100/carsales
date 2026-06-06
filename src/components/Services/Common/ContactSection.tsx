import React from "react";
import Link from "next/link";

interface ContactAction {
  type: "email" | "phone" | "link";
  url: string;
  text: string;
  style: "primary" | "secondary" | "danger";
}

interface ContactSectionProps {
  title: string;
  subtitle: string;
  primaryActions: ContactAction[];
  secondaryActions?: ContactAction[];
  backgroundColor?: string;
  textColor?: string;
}

const getActionClasses = (style: string, isPrimary: boolean = true) => {
  const baseClasses =
    "rounded-lg px-8 py-3 font-medium transition-colors duration-200";

  switch (style) {
    case "primary":
      return `${baseClasses} ${isPrimary ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-700 text-white hover:bg-gray-600"}`;
    case "secondary":
      return `${baseClasses} border border-gray-600 bg-transparent text-white hover:bg-gray-800`;
    case "danger":
      return `${baseClasses} bg-red-700 text-white hover:bg-red-800`;
    default:
      return `${baseClasses} bg-gray-600 text-white hover:bg-gray-700`;
  }
};

const renderAction = (action: ContactAction, isPrimary: boolean = true) => {
  const classes = getActionClasses(action.style, isPrimary);

  if (action.type === "link") {
    return (
      <Link href={action.url} className={classes}>
        {action.text}
      </Link>
    );
  }

  return (
    <a href={action.url} className={classes}>
      {action.text}
    </a>
  );
};

const ContactSection: React.FC<ContactSectionProps> = ({
  title,
  subtitle,
  primaryActions,
  secondaryActions,
  backgroundColor = "bg-white",
  textColor = "text-gray-900",
}) => {
  return (
    <div className={`rounded-2xl ${backgroundColor} ${textColor} p-8 lg:p-12`}>
      <div className="mb-8 text-center">
        <h2 className="mb-4 text-3xl font-bold">{title}</h2>
        <p className="mx-auto max-w-2xl text-xl text-gray-300">{subtitle}</p>
      </div>

      <div className="mb-8 grid gap-8 md:grid-cols-2">
        {primaryActions.map((action) => (
          <div key={action.url} className="rounded-xl bg-gray-800 p-6">
            {renderAction(action, true)}
          </div>
        ))}
      </div>

      {secondaryActions && (
        <div className="text-center">
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            {secondaryActions.map((action) => (
              <div key={action.url}>{renderAction(action, false)}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactSection;
