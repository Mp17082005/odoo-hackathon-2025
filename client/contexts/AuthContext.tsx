import { createContext, useContext, useEffect, useState } from "react";

export type UserRole = "guest" | "user" | "admin";

export interface User {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  reputation: number;
  role: UserRole;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    username: string,
    email: string,
    password: string,
  ) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  hasPermission: (action: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock users database
  const mockUsers: User[] = [
    {
      id: "1",
      username: "john_dev",
      email: "john@example.com",
      reputation: 1250,
      role: "user",
      createdAt: "2024-01-15T10:30:00Z",
    },
    {
      id: "2",
      username: "sarah_react",
      email: "sarah@example.com",
      reputation: 2840,
      role: "admin",
      createdAt: "2024-01-14T15:20:00Z",
    },
    {
      id: "3",
      username: "mike_backend",
      email: "mike@example.com",
      reputation: 890,
      role: "user",
      createdAt: "2024-01-13T09:45:00Z",
    },
  ];

  useEffect(() => {
    // Check for saved user session and validate token
    const token = localStorage.getItem("authToken");
    if (token) {
      // Validate token with server
      fetch("/api/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => {
          if (response.ok) {
            return response.json();
          }
          throw new Error("Invalid token");
        })
        .then((userData) => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem("authToken");
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      setUser(data.user);
      
      // Store token in localStorage
      localStorage.setItem("authToken", data.token);
      
      return true;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      setUser(data.user);
      
      // Store token in localStorage
      localStorage.setItem("authToken", data.token);
      
      return true;
    } catch (error) {
      console.error("Registration error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("authToken");
  };

  const hasPermission = (action: string): boolean => {
    if (!user) return false;

    switch (action) {
      case "post_question":
      case "post_answer":
      case "vote":
        return user.role === "user" || user.role === "admin";
      case "moderate":
      case "ban_users":
      case "download_reports":
        return user.role === "admin";
      default:
        return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        hasPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
