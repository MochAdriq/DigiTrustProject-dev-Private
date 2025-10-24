"use client";

import type React from "react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
// --- IMPORTS DIPERBARUI ---
import { useAccounts } from "@/contexts/account-context"; // Import context hook
import type { Account } from "@prisma/client"; // Import tipe Account
// --- AKHIR IMPORTS ---
import { Search, Copy, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

interface AccountSearchProps {
  onClose?: () => void; // Optional close handler
}

// Helper Tipe Profile (jika belum global)
type Profile = { profile: string; pin: string; used: boolean };

export default function AccountSearch({ onClose }: AccountSearchProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  // --- CONTEXT DIPERBARUI ---
  // accounts tidak lagi dipakai untuk search, tapi bisa untuk debug info
  const { searchAccountsByEmail, getRemainingDays, accounts } = useAccounts();
  // --- AKHIR CONTEXT ---
  const { toast } = useToast();
  // --- STATE HASIL DIPERBARUI ---
  // Simpan objek Account lengkap dari Prisma (atau null)
  const [searchResult, setSearchResult] = useState<Account | null>(null);
  // --- AKHIR STATE HASIL ---

  // --- HANDLE SEARCH DIPERBARUI ---
  const handleSearch = async (e: React.FormEvent) => {
    // Buat jadi async
    e.preventDefault();
    const trimmedSearch = searchTerm.trim(); // Trim dulu

    if (!trimmedSearch) {
      toast({
        title: "Error",
        description: "Please enter an email to search",
        variant: "destructive",
      });
      return;
    }

    setIsSearching(true);
    setSearchResult(null); // Reset hasil sebelumnya

    try {
      console.log("=== SEARCHING VIA API ===");
      console.log("Search term:", trimmedSearch);

      // Panggil fungsi search dari context (yang memanggil API)
      const results: Account[] = await searchAccountsByEmail(trimmedSearch);

      console.log("API Results:", results);

      if (results && results.length > 0) {
        // Ambil hasil pertama jika ditemukan
        const firstResult = results[0];

        // Set state dengan data lengkap dari hasil pertama
        // getRemainingDays akan dipanggil saat render hasil
        setSearchResult(firstResult); // Simpan objek Account utuh

        console.log("Displaying first result:", firstResult);

        toast({
          title: "✅ Account Found",
          description: `Found account: ${firstResult.email}${
            results.length > 1 ? ` (+${results.length - 1} more)` : ""
          }`,
        });
      } else {
        setSearchResult(null);
        toast({
          title: "❌ Account Not Found",
          description: `No account found with email containing: "${trimmedSearch}"`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Error",
        description: error.message || "An error occurred during search.",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };
  // --- AKHIR HANDLE SEARCH ---

  // --- COPY TO CLIPBOARD DIPERBARUI ---
  const copyToClipboard = () => {
    if (!searchResult) return;

    // Pastikan profiles adalah array yang valid dan coba parse
    let profilesArray: Profile[] = [];
    if (typeof searchResult.profiles === "string") {
      try {
        profilesArray = JSON.parse(searchResult.profiles);
      } catch (e) {
        console.error("Failed to parse profiles JSON string:", e);
      }
    } else if (Array.isArray(searchResult.profiles)) {
      // Jika sudah array (meski tipe JsonValue), coba assert
      profilesArray = searchResult.profiles as unknown as Profile[];
    }

    // Cari profil pertama yang valid dan belum terpakai
    const firstAvailableProfile = profilesArray.find(
      (
        p
      ): p is Profile => // Type guard
        typeof p === "object" &&
        p !== null &&
        typeof p.profile === "string" &&
        typeof p.pin === "string" &&
        typeof p.used === "boolean" &&
        !p.used
    );

    // Ambil platform dari hasil search
    const platformName = searchResult.platform || "Unknown Platform"; // Fallback
    // Format tipe akun
    const accountTypeFormatted =
      searchResult.type.charAt(0).toUpperCase() + searchResult.type.slice(1);
    // Hitung sisa hari lagi di sini
    const daysLeft = getRemainingDays(searchResult);

    // Buat teks dinamis
    const accountText = `!!! ${platformName
      .toUpperCase()
      .replace(/_/g, " ")} - TRUSTDIGITAL.ID !!!

1. Login hanya di 1 DEVICE !!
2. Garansi akun 23 Hari
3. Ketika ada kendala akun :
 - Hapus chache app
 - (DIBACA) GUNAKAN DATA SELULER/HOTSPOT SAAT LOGIN SAJA
 - Install Ulang App
4. Dilarang mengubah Nama profile, Pin, membuka pengaturan akun !!

💌 Email: ${searchResult.email}
🔑 Password: ${searchResult.password}
👤 Profil: ${firstAvailableProfile?.profile || "No available profiles"}
PIN: ${firstAvailableProfile?.pin || "N/A"}
Tipe: ${accountTypeFormatted}
⏱️ Sisa hari: ${daysLeft} hari

Melanggar? Akun ditarik + denda Rp300K
Terima kasih telah memesan di TrustDigital.ID
Contact: @TRUSTDIGITAL001 | IG: @trustdigital.indonesia
Website: https://trustdigital.id

KRITIK DAN SARAN:
https://docs.google.com/forms/d/e/1FAIpQLScSpnLbo4ouMf2hH1rYgJi-xIdV6s8i2euLBTY9Fg1tzVrWyw/viewform?usp=header`;

    navigator.clipboard.writeText(accountText);

    toast({
      title: "📋 Copied",
      description: `Details for ${platformName.replace(
        /_/g,
        " "
      )} account copied!`, // Ganti _ dengan spasi
    });
  };
  // --- AKHIR COPY TO CLIPBOARD ---

  const clearSearch = () => {
    setSearchTerm("");
    setSearchResult(null);
  };

  return (
    <div className="space-y-4">
      {/* Search Form (Tetap Sama) */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Enter email address (partial match supported)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8" // Padding agar tombol clear tidak overlap
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 text-gray-500 hover:text-gray-800"
                aria-label="Clear search"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Button type="submit" disabled={isSearching || !searchTerm.trim()}>
            <Search className="h-4 w-4 mr-2" />
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>
        <div className="text-xs text-gray-500">
          💡 Tips: Partial email search supported (e.g., "budi" might find
          "budi.susanto@email.com").
        </div>
      </form>

      {/* --- Search Results DIPERBARUI --- */}
      {searchResult && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">
              ✅ Account Found
            </h3>
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-1" />
              Copy Details (Formatted)
            </Button>
          </div>

          <div className="space-y-3 font-mono text-sm">
            {/* Grid Layout Disesuaikan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Email */}
              <div className="md:col-span-2">
                {" "}
                {/* Email bisa lebih lebar */}
                <span className="font-semibold text-gray-600 dark:text-gray-400">
                  📧 Email:
                </span>
                <div className="bg-white dark:bg-gray-700 p-2 rounded border dark:border-gray-600 break-all">
                  {searchResult.email}
                </div>
              </div>
              {/* Password */}
              <div>
                <span className="font-semibold text-gray-600 dark:text-gray-400">
                  🔑 Password:
                </span>
                <div className="bg-white dark:bg-gray-700 p-2 rounded border dark:border-gray-600">
                  {searchResult.password}
                </div>
              </div>
              {/* Type */}
              <div>
                <span className="font-semibold text-gray-600 dark:text-gray-400">
                  📱 Type:
                </span>
                <div className="mt-1">
                  {/* Gunakan variant Badge standar */}
                  <Badge
                    variant={
                      searchResult.type === "private"
                        ? "secondary"
                        : searchResult.type === "vip"
                        ? "default"
                        : "outline"
                    }
                  >
                    {searchResult.type.charAt(0).toUpperCase() +
                      searchResult.type.slice(1)}
                  </Badge>
                </div>
              </div>
              {/* Platform (BARU) */}
              <div>
                <span className="font-semibold text-gray-600 dark:text-gray-400">
                  <span role="img" aria-label="Platform">
                    🌐
                  </span>{" "}
                  Platform:
                </span>
                <div className="mt-1">
                  <Badge variant="outline">
                    {searchResult.platform
                      ? searchResult.platform.replace(/_/g, " ")
                      : "N/A"}
                  </Badge>
                </div>
              </div>
              {/* Days Left */}
              <div>
                <span className="font-semibold text-gray-600 dark:text-gray-400">
                  ⏰ Days Left:
                </span>
                <div className="mt-1">
                  {(() => {
                    const daysLeft = getRemainingDays(searchResult);
                    const variant: "destructive" | "secondary" | "default" =
                      daysLeft < 0
                        ? "destructive" // Ubah ke < 0
                        : daysLeft === 0
                        ? "secondary" // Hari ini = secondary
                        : daysLeft <= 7
                        ? "secondary" // 1-7 hari = secondary
                        : "default"; // > 7 hari = default
                    const text =
                      daysLeft < 0
                        ? `Expired (${Math.abs(daysLeft)}d ago)`
                        : daysLeft === 0
                        ? "Expires Today"
                        : `${daysLeft} days`;
                    return <Badge variant={variant}>{text}</Badge>;
                  })()}
                </div>
              </div>
            </div>

            {/* Available Profiles (Logika parsing lebih aman) */}
            <div>
              <span className="font-semibold text-gray-600 dark:text-gray-400">
                👥 Available Profiles:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                {(() => {
                  let profilesArray: Profile[] = [];
                  if (typeof searchResult.profiles === "string") {
                    try {
                      profilesArray = JSON.parse(searchResult.profiles);
                    } catch {}
                  } else if (Array.isArray(searchResult.profiles)) {
                    profilesArray =
                      searchResult.profiles as unknown as Profile[];
                  }
                  const available = profilesArray.filter(
                    (
                      p
                    ): p is Profile => // Type guard
                      typeof p === "object" &&
                      p !== null &&
                      typeof p.profile === "string" &&
                      typeof p.pin === "string" &&
                      typeof p.used === "boolean" &&
                      !p.used
                  );
                  if (available.length === 0) {
                    return (
                      <div className="col-span-full text-xs text-red-500 p-2 bg-red-100 dark:bg-red-900 rounded">
                        ❌ No available profiles
                      </div>
                    );
                  }
                  return available.map((profile, index) => (
                    <div
                      key={index}
                      className="text-xs p-2 bg-green-100 dark:bg-green-800 dark:text-green-100 rounded border border-green-200 dark:border-green-700"
                    >
                      <div className="font-medium">{profile.profile}</div>
                      <div className="text-gray-600 dark:text-gray-400">
                        PIN: {profile.pin}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Used Profiles (Logika parsing lebih aman) */}
            {(() => {
              let profilesArray: Profile[] = [];
              if (typeof searchResult.profiles === "string") {
                try {
                  profilesArray = JSON.parse(searchResult.profiles);
                } catch {}
              } else if (Array.isArray(searchResult.profiles)) {
                profilesArray = searchResult.profiles as unknown as Profile[];
              }
              const used = profilesArray.filter(
                (
                  p
                ): p is Profile => // Type guard
                  typeof p === "object" &&
                  p !== null &&
                  typeof p.profile === "string" &&
                  typeof p.pin === "string" &&
                  typeof p.used === "boolean" &&
                  p.used
              );
              if (used.length === 0) return null; // Jangan tampilkan jika tidak ada
              return (
                <div>
                  <span className="font-semibold text-gray-600 dark:text-gray-400">
                    🚫 Used Profiles:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mt-2">
                    {used.map((profile, index) => (
                      <div
                        key={index}
                        className="text-xs p-2 bg-gray-100 dark:bg-gray-700 rounded border dark:border-gray-600 opacity-60"
                      >
                        <div className="font-medium">{profile.profile}</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          PIN: {profile.pin}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
      {/* --- AKHIR Search Results --- */}

      {/* Debug Info */}
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-gray-400 p-2 bg-gray-100 dark:bg-gray-900 rounded mt-4">
          <strong>Debug Info:</strong>
          <br />
          Total accounts in context: {accounts.length}
          <br />
          Search term: "{searchTerm}"<br />
          Last search API call: {isSearching ? "In progress..." : "Completed"}
        </div>
      )}
    </div>
  );
}
