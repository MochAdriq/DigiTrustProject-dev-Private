"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { useAccounts } from "@/contexts/account-context";
import { type AccountType } from "@/lib/database-service";
import { AlertCircle, Info, Shield, Package } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function BulkImport() {
  const { toast } = useToast();
  const { addAccounts, addGaransiAccounts, addAccountsWithCustomProfiles } =
    useAccounts();
  const [emails, setEmails] = useState("");
  const [password, setPassword] = useState("");
  const [accountType, setAccountType] = useState<AccountType>("private");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [warrantyMode, setWarrantyMode] = useState(false);
  const [warrantyDate, setWarrantyDate] = useState<Date>();
  const [customProfileMode, setCustomProfileMode] = useState(false);
  const [profileCount, setProfileCount] = useState<number>(8);

  const getDefaultProfileCount = (type: AccountType) => {
    // Pastikan tipe parameter: AccountType
    if (type === "private") return 8;
    if (type === "sharing") return 20;
    if (type === "vvip") return 5; // <-- Tambahkan case VVIP
    return 8;
  };

  const getMaxProfileCount = (type: AccountType) => {
    // Pastikan tipe parameter: AccountType
    if (type === "private") return 8;
    if (type === "sharing") return 20;
    if (type === "vvip") return 5; // <-- Tambahkan case VVIP
    return 8;
  };

  const handleAccountTypeChange = (type: AccountType) => {
    // Pastikan tipe parameter: AccountType
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

  const handleWarrantyModeToggle = (enabled: boolean) => {
    setWarrantyMode(enabled);
    if (enabled) {
      setCustomProfileMode(false);
      setProfileCount(getDefaultProfileCount(accountType));

      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() - 7);
      defaultDate.setHours(12, 0, 0, 0);

      console.log(
        "Setting warranty date to:",
        defaultDate.toISOString(),
        "Formatted:",
        format(defaultDate, "dd/MM/yyyy")
      );
      setWarrantyDate(defaultDate);
    } else {
      setWarrantyDate(undefined);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const emailList = emails
        .split("\n")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      if (emailList.length === 0) {
        throw new Error("Please enter at least one email address");
      }

      if (!password) {
        throw new Error("Please enter a password");
      }

      if (warrantyMode && !warrantyDate) {
        throw new Error("Please select warranty date");
      }

      if (
        !warrantyMode &&
        customProfileMode &&
        (profileCount < 1 || profileCount > getMaxProfileCount(accountType))
      ) {
        throw new Error(
          `Profile count must be between 1 and ${getMaxProfileCount(
            accountType
          )} for ${accountType} accounts`
        );
      }

      const accountsToAdd = emailList.map((email) => ({
        email,
        password,
        type: accountType,
      }));

      if (warrantyMode) {
        // Warranty mode: Add to separate garansi storage (NOT main stock)
        await addGaransiAccounts(accountsToAdd, warrantyDate!.toISOString());

        toast({
          title: "🛡️ Garansi Import Berhasil!",
          description: `Successfully imported ${
            emailList.length
          } ${accountType} accounts to GARANSI DATABASE (INFO ONLY) dengan ${getDefaultProfileCount(
            accountType
          )} profiles per akun, tanggal ${format(
            warrantyDate!,
            "dd/MM/yyyy"
          )}. Data ini TIDAK masuk ke stok utama.`,
          duration: 8000,
        });
      } else {
        // Normal mode: Add to main stock
        if (customProfileMode) {
          const accountsWithCustomProfiles = emailList.map((email) => ({
            email,
            password,
            type: accountType,
            profileCount,
          }));

          await addAccountsWithCustomProfiles(accountsWithCustomProfiles);
        } else {
          await addAccounts(accountsToAdd);
        }
      }

      // Reset form
      setEmails("");
      setPassword("");
      setWarrantyMode(false);
      setWarrantyDate(undefined);
      setCustomProfileMode(false);
      setProfileCount(getDefaultProfileCount(accountType));
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to import accounts"
      );
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

        {/* Mode Selection */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Warranty Mode */}
          <div className="zenith-card p-6 border-0">
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                id="warranty-mode"
                checked={warrantyMode}
                onChange={(e) => handleWarrantyModeToggle(e.target.checked)}
                className="rounded border-gray-300 w-5 h-5"
              />
              <Label
                htmlFor="warranty-mode"
                className="font-bold text-zenith-primary flex items-center"
              >
                <Shield className="h-5 w-5 mr-2" />
                🛡️ Mode Garansi (Info Only)
              </Label>
            </div>
            {warrantyMode && (
              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  <strong>Mode Garansi:</strong> Akun akan disimpan di database
                  garansi terpisah untuk referensi.
                  <strong className="text-red-600">
                    {" "}
                    Data ini TIDAK masuk ke stok utama
                  </strong>{" "}
                  dan hanya untuk tracking garansi customer.
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Custom Profile Mode */}
          {!warrantyMode && (
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
                    <strong>Custom Profile:</strong> Atur jumlah profile per
                    akun secara manual.{" "}
                    <strong className="text-green-600">
                      Akun akan masuk ke stok utama.
                    </strong>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>

        {/* Warranty Date Picker */}
        {warrantyMode && (
          <div className="space-y-3">
            <Label className="text-base font-semibold text-gray-700">
              📅 Tanggal Pembuatan Akun (untuk Garansi)
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "zenith-input w-full justify-start text-left font-normal h-14",
                    !warrantyDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {warrantyDate
                    ? format(warrantyDate, "dd/MM/yyyy")
                    : "Pilih tanggal masa lalu (max 6 bulan)"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={warrantyDate}
                  onSelect={setWarrantyDate}
                  defaultMonth={(() => {
                    if (warrantyDate) return warrantyDate;
                    const today = new Date();
                    return today;
                  })()}
                  disabled={(date) => {
                    const today = new Date();
                    const startOfToday = new Date(
                      today.getFullYear(),
                      today.getMonth(),
                      today.getDate(),
                      23,
                      59,
                      59,
                      999
                    );
                    const sixMonthsAgo = new Date();
                    sixMonthsAgo.setMonth(today.getMonth() - 6);
                    const startOfSixMonthsAgo = new Date(
                      sixMonthsAgo.getFullYear(),
                      sixMonthsAgo.getMonth(),
                      sixMonthsAgo.getDate(),
                      0,
                      0,
                      0,
                      0
                    );

                    return date > startOfToday || date < startOfSixMonthsAgo;
                  }}
                  fromMonth={(() => {
                    const sixMonthsAgo = new Date();
                    sixMonthsAgo.setMonth(new Date().getMonth() - 6);
                    return sixMonthsAgo;
                  })()}
                  toMonth={new Date()}
                  captionLayout="dropdown-buttons"
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <div className="text-sm text-gray-500 space-y-1">
              <p>✅ Pilih tanggal dalam 6 bulan terakhir (masa lalu saja)</p>
              <p>
                🎯 Default: 7 hari yang lalu (
                {format(
                  new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                  "dd/MM/yyyy"
                )}
                )
              </p>
              <p>⏰ Garansi 23 hari akan dihitung dari tanggal yang dipilih</p>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
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
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value="private"
                  id="private"
                  className="w-5 h-5"
                />
                <Label htmlFor="private" className="text-base">
                  Private (
                  {warrantyMode
                    ? `${getDefaultProfileCount("private")} profiles`
                    : customProfileMode
                    ? `Custom: ${profileCount}`
                    : `${getDefaultProfileCount("private")}`}{" "}
                  profiles)
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem
                  value="sharing"
                  id="sharing"
                  className="w-5 h-5"
                />
                <Label htmlFor="sharing" className="text-base">
                  Sharing (
                  {warrantyMode
                    ? `${getDefaultProfileCount("sharing")} profiles`
                    : customProfileMode
                    ? `Custom: ${profileCount}`
                    : `${getDefaultProfileCount("sharing")}`}{" "}
                  profiles)
                </Label>
              </div>
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="vvip" id="vvip" className="w-5 h-5" />
                <Label htmlFor="vvip" className="text-base">
                  VVIP (
                  {warrantyMode
                    ? `${getDefaultProfileCount("vvip")} profiles`
                    : customProfileMode
                    ? `Custom: ${profileCount}`
                    : `${getDefaultProfileCount("vvip")}`}{" "}
                  profiles)
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label
              htmlFor="shared-password"
              className="text-base font-semibold text-gray-700"
            >
              Shared Password
            </Label>
            <Input
              id="shared-password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter shared password for all accounts"
              className="zenith-input h-14"
              required
            />
          </div>
        </div>

        {/* Custom Profile Count Selector */}
        {!warrantyMode && customProfileMode && (
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
                  setProfileCount(Number.parseInt(e.target.value) || 1)
                }
                className="w-32 h-14"
                placeholder="Custom"
              />
            </div>
            <p className="text-sm text-gray-500">
              Pilih dari dropdown atau ketik manual. Contoh: Private dengan 5
              profile, Sharing dengan 15 profile.
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Label
            htmlFor="emails"
            className="text-base font-semibold text-gray-700"
          >
            Email Addresses (one per line)
          </Label>
          <Textarea
            id="emails"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="netflix1@example.com
netflix2@example.com
netflix3@example.com"
            className="min-h-[150px] zenith-input"
            required
          />
          <p className="text-sm text-gray-500">
            {warrantyMode
              ? `🛡️ Setiap akun akan disimpan di database garansi dengan ${getDefaultProfileCount(
                  accountType
                )} profile${
                  getDefaultProfileCount(accountType) > 1 ? "s" : ""
                } (INFO ONLY - TIDAK masuk stok)`
              : customProfileMode
              ? `📦 Setiap akun akan dibuat dengan ${profileCount} profile${
                  profileCount > 1 ? "s" : ""
                } (MASUK STOK UTAMA)`
              : `📦 Setiap akun akan dibuat dengan ${getDefaultProfileCount(
                  accountType
                )} profile${
                  getDefaultProfileCount(accountType) > 1 ? "s" : ""
                } (MASUK STOK UTAMA)`}
          </p>
        </div>

        <Button
          type="submit"
          className="zenith-button w-full h-16 text-lg font-bold"
          disabled={isLoading || (warrantyMode && !warrantyDate)}
        >
          {isLoading
            ? "Importing..."
            : warrantyMode
            ? "🛡️ Import ke Database Garansi (Info Only)"
            : customProfileMode
            ? `🎯 Import dengan ${profileCount} Profile${
                profileCount > 1 ? "s" : ""
              } (Masuk Stok)`
            : "📦 Import ke Stok Utama"}
        </Button>
      </form>

      {/* Info Panel */}
      <div className="zenith-card p-6 border-0">
        <h4 className="font-bold mb-4 gradient-text text-lg">
          💡 Perbedaan Mode Import:
        </h4>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div className="p-4 bg-blue-50 rounded-xl">
            <h5 className="font-bold text-blue-800 mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              🛡️ Mode Garansi (Info Only):
            </h5>
            <ul className="space-y-1 list-disc list-inside text-blue-700">
              <li>
                <strong>TIDAK masuk ke stok utama</strong>
              </li>
              <li>Disimpan di database garansi terpisah</li>
              <li>Hanya untuk tracking garansi customer</li>
              <li>Selalu gunakan profile default (8/20)</li>
              <li>Bisa set tanggal historical</li>
              <li>Untuk customer service reference</li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-xl">
            <h5 className="font-bold text-green-800 mb-2 flex items-center">
              <Package className="h-4 w-4 mr-2" />
              📦 Mode Normal (Masuk Stok):
            </h5>
            <ul className="space-y-1 list-disc list-inside text-green-700">
              <li>
                <strong>MASUK ke stok utama</strong>
              </li>
              <li>Bisa custom jumlah profile</li>
              <li>Tanggal otomatis hari ini</li>
              <li>Untuk operasional sehari-hari</li>
              <li>Bisa di-request oleh operator</li>
              <li>Menambah hitungan available profiles</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
          <h4 className="font-bold text-yellow-900 mb-2">
            ⚠️ PENTING - Pemisahan Data:
          </h4>
          <ul className="text-sm text-yellow-800 space-y-1 list-disc list-inside">
            <li>
              <strong>Mode Garansi</strong> = Database terpisah, tidak ada
              custom profile, TIDAK masuk stok
            </li>
            <li>
              <strong>Mode Normal</strong> = Stok utama, bisa custom profile,
              untuk operasional
            </li>
            <li>Stok counter hanya menghitung akun dari mode normal</li>
            <li>Fitur garansi tidak mempengaruhi available profiles (8/20)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
