"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccounts, AccountType } from "@/contexts/account-context";
import { PlusCircle } from "lucide-react";

interface AccountFormProps {
  type: AccountType;
  onSuccess?: () => void; // <-- Tambahkan baris ini
}

export default function AccountForm({ type, onSuccess }: AccountFormProps) {
  // <-- Tambahkan `onSuccess` di sini
  const { addAccount } = useAccounts();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const profilePatterns = [
        { profile: "Profile A", pin: "1111" },
        { profile: "Profile B", pin: "2222" },
        { profile: "Profile C", pin: "3333" },
        { profile: "Profile D", pin: "4444" },
        { profile: "Profile E", pin: "5555" },
        { profile: "Profile F", pin: "6666" },
        { profile: "Profile G", pin: "7777" },
        { profile: "Profile H", pin: "8888" },
      ];

      const defaultCounts = { private: 8, sharing: 20, vvip: 5 };
      const count = defaultCounts[type] || 8;
      const profiles = [];

      for (let i = 0; i < count; i++) {
        const patternIndex = i % profilePatterns.length;
        profiles.push({
          ...profilePatterns[patternIndex],
          used: false,
        });
      }

      await addAccount({
        email,
        password,
        type,
        profiles,
      });

      setEmail("");
      setPassword("");
      onSuccess?.(); // <-- Panggil fungsi ini untuk menutup dialog
    } catch (error) {
      console.error("Error adding account:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // Form tidak lagi dibungkus Card karena sekarang ada di dalam Dialog
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <div className="space-y-2">
        <Label htmlFor={`${type}-email`}>Email</Label>
        <Input
          id={`${type}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter Netflix email"
          className="border-gray-300 focus-visible:ring-blue-500"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`${type}-password`}>Password</Label>
        <Input
          id={`${type}-password`}
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter Netflix password"
          className="border-gray-300 focus-visible:ring-blue-500"
          required
        />
      </div>
      <div className="pt-2">
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700"
          disabled={isLoading}
        >
          {isLoading
            ? "Adding..."
            : `Add ${type.charAt(0).toUpperCase() + type.slice(1)} Account`}
        </Button>
      </div>
    </form>
  );
}
