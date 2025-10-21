"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Mungkin tidak perlu jika pakai Textarea
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Untuk input email:password
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon } from "lucide-react"; // Ganti nama alias Calendar
import { Calendar as CalendarComponent } from "@/components/ui/calendar"; // Nama asli komponen Calendar
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useAccounts } from "@/contexts/account-context";
import { AccountType } from "@/lib/database-service"; // Impor tipe
import { format, subDays } from "date-fns"; // Untuk tanggal
import { cn } from "@/lib/utils";
import { AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function GaransiForm() {
  const { addGaransiAccounts } = useAccounts();
  const { toast } = useToast();

  const [accountType, setAccountType] = useState<AccountType | "">("");
  const [accountInput, setAccountInput] = useState(""); // Untuk email:password atau email saja
  const [sharedPassword, setSharedPassword] = useState(""); // Password jika input hanya email
  const [warrantyDate, setWarrantyDate] = useState<Date | undefined>(
    subDays(new Date(), 7)
  ); // Default 7 hari lalu
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
    if (!warrantyDate) {
      setError("Pilih tanggal garansi (tanggal akun dibuat).");
      setIsLoading(false);
      return;
    }

    // Proses input
    const lines = accountInput.trim().split("\n");
    const accountsToAdd: {
      email: string;
      password: string;
      type: AccountType;
    }[] = [];
    let parseError = false;

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return; // Lewati baris kosong

      let email = "";
      let password = "";

      if (inputMode === "email_password") {
        const parts = trimmedLine.split(/[:\s,;\t]+/); // Split by common delimiters
        if (parts.length >= 2 && parts[0].includes("@")) {
          email = parts[0].trim();
          password = parts[1].trim(); // Ambil bagian kedua sebagai password
        } else {
          setError(
            `Format salah di baris: "${trimmedLine}". Harusnya email:password`
          );
          parseError = true;
          return; // Stop processing this line
        }
      } else {
        // email_only mode
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
        });
      }
    });

    if (parseError) {
      setIsLoading(false);
      return; // Stop submission if parsing error occurred
    }

    if (accountsToAdd.length === 0) {
      setError("Tidak ada akun valid yang bisa ditambahkan.");
      setIsLoading(false);
      return;
    }

    try {
      await addGaransiAccounts(accountsToAdd, warrantyDate); // Kirim Date object

      toast({
        title: "🛡️ Akun Garansi Ditambahkan",
        description: `Berhasil menambahkan ${accountsToAdd.length} akun ke database garansi (Info Only).`,
        duration: 5000,
      });

      // Reset form
      setAccountType("");
      setAccountInput("");
      setSharedPassword("");
      // setWarrantyDate(subDays(new Date(), 7)); // Reset ke default atau biarkan? Maybe biarkan
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
          Akun yang ditambahkan di sini akan masuk ke{" "}
          <strong>database garansi terpisah</strong> dan TIDAK mempengaruhi stok
          utama. Gunakan ini untuk mencatat akun yang diberikan sebagai garansi
          kepada customer.
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
            <SelectValue placeholder="Pilih tipe (Private/Sharing/VVIP)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Private</SelectItem>
            <SelectItem value="sharing">Sharing</SelectItem>
            <SelectItem value="vvip">VVIP</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Opsi Mode Input */}
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

      {/* 2. Input Akun (Email & Password) */}
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

      {/* Input Shared Password (jika mode email_only) */}
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

      {/* 3. Pilih Tanggal Garansi */}
      <div className="space-y-2">
        <Label htmlFor="garansi-date" className="font-semibold">
          Tanggal Akun Dibuat/Diberikan (Tanggal Garansi)
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              id="garansi-date"
              className={cn(
                "w-full justify-start text-left font-normal h-12 border-gray-300",
                !warrantyDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {warrantyDate
                ? format(warrantyDate, "dd MMMM yyyy")
                : "Pilih tanggal"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <CalendarComponent
              mode="single"
              selected={warrantyDate}
              onSelect={setWarrantyDate}
              // Batasi tanggal, misal hanya 6 bulan terakhir
              disabled={(date) => {
                const today = new Date();
                today.setHours(23, 59, 59, 999); // Akhir hari ini
                const sixMonthsAgo = subDays(today, 180); // Kurang lebih 6 bulan
                return date > today || date < sixMonthsAgo;
              }}
              defaultMonth={warrantyDate || subDays(new Date(), 7)} // Tampilkan bulan default
              fromMonth={subDays(new Date(), 180)}
              toMonth={new Date()}
              captionLayout="dropdown-buttons"
              initialFocus
            />
          </PopoverContent>
        </Popover>
        <p className="text-xs text-gray-500">
          Pilih tanggal kapan akun ini sebenarnya dibuat atau diberikan ke
          customer. Garansi 23 hari dihitung dari tanggal ini.
        </p>
      </div>

      {/* 4. Tombol Submit */}
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
