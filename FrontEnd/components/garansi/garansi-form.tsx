"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAccounts } from "@/contexts/account-context";
// --- IMPORTS DIPERBARUI ---
import { AccountType, PlatformType } from "@/lib/database-service"; // Impor tipe
import { format, addDays } from "date-fns"; // Impor addDays
// --- AKHIR IMPORTS ---
import { cn } from "@/lib/utils";
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- OPSI UNTUK DROPDOWN PLATFORM ---
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
  { value: "CAPCUT", label: "CAPCUT" },
];
// --- AKHIR OPSI PLATFORM ---

export default function GaransiForm() {
  const { addGaransiAccounts } = useAccounts();
  const { toast } = useToast();

  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [platform, setPlatform] = useState<PlatformType | "">("");
  const [accountInput, setAccountInput] = useState("");
  const [sharedPassword, setSharedPassword] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(
    addDays(new Date(), 30)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [inputMode, setInputMode] = useState<"email_password" | "email_only">(
    "email_password"
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!accountType) {
      setError("Pilih tipe akun terlebih dahulu.");
      setIsLoading(false);
      return;
    }
    if (!platform) {
      setError("Pilih platform terlebih dahulu.");
      setIsLoading(false);
      return;
    }
    if (!accountInput.trim()) {
      setError("Masukkan data akun (email atau email:password).");
      setIsLoading(false);
      return;
    }
    if (inputMode === "email_only" && !sharedPassword.trim()) {
      setError("Masukkan shared password untuk mode input email saja.");
      setIsLoading(false);
      return;
    }
    if (!expiresAt) {
      setError("Pilih tanggal kadaluarsa akun.");
      setIsLoading(false);
      return;
    }

    const lines = accountInput.trim().split("\n");
    const accountsToAdd: {
      email: string;
      password: string;
      type: AccountType;
      platform: PlatformType;
    }[] = [];
    let parseError = false;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      let email = "";
      let password = "";

      if (inputMode === "email_password") {
        const parts = trimmedLine.split(/[:\s,;\t]+/);
        if (parts.length >= 2 && parts[0].includes("@")) {
          email = parts[0].trim();
          password = parts[1].trim();
        } else {
          setError(
            `Format salah di baris: "${trimmedLine}". Harusnya email:password`
          );
          parseError = true;
          return;
        }
      } else {
        if (trimmedLine.includes("@")) {
          email = trimmedLine;
          password = sharedPassword.trim();
        } else {
          setError(`Format email salah di baris: "${trimmedLine}"`);
          parseError = true;
          return;
        }
      }

      if (email && password && !parseError) {
        accountsToAdd.push({
          email,
          password,
          type: accountType as AccountType,
          platform: platform as PlatformType,
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

    try {
      // --- PERBAIKAN ERROR 1 (Date vs String) ---
      // Kita kirim sebagai string ISO, karena context/API mungkin memerlukannya
      await addGaransiAccounts(accountsToAdd, expiresAt.toISOString());

      toast({
        title: "🛡️ Akun Garansi Ditambahkan",
        description: `Berhasil menambahkan ${accountsToAdd.length} akun garansi baru.`,
        duration: 5000,
      });

      // Reset form
      setAccountType("");
      setPlatform("");
      setAccountInput("");
      setSharedPassword("");
      setError("");
    } catch (err) {
      console.error("Error adding garansi accounts:", err);
      setError(
        err instanceof Error ? err.message : "Gagal menambahkan akun garansi."
      );
      toast({
        title: "❌ Gagal",
        description: "Terjadi kesalahan saat menyimpan akun garansi.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Akun yang ditambahkan di sini akan masuk ke database garansi terpisah.
          Tanggal mulai garansi (`warrantyDate`) akan di-set ke hari ini secara
          otomatis.
        </AlertDescription>
      </Alert>

      {/* 1. Pilih Tipe Akun */}
      <div className="space-y-2">
        <Label htmlFor="garansi-account-type" className="font-semibold">
          Tipe Akun
        </Label>
        <Select
          value={accountType}
          onValueChange={(value) => setAccountType(value as AccountType)}
        >
          <SelectTrigger
            id="garansi-account-type"
            className="h-12 border-gray-300"
          >
            <SelectValue placeholder="Pilih tipe (Private/Sharing/VIP)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="sharing">Sharing</SelectItem>
            {/* --- PERBAIKAN ERROR 2 (Typo) --- */}
            <SelectItem value="vip">VIP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 2. DROPDOWN PLATFORM (BARU) */}
      <div className="space-y-2">
        <Label htmlFor="garansi-platform" className="font-semibold">
          Platform
        </Label>
        <Select
          value={platform}
          onValueChange={(value) => setPlatform(value as PlatformType)}
        >
          <SelectTrigger id="garansi-platform" className="h-12 border-gray-300">
            <SelectValue placeholder="Pilih platform (Netflix/Vidio/dll)" />
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

      {/* 3. Opsi Mode Input */}
      <div className="space-y-2">
        <Label className="font-semibold">Mode Input Akun</Label>
        <div className="flex gap-4">
          <Button
            type="button"
            variant={inputMode === "email_password" ? "default" : "outline"}
            onClick={() => setInputMode("email_password")}
          >
            Email:Password per Baris
          </Button>
          <Button
            type="button"
            variant={inputMode === "email_only" ? "default" : "outline"}
            onClick={() => setInputMode("email_only")}
          >
            Email per Baris (Password Sama)
          </Button>
        </div>
      </div>

      {/* 4. Input Akun (Email & Password) */}
      <div className="space-y-2">
        <Label htmlFor="garansi-account-input" className="font-semibold">
          {inputMode === "email_password"
            ? "Data Akun (Email:Password per baris)"
            : "Email Akun (Satu email per baris)"}
        </Label>
        <Textarea
          id="garansi-account-input"
          value={accountInput}
          onChange={(e) => setAccountInput(e.target.value)}
          placeholder={
            inputMode === "email_password"
              ? "contoh@email.com:password123\ncontohlain@email.com:passlain456"
              : "contoh@email.com\ncontohlain@email.com"
          }
          className="min-h-[120px] border-gray-300"
          required
        />
        <p className="text-xs text-gray-500">
          Pisahkan email dan password dengan titik dua (:), spasi, koma, atau
          tab jika memilih mode Email:Password.
        </p>
      </div>

      {/* 5. Input Shared Password (jika mode email_only) */}
      {inputMode === "email_only" && (
        <div className="space-y-2">
          <Label htmlFor="garansi-shared-password" className="font-semibold">
            Shared Password
          </Label>
          <Input
            id="garansi-shared-password"
            type="text"
            value={sharedPassword}
            onChange={(e) => setSharedPassword(e.target.value)}
            placeholder="Masukkan password yang sama untuk semua email di atas"
            className="h-12 border-gray-300"
            required={inputMode === "email_only"}
          />
        </div>
      )}

      {/* 6. KALENDER DIPERBARUI (Menjadi EXPIRES AT) */}
      <div className="space-y-2">
        <Label htmlFor="garansi-date" className="font-semibold">
          Tanggal Kadaluarsa (Masa Aktif Berakhir)
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="garansi-date"
              className={cn(
                "w-full justify-start text-left font-normal h-12 border-gray-300",
                !expiresAt && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {expiresAt ? format(expiresAt, "dd MMMM yyyy") : "Pilih tanggal"}
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
              // --- PERBAIKAN ERROR 3 (Kalender) ---
              captionLayout="dropdown" // <-- Diubah dari "dropdown-buttons"
              fromYear={new Date().getFullYear()} // <-- Ditambahkan
              toYear={new Date().getFullYear() + 5}
              // --- AKHIR PERBAIKAN ---
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-gray-500">
          Pilih tanggal kapan akun ini akan kadaluarsa. Tanggal mulai garansi
          akan di-set ke hari ini.
        </p>
      </div>

      {/* 7. Tombol Submit */}
      <Button
        type="submit"
        className="w-full h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700"
        disabled={isLoading}
      >
        {isLoading ? "Menyimpan..." : "Tambah ke Database Garansi"}
      </Button>
    </form>
  );
}
