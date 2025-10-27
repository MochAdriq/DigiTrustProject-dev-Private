"use client";

import { useState, useEffect } from "react";
import { AccountProvider, useAccounts } from "@/contexts/account-context";
import { GaransiHeader } from "@/components/garansi/garansi-header";
import LoadingSpinner from "@/components/shared/loading-spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  Shield,
  Copy,
  Info,
  Database,
  PlusCircle,
  Clock,
  CalendarPlus,
} from "lucide-react";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import GaransiForm from "@/components/garansi/garansi-form";
import { Label } from "@/components/ui/label"; // Pastikan Label diimpor
import type { AccountType, GaransiAccount } from "@prisma/client"; // Impor GaransiAccount

// Di atas komponen GaransiView
const profileCounts: Record<AccountType, number> = {
  sharing: 20,
  private: 8,
  vip: 6,
};

// Asumsi tipe Profile sudah benar (sesuaikan jika perlu)
type Profile = { profile: string; pin: string; used: boolean };

// Komponen Inti (View) - SUDAH DIPERBARUI
function GaransiView() {
  const {
    getGaransiAccountsByDate,
    getGaransiAccountsByExpiresAt,
    getRemainingDays,
    garansiAccounts, // Total garansi accounts for summary
  } = useAccounts();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [accounts, setAccounts] = useState<GaransiAccount[]>([]); // Gunakan tipe GaransiAccount
  const [isLoadingView, setIsLoadingView] = useState(false);
  const [filterType, setFilterType] = useState<"warrantyDate" | "expiresAt">(
    "warrantyDate"
  );

  const handleDateSelect = async (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    setIsLoadingView(true);
    setAccounts([]);

    try {
      let dateAccounts: GaransiAccount[] = [];

      // --- PERBAIKAN 1: Kirim Tanggal sebagai String ISO ---
      const dateString = date.toISOString();
      // --- AKHIR PERBAIKAN 1 ---

      if (filterType === "warrantyDate") {
        dateAccounts = await getGaransiAccountsByDate(dateString);
      } else {
        dateAccounts = await getGaransiAccountsByExpiresAt(dateString);
      }
      setAccounts(dateAccounts);
    } catch (error) {
      console.error("Failed to load garansi accounts:", error);
      toast({
        title: "❌ Error",
        description: "Gagal memuat data akun garansi.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingView(false);
    }
  };

  const copyAccountDetails = (account: GaransiAccount) => {
    const textToCopy = `Email: ${account.email}\nPassword: ${account.password}`;
    navigator.clipboard.writeText(textToCopy);
    toast({
      title: "✅ Tersalin",
      description: "Email dan password akun tersalin.",
    });
  };

  const copyAllAccounts = () => {
    if (accounts.length === 0) return;
    const allText = accounts
      .map((acc) => `Email: ${acc.email}\nPassword: ${acc.password}`)
      .join("\n\n");
    navigator.clipboard.writeText(allText);
    toast({
      title: "✅ Semua Tersalin",
      description: `${accounts.length} akun garansi tersalin.`,
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            📅 Cek Akun Garansi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Bagian Filter & Kalender */}
          <div className="space-y-6 mb-6">
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-700">
                1. Pilih Tipe Pencarian
              </Label>
              <div className="flex gap-4">
                <Button
                  variant={
                    filterType === "warrantyDate" ? "default" : "outline"
                  }
                  onClick={() => {
                    setFilterType("warrantyDate");
                    setSelectedDate(undefined);
                    setAccounts([]);
                  }}
                  className="flex-1"
                >
                  <CalendarPlus className="mr-2 h-4 w-4" />
                  Cari berdasarkan Tanggal Dibuat
                </Button>
                <Button
                  variant={filterType === "expiresAt" ? "default" : "outline"}
                  onClick={() => {
                    setFilterType("expiresAt");
                    setSelectedDate(undefined);
                    setAccounts([]);
                  }}
                  className="flex-1"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Cari berdasarkan Tanggal Kadaluarsa
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-700">
                2. Pilih Tanggal
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-14 border-gray-300",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5" />
                    {selectedDate
                      ? format(selectedDate, "dd MMMM yyyy")
                      : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    captionLayout="dropdown"
                    fromYear={new Date().getFullYear() - 2}
                    toYear={new Date().getFullYear() + 5}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-sm text-gray-500">
                {filterType === "warrantyDate"
                  ? "Melihat akun garansi yang DITAMBAHKAN pada tanggal ini."
                  : "Melihat akun garansi yang AKAN KADALUARSA pada tanggal ini."}
              </p>
            </div>
          </div>
          {/* Akhir Bagian Filter */}

          {isLoadingView && <LoadingSpinner />}

          {!isLoadingView && selectedDate && accounts.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Hasil untuk {format(selectedDate, "dd MMMM yyyy")} (
                  {accounts.length} akun)
                </h3>
                <Button onClick={copyAllAccounts} size="sm">
                  <Copy className="h-4 w-4 mr-2" /> Copy Semua
                </Button>
              </div>
              <Alert className="bg-blue-50 border-blue-200">
                <Database className="h-4 w-4" />
                <AlertDescription>
                  Data ini dari database garansi terpisah &{" "}
                  <strong>TIDAK mempengaruhi stok utama</strong>. Total garansi
                  di sistem: <strong>{garansiAccounts.length}</strong>.
                </AlertDescription>
              </Alert>
              <div className="overflow-x-auto">
                {/* Tabel Diperbarui */}
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Password</TableHead>
                      <TableHead>Platform</TableHead>
                      <TableHead>Tipe</TableHead>
                      <TableHead className="text-center">Profiles</TableHead>
                      <TableHead>Ditambahkan</TableHead>
                      <TableHead>Kadaluarsa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Copy</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accounts.map((account) => {
                      // Gunakan objek akun utuh saat memanggil getRemainingDays
                      const daysLeft = getRemainingDays(account);
                      const isExpired = daysLeft < 0; // Hanya expired jika < 0
                      const isExpiringToday = daysLeft === 0 && !isExpired;

                      const totalProfiles = profileCounts[account.type] ?? 0;
                      let usedProfilesCount = 0;
                      let profileDisplay = "-/-";

                      if (Array.isArray(account.profiles)) {
                        try {
                          const profilesArray =
                            account.profiles as unknown as Profile[];
                          usedProfilesCount = profilesArray.filter(
                            (p) =>
                              typeof p === "object" &&
                              p !== null &&
                              p.used === true
                          ).length;
                          const availableProfilesCount =
                            totalProfiles - usedProfilesCount;
                          profileDisplay = `${availableProfilesCount}/${totalProfiles}`;
                        } catch (e) {
                          console.error(
                            "Error parsing profiles for:",
                            account.email,
                            e
                          );
                          profileDisplay = "Error";
                        }
                      }

                      return (
                        <TableRow key={account.id}>
                          <TableCell className="font-medium">
                            {account.email}
                          </TableCell>
                          <TableCell>{account.password}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{account.platform}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                account.type === "vip"
                                  ? "default"
                                  : account.type === "private"
                                  ? "secondary"
                                  : "outline"
                              }
                            >
                              {account.type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {profileDisplay}
                          </TableCell>
                          <TableCell>
                            {/* Pastikan warrantyDate tidak null */}
                            {account.warrantyDate
                              ? format(
                                  new Date(account.warrantyDate),
                                  "dd MMM yyyy"
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {/* Pastikan expiresAt tidak null */}
                            {account.expiresAt
                              ? format(
                                  new Date(account.expiresAt),
                                  "dd MMM yyyy"
                                )
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {/* --- PERBAIKAN 2: Varian Badge --- */}
                            <Badge
                              variant={
                                isExpired
                                  ? "destructive"
                                  : isExpiringToday
                                  ? "secondary"
                                  : "default"
                              }
                            >
                              {isExpired
                                ? `Expired (${Math.abs(daysLeft)} hari lalu)`
                                : isExpiringToday
                                ? "Expires Today"
                                : `Aktif (${daysLeft} hari lagi)`}
                            </Badge>
                            {/* --- AKHIR PERBAIKAN 2 --- */}
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() => copyAccountDetails(account)}
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8"
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {/* Akhir Tabel Diperbarui */}
              </div>
            </div>
          )}

          {/* Tampilan Hasil Kosong & Belum Pilih Tanggal */}
          {!isLoadingView && selectedDate && accounts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>
                Tidak ada akun garansi ditemukan untuk tanggal{" "}
                {format(selectedDate, "dd MMMM yyyy")}.
              </p>
            </div>
          )}
          {!selectedDate && !isLoadingView && (
            <div className="text-center py-8 text-gray-500">
              <p>Silakan pilih tanggal di atas.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Komponen Utama Halaman Garansi
export default function GaransiClientPage() {
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
    setIsLoadingAuth(false);
  }, []);

  const isAdmin = currentUser?.role === "admin";

  if (isLoadingAuth) {
    return <LoadingSpinner />;
  }

  return (
    // AccountProvider membungkus seluruh konten halaman
    <AccountProvider>
      <div className="min-h-screen bg-zenith-bg relative overflow-hidden">
        <div className="floating-elements"></div>
        <GaransiHeader />
        <main className="container mx-auto py-8 px-4 relative z-10 space-y-8">
          {/* Card Input Admin */}
          {isAdmin && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PlusCircle className="mr-2 h-5 w-5" /> Tambah Akun Garansi
                  Baru
                </CardTitle>
              </CardHeader>
              <CardContent>
                <GaransiForm />
              </CardContent>
            </Card>
          )}

          {/* Komponen View Tabel */}
          <GaransiView />

          {/* Card Cara Penggunaan */}
          {/* <Card className="border-gray-200 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg gradient-text">
                <Info className="mr-3 h-5 w-5" /> 📋 Cara Penggunaan Fitur
                Garansi
              </CardTitle>
            </CardHeader> */}
          {/* <CardContent> */}
          {/* Konten Card Cara Penggunaan */}
          {/* <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-bold mb-3 text-blue-800">
                    🔍 Untuk Operator:
                  </h4>
                  <ol className="text-sm space-y-2 list-decimal list-inside text-blue-700">
                    <li>
                      Pilih tipe pencarian: "Tanggal Dibuat" atau "Tanggal
                      Kadaluarsa".
                    </li> */}
          {/* <li>Pilih tanggal yang relevan.</li>
                    <li>Lihat daftar akun garansi yang sesuai.</li>
                    <li>Check status garansi (Aktif/Expired/Expires Today).</li>
                    <li>Copy detail akun jika diperlukan.</li>
                  </ol>
                </div>
                <div className="p-4 bg-green-50 rounded-xl">
                  <h4 className="font-bold mb-3 text-green-800">
                    👨‍💼 Untuk Admin:
                  </h4> */}
          {/* <ol className="text-sm space-y-2 list-decimal list-inside text-green-700">
                    <li>
                      Gunakan form di atas untuk menambah data akun garansi
                      baru.
                    </li>
                    <li>
                      Monitor akun yang akan kadaluarsa via filter "Tanggal
                      Kadaluarsa".
                    </li>
                    <li>
                      Lacak kapan akun ditambahkan via filter "Tanggal Dibuat".
                    </li>
                  </ol> */}
          {/* </div>
              </div>
              <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <h4 className="font-bold text-yellow-900 mb-3">
                  ⚠️ PENTING - Database Terpisah:
                </h4>
                <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
                  <li>
                    <strong>Database garansi terpisah</strong> - tidak
                    mempengaruhi stok utama.
                  </li> */}
          {/* <li>Data di halaman ini hanya untuk tracking garansi.</li>
                  <li>
                    Untuk menambah/mengelola stok utama, gunakan menu Dashboard.
                  </li>
                </ul>
              </div>
            </CardContent> */}
          {/* </Card> */}
        </main>
      </div>
    </AccountProvider> // Penutup AccountProvider
  );
}
