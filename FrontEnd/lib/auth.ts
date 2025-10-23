import type { User } from "./types";

const users: User[] = [
  {
    id: "1",
    username: "admin",
    password: "TrustDigital2024!",
    name: "Administrator",
    role: "admin",
    createdAt: new Date().toISOString(),
  },
  {
    id: "2",
    username: "operator1",
    password: "Operator123!",
    name: "Operator 1",
    role: "operator",
    createdAt: new Date().toISOString(),
  },
];

export function validateUser(username: string, password: string): User | null {
  console.log("=== LOGIN VALIDATION ===");
  console.log("Input username:", username);
  console.log("Input password:", password);
  console.log(
    "Available users:",
    users.map((u) => ({
      username: u.username,
      password: u.password,
      role: u.role,
    }))
  );

  // Trim whitespace and ensure exact match
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();

  const user = users.find(
    (u) => u.username === trimmedUsername && u.password === trimmedPassword
  );

  console.log("Found user:", user ? `${user.username} (${user.role})` : "None");
  console.log("=== END VALIDATION ===");

  return user || null;
}

export function getAllUsers(): Omit<User, "password">[] {
  return users.map(({ password, ...user }) => user);
}

export function addUser(userData: Omit<User, "id" | "createdAt">): boolean {
  try {
    const newUser: User = {
      ...userData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    return true;
  } catch {
    return false;
  }
}

export function updateUserPassword(
  username: string,
  newPassword: string
): boolean {
  const userIndex = users.findIndex((u) => u.username === username);
  if (userIndex !== -1) {
    users[userIndex].password = newPassword;
    return true;
  }
  return false;
}

export function deleteUser(username: string): boolean {
  const userIndex = users.findIndex((u) => u.username === username);
  if (userIndex !== -1 && users[userIndex].username !== "admin") {
    users.splice(userIndex, 1);
    return true;
  }
  return false;
}

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("currentUser");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      localStorage.removeItem("currentUser");
    }
  }, []);

  const logout = () => {
    localStorage.removeItem("currentUser");
    router.push("/");
  };

  return { user, logout };
}
