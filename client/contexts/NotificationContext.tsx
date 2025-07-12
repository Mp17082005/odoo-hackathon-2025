import { createContext, useContext, useState } from "react";

export interface Notification {
  id: string;
  type: "answer" | "comment" | "mention";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  questionId?: string;
  answerId?: string;
  fromUser?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, "id">) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined,
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "answer",
      title: "New answer to your question",
      message: "sarah_react answered your question about centering divs",
      isRead: false,
      createdAt: "2024-01-15T11:15:00Z",
      questionId: "1",
      fromUser: "sarah_react",
    },
    {
      id: "2",
      type: "mention",
      title: "You were mentioned",
      message: "@john_dev mentioned you in a comment",
      isRead: false,
      createdAt: "2024-01-15T10:45:00Z",
      answerId: "1",
      fromUser: "mike_backend",
    },
    {
      id: "3",
      type: "comment",
      title: "New comment on your answer",
      message: "Someone commented on your React state management answer",
      isRead: true,
      createdAt: "2024-01-14T16:30:00Z",
      answerId: "2",
      fromUser: "alex_dev",
    },
  ]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id
          ? { ...notification, isRead: true }
          : notification,
      ),
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((notification) => ({ ...notification, isRead: true })),
    );
  };

  const addNotification = (notificationData: Omit<Notification, "id">) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
    };
    setNotifications((prev) => [newNotification, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider",
    );
  }
  return context;
}
