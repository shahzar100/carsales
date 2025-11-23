import { CheckCircle, XCircle } from "lucide-react";
import { Notification } from "./types";

interface NotificationComponentProps {
  notification: Notification;
}

export default function NotificationComponent({
  notification,
}: NotificationComponentProps) {
  return (
    <div
      className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        notification.type === "success" ? "bg-green-500" : "bg-red-500"
      } text-white`}
    >
      <div className="flex items-center gap-2">
        {notification.type === "success" ? (
          <CheckCircle className="w-5 h-5" />
        ) : (
          <XCircle className="w-5 h-5" />
        )}
        <span>{notification.message}</span>
      </div>
    </div>
  );
}
