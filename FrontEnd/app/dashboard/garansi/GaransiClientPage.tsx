"use client";

import { useState, useEffect } from "react";
import { AccountProvider, useAccounts } from "@/contexts/account-context"; // Bungkus dengan Provider
import { GaransiHeader } from "@/components/garansi-header"; // Header baru
import LoadingSpinner from "@/components/loading-spinner";
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
} from "lucide-react"; // Ganti nama alias Calendar
import { Calendar as CalendarComponent } from "@/components/ui/calendar"; // Nama asli komponen Calendar
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
// Import komponen form yang akan dibuat
import GaransiForm from "@/components/garansi-form"; // Nanti di-uncomment

// Komponen Inti (dipindahkan dari garansi.tsx)
function GaransiView() {
  const { getGaransiAccountsByDate, getRemainingDays, garansiAccounts } =
    useAccounts();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [accounts, setAccounts] = useState<any[]>([]); // Tipe bisa diperbaiki
  const [isLoadingView, setIsLoadingView] = useState(false); // Ganti nama state loading

  const handleDateSelect = async (date: Date | undefined) => {
    // Buat async
    if (!date) return;
    setSelectedDate(date);
    setIsLoadingView(true);
    try {
      // Panggil fungsi async dari context (sesuaikan jika nama berubah di context)
      const dateAccounts = await getGaransiAccountsByDate(date);
      setAccounts(dateAccounts);
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to load garansi accounts.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingView(false);
    }
  };

  const copyAccountDetails = (account: any) => {
    /* ... (fungsi copy sama) ... */
  };
  const copyAllAccounts = () => {
    /* ... (fungsi copy all sama) ... */
  };

  // Salin JSX dari return Garansi di components/garansi.tsx ke sini
  // Sesuaikan sedikit:
  // - Ganti className="zenith-card" menjadi className="border-gray-200 shadow-sm" (contoh)
  // - Hapus CardHeader dengan judul awal
  // - Ganti isLoading menjadi isLoadingView
  // - Ganti Calendar menjadi CalendarIcon dan CalendarComponent
  return (
    <div className="space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            📅 Cek Akun Garansi Berdasarkan Tanggal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 mb-6">
            <label className="text-base font-semibold text-gray-700">
              Pilih Tanggal
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-14 border-gray-300", // Contoh penyesuaian style
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-5 w-5" />{" "}
                  {/* Ganti jadi CalendarIcon */}
                  {selectedDate
                    ? format(selectedDate, "dd/MM/yyyy")
                    : "Pilih tanggal"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent /* Ganti jadi CalendarComponent */
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  // disabled logic sama...
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            <p className="text-sm text-gray-500">
              Lihat akun garansi yang dibuat pada tanggal yang dipilih (Database
              Terpisah).
            </p>
          </div>

          {isLoadingView && <LoadingSpinner />}

          {!isLoadingView && selectedDate && accounts.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  Hasil untuk {format(selectedDate, "dd/MM/yyyy")} (
                  {accounts.length} akun)
                </h3>
                <Button onClick={copyAllAccounts} size="sm">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Semua
                </Button>
              </div>
              <Alert className="bg-blue-50 border-blue-200">
                <Database className="h-4 w-4" />
                <AlertDescription>
                  Data ini dari database garansi terpisah &{" "}
                  <strong>TIDAK mempengaruhi stok utama</strong>. Total garansi:{" "}
                  <strong>{garansiAccounts.length}</strong>.
                </AlertDescription>
              </Alert>
              <div className="overflow-x-auto">
                <Table>
                  {/* ... TableHeader sama ... */}
                  <TableBody>
                    {accounts.map((account) => {
                      const daysLeft = getRemainingDays(account);
                      const isUnderWarranty = daysLeft > 0;
                      return (
                        <TableRow key={account.id}>
                          {/* ... TableCell sama ... */}
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
              </div>
            </div>
          )}

          {!isLoadingView && selectedDate && accounts.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>
                Tidak ada akun garansi ditemukan untuk tanggal{" "}
                {format(selectedDate, "dd/MM/yyyy")}.
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
    // Bungkus konten dengan AccountProvider
    <AccountProvider>
      <div className="min-h-screen bg-zenith-bg relative overflow-hidden">
        <div className="floating-elements"></div>
        <GaransiHeader /> {/* Header baru */}
        <main className="container mx-auto py-8 px-4 relative z-10 space-y-8">
          {/* Bagian Input Akun (Hanya Admin) */}
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

          {/* Bagian Cek Akun (Semua Role) */}
          <GaransiView />

          {/* ▼▼▼ TAMBAHKAN KODE DI BAWAH INI ▼▼▼ */}
          <Card className="border-gray-200 shadow-sm">
            {" "}
            {/* Sesuaikan style card jika perlu */}
            <CardHeader>
              <CardTitle className="flex items-center text-lg gradient-text">
                {" "}
                {/* Style disesuaikan */}
                <Info className="mr-3 h-5 w-5" /> 📋 Cara Penggunaan Fitur
                Garansi
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-bold mb-3 text-blue-800">
                    🔍 Untuk Operator:
                  </h4>
                  <ol className="text-sm space-y-2 list-decimal list-inside text-blue-700">
                    <li>Pilih tanggal pembuatan akun customer</li>
                    <li>
                      Lihat daftar akun garansi yang dibuat pada tanggal
                      tersebut
                    </li>
                    <li>Check status garansi (masih berlaku/expired)</li>
                    <li>Copy detail akun untuk customer service</li>
                  </ol>
                </div>

                <div className="p-4 bg-green-50 rounded-xl">
                  <h4 className="font-bold mb-3 text-green-800">
                    👨‍💼 Untuk Admin:
                  </h4>
                  <ol className="text-sm space-y-2 list-decimal list-inside text-green-700">
                    <li>Monitor akun garansi berdasarkan tanggal pembuatan</li>
                    <li>Track status garansi semua akun</li>
                    <li>
                      Gunakan form di atas untuk menambah data akun garansi baru
                    </li>{" "}
                    {/* Penyesuaian teks */}
                    <li>Analisis performa akun per tanggal</li>
                  </ol>
                </div>
              </div>

              <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                <h4 className="font-bold text-yellow-900 mb-3">
                  ⚠️ PENTING - Database Terpisah:
                </h4>
                <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
                  <li>
                    <strong>Database garansi terpisah</strong> - tidak
                    mempengaruhi stok utama
                  </li>
                  <li>
                    Data yang ditampilkan dan ditambahkan di halaman ini adalah
                    akun garansi yang tidak masuk hitungan stok (8/20/5)
                  </li>
                  <li>
                    Gunakan untuk customer service dan tracking garansi saja
                  </li>
                  <li>
                    Untuk menambah akun ke stok utama, gunakan "Add Account"
                    atau "Bulk Import" (mode normal) di Dashboard utama
                  </li>
                  <li>
                    Stok counter di Dashboard utama hanya menghitung akun dari
                    database utama
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
          {/* ▲▲▲ AKHIR KODE TAMBAHAN ▲▲▲ */}
        </main>
      </div>
    </AccountProvider>
  );
}
