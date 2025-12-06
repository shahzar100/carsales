import { CheckCircle, XCircle } from "lucide-react";
import { Notification } from "../../lib/types";

interface NotificationComponentProps {
  notification: Notification;
}

export default function NotificationComponent({
  notification,
}: NotificationComponentProps) {
  return (
    <div
      className={`fixed top-4 right-4 z-50 rounded-lg p-4 shadow-lg ${
        notification.type === "success" ? "bg-green-500" : "bg-red-500"
      } text-white`}
    >
      <div className="flex items-center gap-2">
        {notification.type === "success" ? (
          <CheckCircle className="h-5 w-5" />
        ) : (
          <XCircle className="h-5 w-5" />
        )}
        <span>{notification.message}</span>
      </div>
    </div>
  );
}
