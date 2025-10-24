"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// --- IMPORTS TAMBAHAN ---
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
import { format, addDays } from "date-fns";
import { cn } from "@/lib/utils";
// Impor tipe dari service, bukan context
import type { AccountType, PlatformType } from "@/lib/database-service";
import { useAccounts } from "@/contexts/account-context"; // Import useAccounts
// --- AKHIR IMPORTS TAMBAHAN ---

// --- OPSI PLATFORM (Sama seperti di garansi-form) ---
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

interface AccountFormProps {
  type: AccountType; // Tipe akun sudah ditentukan dari props
  onSuccess?: () => void; // Callback saat sukses
}

export default function AccountForm({ type, onSuccess }: AccountFormProps) {
  const { addAccount } = useAccounts(); // Gunakan fungsi addAccount dari context
  // --- STATE DIPERBARUI ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [platform, setPlatform] = useState<PlatformType | "">(""); // State baru
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(
    addDays(new Date(), 30) // State baru, default 30 hari
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); // State untuk error
  // --- AKHIR STATE ---

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null); // Reset error

    // --- Validasi Input Baru ---
    if (!platform) {
      setError("Platform harus dipilih.");
      setIsLoading(false);
      return;
    }
    if (!expiresAt) {
      setError("Tanggal kadaluarsa harus dipilih.");
      setIsLoading(false);
      return;
    }
    // --- Akhir Validasi Baru ---

    try {
      // --- Logika pembuatan profil DIHAPUS ---

      // --- PANGGIL addAccount DENGAN PAYLOAD BARU ---
      // Kirim data yang dibutuhkan oleh API POST /api/accounts
      const newAccount = await addAccount({
        // addAccount di context mengembalikan Account | null
        email,
        password,
        type, // Type dari props
        platform: platform as PlatformType, // Platform dari state
        expiresAt: expiresAt.toISOString(), // Kirim sebagai string ISO
        // profiles TIDAK dikirim, backend yang buat
      });
      // --- AKHIR PEMANGGILAN ---

      if (newAccount) {
        // Cek apakah akun berhasil dibuat (tidak null)
        // Reset form jika sukses
        setEmail("");
        setPassword("");
        setPlatform("");
        setExpiresAt(addDays(new Date(), 30));
        setError(null); // Clear error
        onSuccess?.(); // Panggil onSuccess jika ada (misal: menutup dialog)
        // Toast sukses sudah dihandle oleh context
      } else {
        // Jika addAccount mengembalikan null, artinya gagal
        // Context sudah menampilkan toast error, kita bisa set error lokal jika perlu
        setError("Gagal menambahkan akun. Periksa log atau coba lagi.");
      }
    } catch (err: any) {
      console.error("Error submitting account form:", err);
      // Set error state (context mungkin sudah handle toast)
      setError(err.message || "Terjadi kesalahan tak terduga.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk mendapatkan nama tipe akun yang lebih ramah
  const getFriendlyTypeName = (accountType: AccountType): string => {
    switch (accountType) {
      case "private":
        return "Private";
      case "sharing":
        return "Sharing";
      case "vip":
        return "VIP";
      default:
        return accountType;
    }
  };

  return (
    // Form tidak lagi dibungkus Card jika dipakai di dialog
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      {/* Tampilkan error jika ada */}
      {error && (
        <p className="text-sm text-red-600 px-1 py-2 bg-red-50 rounded border border-red-200">
          {error}
        </p>
      )}

      {/* Input Email */}
      <div className="space-y-2">
        <Label htmlFor={`${type}-email`}>Email</Label>
        <Input
          id={`${type}-email`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={`Enter ${getFriendlyTypeName(type)} account email`}
          className="border-gray-300 focus-visible:ring-blue-500"
          required
          disabled={isLoading}
        />
      </div>

      {/* Input Password */}
      <div className="space-y-2">
        <Label htmlFor={`${type}-password`}>Password</Label>
        <Input
          id={`${type}-password`}
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter account password"
          className="border-gray-300 focus-visible:ring-blue-500"
          required
          disabled={isLoading}
        />
      </div>

      {/* Input Platform (BARU) */}
      <div className="space-y-2">
        <Label htmlFor={`${type}-platform`}>Platform</Label>
        <Select
          value={platform}
          onValueChange={(value) => setPlatform(value as PlatformType)}
          disabled={isLoading}
        >
          <SelectTrigger id={`${type}-platform`} className="border-gray-300">
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
      {/* Akhir Input Platform */}

      {/* Input Expires At (BARU) */}
      <div className="space-y-2">
        <Label htmlFor={`${type}-expiresAt`}>Tanggal Kadaluarsa</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id={`${type}-expiresAt`}
              className={cn(
                "w-full justify-start text-left font-normal border-gray-300",
                !expiresAt && "text-muted-foreground"
              )}
              disabled={isLoading}
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
                // Hanya izinkan tanggal hari ini & masa depan
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              defaultMonth={expiresAt || new Date()}
              fromMonth={new Date()} // Mulai dari bulan ini
              toYear={new Date().getFullYear() + 5} // Izinkan 5 tahun ke depan
              captionLayout="dropdown" // Layout dropdown
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      {/* Akhir Input Expires At */}

      {/* Tombol Submit */}
      <div className="pt-2">
        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700" // Sesuaikan warna jika perlu
          disabled={isLoading}
        >
          {isLoading ? "Adding..." : `Add ${getFriendlyTypeName(type)} Account`}{" "}
          {/* Gunakan nama ramah */}
        </Button>
      </div>
    </form>
  );
}
