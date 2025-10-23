"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAccounts } from "@/contexts/account-context";
import { type AccountType } from "@/lib/database-service"; // Pastikan impor ini benar
import { AlertCircle, Info, Package } from "lucide-react"; // Hapus Shield jika tidak dipakai lagi
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
// Hapus impor Calendar jika tidak dipakai lagi
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Hapus impor date-fns dan cn jika tidak dipakai lagi di sini

export default function BulkImport() {
  const { toast } = useToast();
  // Hapus addGaransiAccounts dari destrukturisasi
  const { addAccounts, addAccountsWithCustomProfiles } = useAccounts();
  const [emails, setEmails] = useState("");
  const [password, setPassword] = useState(""); // Password utama jika mode email_password DAN input hanya email
  const [accountType, setAccountType] = useState<AccountType>("private");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [customProfileMode, setCustomProfileMode] = useState(false);
  const [profileCount, setProfileCount] = useState<number>(8);
  const [sharedPassword, setSharedPassword] = useState(""); // Password untuk mode email_only
  const [inputMode, setInputMode] = useState<"email_password" | "email_only">(
    "email_password"
  ); // State untuk mode input

  const getDefaultProfileCount = (type: AccountType) => {
    if (type === "private") return 8;
    if (type === "sharing") return 20;
    if (type === "vvip") return 5; // Pastikan ini 'vvip' bukan 'vip'
    return 8; // Default fallback
  };

  const getMaxProfileCount = (type: AccountType) => {
    if (type === "private") return 8;
    if (type === "sharing") return 20;
    if (type === "vvip") return 5; // Pastikan ini 'vvip' bukan 'vip'
    return 8; // Default fallback
  };

  const handleAccountTypeChange = (type: AccountType) => {
    setAccountType(type);
    if (!customProfileMode) {
      setProfileCount(getDefaultProfileCount(type));
    }
  };

  const handleCustomProfileToggle = (enabled: boolean) => {
    setCustomProfileMode(enabled);
    if (!enabled) {
      setProfileCount(getDefaultProfileCount(accountType));
    }
  };

  // Hapus fungsi handleWarrantyModeToggle

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // 1. Parsing Input Email
      const emailList = emails
        .split("\n")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      // 2. Validasi Input Dasar
      if (emailList.length === 0) {
        throw new Error("Masukkan setidaknya satu alamat email.");
      }
      // Validasi password dipindah ke bawah

      // 3. Validasi Custom Profile Count (jika aktif)
      if (
        customProfileMode &&
        (profileCount < 1 || profileCount > getMaxProfileCount(accountType))
      ) {
        throw new Error(
          `Jumlah profile harus antara 1 dan ${getMaxProfileCount(
            accountType
          )} untuk akun ${accountType}.`
        );
      }

      // 4. Mempersiapkan Data Akun (sesuai mode input)
      const accountsToAdd: {
        email: string;
        password: string;
        type: AccountType;
      }[] = [];
      let parseError = false;

      // Tentukan password final berdasarkan mode input
      const finalPassword =
        inputMode === "email_only" ? sharedPassword.trim() : password.trim(); // Password utama tidak dipakai jika email:password

      // Validasi password wajib ada (baik shared atau dari input utama jika email:password)
      if (inputMode === "email_only" && !finalPassword) {
        throw new Error(
          "Masukkan shared password untuk mode input email saja."
        );
      }
      // Untuk mode email:password, password per baris yang divalidasi
      // if (inputMode === 'email_password' && !finalPassword) { // Ini tidak perlu lagi
      //    throw new Error("Masukkan password utama jika menggunakan format email:password.");
      // }

      emailList.forEach((line) => {
        let email = "";
        let linePassword = ""; // Default kosong, akan diisi

        if (inputMode === "email_password") {
          const parts = line.split(/[:\s,;\t]+/); // Pemisah lebih fleksibel
          if (parts.length >= 2 && parts[0].includes("@")) {
            email = parts[0].trim();
            linePassword = parts[1].trim(); // Ambil password dari baris
            if (!linePassword) {
              // Validasi password per baris
              setError(`Password kosong di baris: "${line}".`);
              parseError = true;
              return;
            }
          } else {
            setError(
              `Format salah di baris: "${line}". Harusnya email:password`
            );
            parseError = true;
            return;
          }
        } else {
          // email_only mode
          if (line.includes("@")) {
            email = line.trim();
            linePassword = finalPassword; // Gunakan shared password
          } else {
            setError(`Format email salah di baris: "${line}"`);
            parseError = true;
            return;
          }
        }

        if (email && linePassword && !parseError) {
          accountsToAdd.push({
            email,
            password: linePassword,
            type: accountType,
          });
        }
      });

      if (parseError) {
        setIsLoading(false);
        return;
      }

      if (accountsToAdd.length === 0) {
        setError("Tidak ada akun valid yang bisa ditambahkan.");
        setIsLoading(false);
        return;
      }

      // 5. Memanggil Fungsi Context (Hanya Mode Normal)
      if (customProfileMode) {
        const accountsWithCustomProfiles = accountsToAdd.map((acc) => ({
          ...acc,
          profileCount,
        }));
        await addAccountsWithCustomProfiles(accountsWithCustomProfiles);
      } else {
        await addAccounts(accountsToAdd);
      }

      // 6. Tampilkan Pesan Sukses
      toast({
        title: "✅ Import Berhasil!",
        description: `Berhasil mengimpor ${accountsToAdd.length} akun ${accountType} ke Stok Utama.`,
        duration: 5000,
      });

      // 7. Reset Form
      setEmails("");
      setPassword("");
      setSharedPassword("");
      setCustomProfileMode(false);
      setProfileCount(getDefaultProfileCount(accountType));
      setError("");
    } catch (error) {
      // 8. Tangani Error
      setError(
        error instanceof Error ? error.message : "Gagal mengimpor akun."
      );
      toast({
        title: "❌ Gagal Import",
        description:
          error instanceof Error
            ? error.message
            : "Terjadi kesalahan saat impor.",
        variant: "destructive",
      });
    } finally {
      // 9. Set Loading Selesai
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Hapus Seleksi Mode Garansi */}

        {/* Custom Profile Mode (Tetap ada) */}
        <div className="zenith-card p-6 border-0">
          <div className="flex items-center space-x-3 mb-4">
            <input
              type="checkbox"
              id="custom-profile-mode"
              checked={customProfileMode}
              onChange={(e) => handleCustomProfileToggle(e.target.checked)}
              className="rounded border-gray-300 w-5 h-5"
            />
            <Label
              htmlFor="custom-profile-mode"
              className="font-bold text-zenith-primary flex items-center"
            >
              <Package className="h-5 w-5 mr-2" />
              🎯 Custom Profile Count
            </Label>
          </div>
          {customProfileMode && (
            <Alert className="bg-green-50 border-green-200">
              <Info className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Custom Profile:</strong> Atur jumlah profile per akun
                secara manual.{" "}
                <strong className="text-green-600">
                  Akun akan masuk ke stok utama.
                </strong>
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Hapus Warranty Date Picker */}

        {/* Pilihan Tipe Akun */}
        <div className="space-y-3">
          <Label
            htmlFor="account-type"
            className="text-base font-semibold text-gray-700"
          >
            Account Type
          </Label>
          <RadioGroup
            defaultValue="private"
            value={accountType}
            onValueChange={(value) =>
              handleAccountTypeChange(value as AccountType)
            }
            className="flex flex-wrap gap-x-6 gap-y-2" // flex-wrap untuk responsif
          >
            {/* Private */}
            <div className="flex items-center space-x-3">
              <RadioGroupItem
                value="private"
                id="private"
                className="w-5 h-5"
              />
              <Label htmlFor="private" className="text-base">
                Private (
                {customProfileMode
                  ? `Custom: ${profileCount}`
                  : `${getDefaultProfileCount("private")}`}{" "}
                profiles)
              </Label>
            </div>
            {/* Sharing */}
            <div className="flex items-center space-x-3">
              <RadioGroupItem
                value="sharing"
                id="sharing"
                className="w-5 h-5"
              />
              <Label htmlFor="sharing" className="text-base">
                Sharing (
                {customProfileMode
                  ? `Custom: ${profileCount}`
                  : `${getDefaultProfileCount("sharing")}`}{" "}
                profiles)
              </Label>
            </div>
            {/* VVIP */}
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="vvip" id="vvip" className="w-5 h-5" />
              <Label htmlFor="vvip" className="text-base">
                VVIP (
                {customProfileMode
                  ? `Custom: ${profileCount}`
                  : `${getDefaultProfileCount("vvip")}`}{" "}
                profiles)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Opsi Mode Input */}
        <div className="space-y-2">
          <Label className="font-semibold">Mode Input Akun</Label>
          <div className="flex flex-wrap gap-2">
            {" "}
            {/* flex-wrap untuk responsif */}
            <Button
              type="button"
              size="sm"
              variant={inputMode === "email_password" ? "default" : "outline"}
              onClick={() => setInputMode("email_password")}
            >
              Email:Password per Baris
            </Button>
            <Button
              type="button"
              size="sm"
              variant={inputMode === "email_only" ? "default" : "outline"}
              onClick={() => setInputMode("email_only")}
            >
              Email per Baris + Shared Password
            </Button>
          </div>
        </div>

        {/* Input Akun */}
        <div className="space-y-3">
          <Label
            htmlFor="emails"
            className="text-base font-semibold text-gray-700"
          >
            {inputMode === "email_password"
              ? "Data Akun (Email:Password per baris)"
              : "Email Akun (Satu email per baris)"}
          </Label>
          <Textarea
            id="emails"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder={
              inputMode === "email_password"
                ? "contoh@email.com:password123\ncontohlain@email.com:passlain456"
                : "contoh@email.com\ncontohlain@email.com"
            }
            className="min-h-[150px] zenith-input"
            required
          />
          <p className="text-sm text-gray-500">
            {inputMode === "email_password"
              ? "Pisahkan email dan password dengan titik dua (:), spasi, koma, atau tab."
              : "Masukkan satu alamat email per baris."}
          </p>
        </div>

        {/* Input Shared Password (muncul jika mode email_only) */}
        {inputMode === "email_only" && (
          <div className="space-y-3">
            <Label
              htmlFor="shared-password"
              className="text-base font-semibold text-gray-700"
            >
              Shared Password (untuk semua email di atas)
            </Label>
            <Input
              id="shared-password"
              type="text"
              value={sharedPassword}
              onChange={(e) => setSharedPassword(e.target.value)}
              placeholder="Enter shared password"
              className="zenith-input h-14"
              required={inputMode === "email_only"}
            />
          </div>
        )}

        {/* Input Password Utama (muncul jika mode email:password, opsional jika password sudah di baris) */}
        {/* Sepertinya input password utama ini tidak diperlukan lagi jika password bisa ditaruh per baris */}
        {/* Jika masih diperlukan, uncomment blok ini: */}
        {/* {inputMode === "email_password" && (
             <div className="space-y-3">
               <Label htmlFor="main-password" className="text-base font-semibold text-gray-700">
                 Password Utama (Opsional)
               </Label>
               <Input
                 id="main-password"
                 type="text"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="Gunakan jika password di baris kosong"
                 className="zenith-input h-14"
               />
               <p className="text-sm text-gray-500">Password ini akan digunakan jika password di baris data akun tidak diisi.</p>
             </div>
         )} */}

        {/* Custom Profile Count Selector */}
        {customProfileMode && ( // Hanya tampil jika custom mode aktif
          <div className="space-y-3">
            <Label
              htmlFor="profile-count"
              className="text-base font-semibold text-gray-700"
            >
              🎯 Jumlah Profile per Akun (Max: {getMaxProfileCount(accountType)}{" "}
              untuk {accountType})
            </Label>
            <div className="flex space-x-4">
              <Select
                value={profileCount.toString()}
                onValueChange={(value) =>
                  setProfileCount(Number.parseInt(value))
                }
              >
                <SelectTrigger className="w-48 h-14">
                  <SelectValue placeholder="Pilih jumlah profile" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from(
                    { length: getMaxProfileCount(accountType) },
                    (_, i) => i + 1
                  ).map((num) => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} profile{num > 1 ? "s" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                type="number"
                min="1"
                max={getMaxProfileCount(accountType)}
                value={profileCount}
                onChange={(e) =>
                  setProfileCount(
                    Math.max(
                      1,
                      Math.min(
                        getMaxProfileCount(accountType),
                        Number.parseInt(e.target.value) || 1
                      )
                    ) // Pastikan angka valid
                  )
                }
                className="w-32 h-14"
                placeholder="Custom"
              />
            </div>
            <p className="text-sm text-gray-500">
              Pilih dari dropdown atau ketik manual.
            </p>
          </div>
        )}

        {/* Teks Info di Bawah Textarea */}
        <p className="text-sm text-gray-500 pt-2">
          {customProfileMode
            ? `📦 Setiap akun akan dibuat dengan ${profileCount} profile${
                profileCount > 1 ? "s" : ""
              } dan masuk ke Stok Utama.`
            : `📦 Setiap akun akan dibuat dengan ${getDefaultProfileCount(
                accountType
              )} profile${
                getDefaultProfileCount(accountType) > 1 ? "s" : ""
              } dan masuk ke Stok Utama.`}
        </p>

        {/* Tombol Submit */}
        <Button
          type="submit"
          className="zenith-button w-full h-16 text-lg font-bold"
          disabled={isLoading} // Hapus pengecekan warrantyDate
        >
          {isLoading
            ? "Importing..."
            : // Hapus : warrantyMode ? ...
            customProfileMode
            ? `🎯 Import ${profileCount} Profile${
                profileCount > 1 ? "s" : ""
              } (Stok)`
            : "📦 Import ke Stok Utama"}
        </Button>
      </form>

      {/* Info Panel (Hanya Mode Normal) */}
      <div className="zenith-card p-6 border-0">
        <h4 className="font-bold mb-4 gradient-text text-lg">
          💡 Info Mode Import:
        </h4>
        {/* Hapus grid md:grid-cols-2 */}
        <div className="text-sm">
          {/* Hanya Info Mode Normal */}
          <div className="p-4 bg-green-50 rounded-xl">
            <h5 className="font-bold text-green-800 mb-2 flex items-center">
              <Package className="h-4 w-4 mr-2" />
              📦 Impor ke Stok Utama:
            </h5>
            <ul className="space-y-1 list-disc list-inside text-green-700">
              <li>
                Akun yang diimpor akan <strong>MASUK ke stok utama</strong>.
              </li>
              <li>
                Bisa custom jumlah profile jika opsi "Custom Profile Count"
                dicentang.
              </li>
              <li>
                Digunakan untuk menambah stok akun operasional sehari-hari.
              </li>
              <li>Akun ini bisa di-request oleh operator.</li>
              <li>Menambah hitungan "Available Profiles" di dashboard.</li>
            </ul>
          </div>
        </div>

        {/* Hapus Bagian Info Garansi */}
        {/* Hapus Bagian PENTING - Pemisahan Data */}
      </div>
    </div>
  );
}
