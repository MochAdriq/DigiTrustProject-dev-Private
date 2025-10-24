"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAccounts } from "@/contexts/account-context";
// Impor tipe dari service
import type { AccountType, PlatformType } from "@/lib/database-service";
import {
  AlertCircle,
  Info,
  Package,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Impor untuk Kalender
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";

// --- OPSI PLATFORM (Sama seperti di form lain) ---
const platformOptions: { value: PlatformType; label: string }[] = [
  { value: "NETFLIX", label: "Netflix" },
  { value: "DISNEY", label: "Disney+" },
  { value: "HBO", label: "HBO Go" },
  { value: "PRIMEVIDEO", label: "Prime Video" },
  { value: "VIDIO_DIAMOND_MOBILE", label: "Vidio Diamond Mobile" },
  { value: "VIDIO_PLATINUM", label: "Vidio Platinum" },
  { value: "VIU_1_BULAN", label: "Viu (1 Bulan)" },
  { value: "WE_TV", label: "WeTV" },
  { value: "YOUTUBE_1_BULAN", label: "YouTube (1 Bulan)" },
  { value: "LOKLOK", label: "LokLok" },
  { value: "SPOTIFY_FAMPLAN_1_BULAN", label: "Spotify 1 Bulan" },
  { value: "SPOTIFY_FAMPLAN_2_BULAN", label: "Spotify 2 Bulan" },
  { value: "CANVA_1_BULAN", label: "Canva (1 Bulan)" },
  { value: "CANVA_1_TAHUN", label: "Canva (1 Tahun)" },
  { value: "CHAT_GPT", label: "Chat GPT" },
  { value: "CAPCUT", label: "Capcut" },
];
// --- AKHIR OPSI PLATFORM ---

// Helper jumlah profil default
const getDefaultProfileCount = (type: AccountType): number => {
  if (type === "private") return 8;
  if (type === "sharing") return 20;
  if (type === "vip") return 6; // Ganti vvip jadi vip
  return 8; // Default fallback
};

export default function BulkImport() {
  const { toast } = useToast();
  // Ambil fungsi addAccounts dari context
  // Pastikan fungsi ini di context sudah diupdate untuk memanggil API Bulk
  const { addAccounts } = useAccounts();
  const [emails, setEmails] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("private");
  const [platform, setPlatform] = useState<PlatformType | "">(""); // State Platform BARU
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(
    addDays(new Date(), 30)
  ); // State ExpiresAt BARU
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sharedPassword, setSharedPassword] = useState("");
  const [inputMode, setInputMode] = useState<"email_password" | "email_only">(
    "email_password"
  );

  const handleAccountTypeChange = (type: AccountType) => {
    setAccountType(type);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const lines = emails
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0);

      if (lines.length === 0)
        throw new Error("Masukkan setidaknya satu data akun.");
      if (!platform) throw new Error("Platform harus dipilih.");
      if (!expiresAt) throw new Error("Tanggal kadaluarsa harus dipilih.");

      const finalSharedPassword = sharedPassword.trim();
      if (inputMode === "email_only" && !finalSharedPassword) {
        throw new Error(
          "Masukkan shared password untuk mode input email saja."
        );
      }

      const accountsToAdd: {
        email: string;
        password: string;
        type: AccountType;
        platform: PlatformType;
      }[] = [];
      let parseErrorLine: string | null = null;

      lines.forEach((line) => {
        if (parseErrorLine) return;
        let email = "";
        let linePassword = "";

        if (inputMode === "email_password") {
          const parts = line.split(/[:\s,;\t]+/);
          if (parts.length >= 2 && parts[0].includes("@") && parts[1]) {
            email = parts[0].trim();
            linePassword = parts[1].trim();
          } else {
            parseErrorLine = `Format salah di baris: "${line}". Harusnya email:password`;
            return;
          }
        } else {
          // email_only mode
          if (line.includes("@")) {
            email = line.trim();
            linePassword = finalSharedPassword;
          } else {
            parseErrorLine = `Format email salah di baris: "${line}"`;
            return;
          }
        }
        accountsToAdd.push({
          email,
          password: linePassword,
          type: accountType,
          platform: platform as PlatformType,
        });
      });

      if (parseErrorLine) throw new Error(parseErrorLine);
      if (accountsToAdd.length === 0)
        throw new Error("Tidak ada akun valid yang bisa ditambahkan.");

      // Panggil fungsi addAccounts dari context (yang memanggil API Bulk)
      // Pastikan context `addAccounts` dimodifikasi untuk menerima expiresAt
      await addAccounts(accountsToAdd, expiresAt.toISOString());

      toast({
        title: "✅ Import Berhasil!",
        description: `Berhasil mengimpor ${
          accountsToAdd.length
        } akun ${accountType} (${platform.replace(/_/g, " ")}) ke Stok Utama.`,
        duration: 5000,
      });

      setEmails("");
      setPlatform("");
      setExpiresAt(addDays(new Date(), 30));
      setSharedPassword("");
      setError(null);
    } catch (error: any) {
      console.error("Bulk import error:", error);
      setError(error.message || "Gagal mengimpor akun.");
      toast({
        title: "❌ Gagal Import",
        description: error.message || "Terjadi kesalahan saat impor.",
        variant: "destructive",
      });
    } finally {
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

        {/* Pilihan Tipe Akun */}
        <div className="space-y-3">
          <Label className="text-base font-semibold text-gray-700">
            Account Type
          </Label>
          <RadioGroup
            defaultValue="private"
            value={accountType}
            onValueChange={(value) =>
              handleAccountTypeChange(value as AccountType)
            }
            className="flex flex-wrap gap-x-6 gap-y-2"
          >
            <div className="flex items-center space-x-3">
              <RadioGroupItem
                value="private"
                id="private-bulk"
                className="w-5 h-5"
              />
              <Label htmlFor="private-bulk" className="text-base">
                Private ({getDefaultProfileCount("private")} profiles)
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem
                value="sharing"
                id="sharing-bulk"
                className="w-5 h-5"
              />
              <Label htmlFor="sharing-bulk" className="text-base">
                Sharing ({getDefaultProfileCount("sharing")} profiles)
              </Label>
            </div>
            <div className="flex items-center space-x-3">
              <RadioGroupItem value="vip" id="vip-bulk" className="w-5 h-5" />
              <Label htmlFor="vip-bulk" className="text-base">
                VIP ({getDefaultProfileCount("vip")} profiles)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Input Platform */}
        <div className="space-y-2">
          <Label
            htmlFor="bulk-platform"
            className="text-base font-semibold text-gray-700"
          >
            Platform (untuk semua akun)
          </Label>
          <Select
            value={platform}
            onValueChange={(value) => setPlatform(value as PlatformType)}
            disabled={isLoading}
          >
            <SelectTrigger id="bulk-platform" className="h-14 border-gray-300">
              <SelectValue placeholder="Pilih platform" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {platformOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Input ExpiresAt */}
        <div className="space-y-2">
          <Label
            htmlFor="bulk-expiresAt"
            className="text-base font-semibold text-gray-700"
          >
            Tanggal Kadaluarsa (untuk semua akun)
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                id="bulk-expiresAt"
                className={cn(
                  "w-full justify-start text-left font-normal h-14 border-gray-300",
                  !expiresAt && "text-muted-foreground"
                )}
                disabled={isLoading}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {expiresAt
                  ? format(expiresAt, "dd MMMM yyyy")
                  : "Pilih tanggal"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={expiresAt}
                onSelect={setExpiresAt}
                disabled={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
                defaultMonth={expiresAt || new Date()}
                fromMonth={new Date()}
                toYear={new Date().getFullYear() + 5}
                captionLayout="dropdown"
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Opsi Mode Input */}
        <div className="space-y-2">
          <Label className="font-semibold">Mode Input Akun</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={inputMode === "email_password" ? "default" : "outline"}
              onClick={() => setInputMode("email_password")}
              disabled={isLoading}
            >
              Email:Password per Baris
            </Button>
            <Button
              type="button"
              size="sm"
              variant={inputMode === "email_only" ? "default" : "outline"}
              onClick={() => setInputMode("email_only")}
              disabled={isLoading}
            >
              Email per Baris + Shared Password
            </Button>
          </div>
        </div>

        {/* Input Akun (Textarea) */}
        <div className="space-y-3">
          <Label
            htmlFor="bulk-emails"
            className="text-base font-semibold text-gray-700"
          >
            {inputMode === "email_password"
              ? "Data Akun (Email:Password per baris)"
              : "Email Akun (Satu email per baris)"}
          </Label>
          <Textarea
            id="bulk-emails"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder={
              inputMode === "email_password"
                ? "email1@contoh.com:pass1\nemail2@contoh.com:pass2"
                : "email1@contoh.com\nemail2@contoh.com"
            }
            className="min-h-[150px] border-gray-300"
            required
            disabled={isLoading}
          />
          <p className="text-sm text-gray-500">
            {inputMode === "email_password"
              ? "Pisahkan email & password dengan :, spasi, koma, atau tab."
              : "Satu email per baris."}
          </p>
        </div>

        {/* Input Shared Password */}
        {inputMode === "email_only" && (
          <div className="space-y-3">
            <Label
              htmlFor="bulk-shared-password"
              className="text-base font-semibold text-gray-700"
            >
              Shared Password (untuk semua email di atas)
            </Label>
            <Input
              id="bulk-shared-password"
              type="text"
              value={sharedPassword}
              onChange={(e) => setSharedPassword(e.target.value)}
              placeholder="Enter shared password"
              className="h-14 border-gray-300"
              required={inputMode === "email_only"}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Info Jumlah Profil Default */}
        <p className="text-sm text-gray-500 pt-2">
          📦 Setiap akun akan dibuat dengan{" "}
          {getDefaultProfileCount(accountType)} profile dan masuk ke Stok Utama.
        </p>

        {/* Tombol Submit */}
        <Button
          type="submit"
          className="w-full h-16 text-lg font-bold bg-green-600 hover:bg-green-700"
          disabled={isLoading}
        >
          {isLoading ? "Importing..." : "📦 Import ke Stok Utama"}
        </Button>
      </form>

      {/* Info Panel */}
      <div className="border border-gray-200 rounded-lg p-6">
        <h4 className="font-bold mb-4 text-gray-800 text-lg">
          💡 Info Mode Import:
        </h4>
        <div className="text-sm">
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <h5 className="font-semibold text-green-800 mb-2 flex items-center">
              <Package className="h-4 w-4 mr-2" /> Impor ke Stok Utama:
            </h5>
            <ul className="space-y-1 list-disc list-inside text-green-700">
              <li>
                Akun yang diimpor akan <strong>MASUK ke stok utama</strong>.
              </li>
              <li>
                Jumlah profil otomatis sesuai Tipe Akun (
                {getDefaultProfileCount(accountType)} untuk {accountType}).
              </li>
              <li>Digunakan untuk menambah stok akun operasional.</li>
              <li>Akun ini bisa di-request oleh operator.</li>
              <li>Menambah hitungan "Available Profiles".</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
