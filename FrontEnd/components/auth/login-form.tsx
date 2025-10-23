"use client";

import type React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Eye, EyeOff, Sparkles, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Image from "next/image";
// ❌ HAPUS IMPORT INI, KARENA KITA TIDAK BISA MEMANGGILNYA DARI CLIENT
// import { validateUser } from "@/lib/auth";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // ✅ FUNGSI INI KITA UBAH TOTAL
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Panggil API Route /api/login menggunakan fetch
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      // 2. Ambil data JSON dari respons
      const data = await response.json();

      // 3. Cek jika respons-nya sukses (status code 200-299)
      if (response.ok) {
        // `data` adalah objek ClientUser yang dikirim dari server
        // 4. ✅ Simpan data user ke localStorage DI SINI (Client-side)
        localStorage.setItem("currentUser", JSON.stringify(data));

        setError("");
        router.push("/dashboard");
      } else {
        // 5. Jika gagal (status 401, 500, dll), tampilkan error dari server
        setError(
          data.error ||
            "Username atau password salah. Silakan periksa kembali kredensial Anda."
        );
      }
    } catch (err) {
      console.error("Login fetch error:", err);
      setError("Terjadi kesalahan saat login. Silakan coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (userType: "admin" | "operator") => {
    if (userType === "admin") {
      setUsername("admin");
      setPassword("TrustDigital2024!");
    } else {
      setUsername("operator1");
      setPassword("Operator123!");
    }
    setError("");
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex justify-center mb-8">
        <div className="zenith-card p-4">
          <Image
            src="/images/trustdigital-logo.jpg"
            alt="TrustDigital.ID Logo"
            width={300}
            height={80}
            className="h-16 w-auto"
          />
        </div>
      </div>

      <Card className="zenith-card border-0 animate-slide-up">
        <CardContent className="pt-8 pb-8 px-8">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-zenith-primary mr-2" />
              <h1 className="text-3xl font-bold gradient-text">Admin Login</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Masuk ke sistem manajemen akun TrustDigital.ID
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive" className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-3">
              <Label
                htmlFor="username"
                className="text-base font-semibold text-gray-700"
              >
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username"
                className="zenith-input h-14 text-base"
                required
              />
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="password"
                className="text-base font-semibold text-gray-700"
              >
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="zenith-input h-14 text-base pr-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-10 w-10 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="zenith-button w-full h-14 text-base font-semibold"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Masuk...
                </>
              ) : (
                "Masuk"
              )}
            </Button>
          </form>

          <div className="mt-8 p-6 glass-morphism rounded-2xl">
            <h3 className="font-bold text-zenith-primary mb-4 text-center">
              🚀 Quick Login
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-white/30">
                <div className="text-sm">
                  <div className="font-semibold text-gray-800">👨‍💼 Admin</div>
                  <div className="text-gray-600">admin / TrustDigital2024!</div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => quickLogin("admin")}
                  className="bg-zenith-gradient text-white border-0 hover:shadow-zenith-hover"
                >
                  Use
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/60 rounded-xl border border-white/30">
                <div className="text-sm">
                  <div className="font-semibold text-gray-800">👨‍💻 Operator</div>
                  <div className="text-gray-600">operator1 / Operator123!</div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => quickLogin("operator")}
                  className="bg-zenith-gradient-purple text-white border-0 hover:shadow-zenith-hover"
                >
                  Use
                </Button>
              </div>
            </div>

            <p className="text-xs mt-4 text-center text-gray-600">
              💡 Klik "Use" untuk mengisi otomatis atau copy paste manual
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
