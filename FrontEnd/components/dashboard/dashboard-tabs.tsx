"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import AccountForm from "@/components/accounts/account-form";
import AccountList from "@/components/accounts/account-list";
import RequestAccount from "@/components/requests/request-account";
import BulkImport from "@/components/import/bulk-import";
import ReportedAccounts from "@/components/reports/reported-accounts";
import CustomerStatistics from "@/components/stats/customer-statistics";
import UserManagement from "@/components/users/user-management";
import ActivityLogs from "@/components/dashboard/activity-logs";
import OfflineBackup from "@/components/shared/offline-backup";
import NotificationSystem from "@/components/shared/notification-system";
import {
  FileUp,
  AlertTriangle,
  Search,
  BarChart,
  RefreshCw,
  Users,
  Shield,
  Activity,
  HardDrive,
  ShoppingCart,
  Star,
  PlusCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AccountSearch from "@/components/accounts/account-search";
import { useAccounts, AccountType } from "@/contexts/account-context";
import LoadingSpinner from "../shared/loading-spinner";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardTabs() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const { isLoading, refreshData } = useAccounts();
  const [activeTab, setActiveTab] = useState<AccountType>("private");
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false); // <-- State baru untuk dialog "Add Account"
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isGaransiOpen, setIsGaransiOpen] = useState(false);
  const [isActivityLogsOpen, setIsActivityLogsOpen] = useState(false);
  const [isBackupOpen, setIsBackupOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const user = localStorage.getItem("currentUser");
    if (user) {
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
      if (parsedUser.role === "admin") {
        setActiveTab("private");
      }
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setIsRefreshing(false);
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <NotificationSystem />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as AccountType)}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-4">
          {/* ======== BAGIAN KIRI ======== */}
          <TooltipProvider>
            <div className="flex items-center space-x-4">
              <TabsList className="grid w-auto grid-cols-3 mr-2 bg-blue-50 p-1 rounded-lg">
                <TabsTrigger
                  value="private"
                  className="px-6 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Private
                </TabsTrigger>
                <TabsTrigger
                  value="sharing"
                  className="px-6 rounded-md data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Sharing
                </TabsTrigger>
                <TabsTrigger
                  value="vip"
                  className="px-6 rounded-md data-[state=active]:bg-yellow-500 data-[state=active]:text-white"
                >
                  <Star className="w-4 h-4 mr-2" /> vip
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center space-x-2">
                <TooltipProvider>
                  <div className="flex items-center space-x-2">
                    {" "}
                    {/* Pastikan Link ada di dalam div ini */}
                    <Dialog
                      open={isGaransiOpen}
                      onOpenChange={setIsGaransiOpen}
                    >
                      {" "}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href="/dashboard/garansi" passHref>
                            <Button
                              variant="outline"
                              size="icon"
                              className="text-blue-600 border-blue-300 hover:bg-blue-600 hover:text-white"
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Cek Garansi Akun (Halaman Baru)</p>
                        </TooltipContent>
                      </Tooltip>
                    </Dialog>{" "}
                    <Dialog
                      open={isBackupOpen}
                      onOpenChange={setIsBackupOpen}
                    ></Dialog>
                  </div>
                </TooltipProvider>
                <Dialog>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-blue-600 border-blue-300 hover:bg-blue-600 hover:text-white"
                        >
                          <AlertTriangle className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Lihat Akun Bermasalah</p>
                    </TooltipContent>
                  </Tooltip>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Reported Accounts</DialogTitle>
                    </DialogHeader>
                    <ReportedAccounts />
                  </DialogContent>
                </Dialog>
                <Dialog open={isBackupOpen} onOpenChange={setIsBackupOpen}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="text-green-600 border-green-300 hover:bg-green-600 hover:text-white"
                        >
                          <HardDrive className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Backup & Restore Data</p>
                    </TooltipContent>
                  </Tooltip>
                  <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>💾 Offline Backup & Import</DialogTitle>
                    </DialogHeader>
                    <OfflineBackup />
                  </DialogContent>
                </Dialog>
              </div>
              <>
                <div className="h-6 w-px bg-gray-300"></div>
                <div className="flex items-center space-x-2">
                  <Dialog open={isStatsOpen} onOpenChange={setIsStatsOpen}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-blue-600 border-blue-300 hover:bg-blue-600 hover:text-white"
                          >
                            <BarChart className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Lihat Statistik</p>
                      </TooltipContent>
                    </Tooltip>
                    <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Customer Statistics</DialogTitle>
                      </DialogHeader>
                      <CustomerStatistics />
                    </DialogContent>
                  </Dialog>
                  <Dialog
                    open={isActivityLogsOpen}
                    onOpenChange={setIsActivityLogsOpen}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-blue-600 border-blue-300 hover:bg-blue-600 hover:text-white"
                          >
                            <Activity className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Log Aktivitas</p>
                      </TooltipContent>
                    </Tooltip>
                    <DialogContent className="max-w-6xl max-h-[85vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Activity Logs</DialogTitle>
                      </DialogHeader>
                      <ActivityLogs />
                    </DialogContent>
                  </Dialog>
                  <Dialog
                    open={isUserManagementOpen}
                    onOpenChange={setIsUserManagementOpen}
                  >
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-blue-600 border-blue-300 hover:bg-blue-600 hover:text-white"
                            disabled={!isAdmin}
                          >
                            <Users className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isAdmin ? (
                          <p>Manajemen User.</p>
                        ) : (
                          <p>Anda tidak memiliki akses untuk Manajemen User.</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                    <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>User Management</DialogTitle>
                      </DialogHeader>
                      <UserManagement />
                    </DialogContent>
                  </Dialog>
                </div>
              </>
            </div>
          </TooltipProvider>

          {/* ======== BAGIAN KANAN ======== */}
          <TooltipProvider>
            <div className="flex items-center space-x-2">
              {isAdmin && (
                <div className="flex space-x-2 border-r border-gray-300 pr-2 mr-2">
                  {" "}
                  <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          {/* Style bisa disesuaikan, misal pakai icon saja */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="bg-blue-600 hover:bg-blue-700 text-white border-0"
                            disabled={!isAdmin}
                          >
                            <PlusCircle className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isAdmin ? (
                          <p>Tambah 1 (satu) akun baru ke stok {activeTab}.</p>
                        ) : (
                          <p>Anda tidak memiliki akses untuk menambah akun.</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>
                          Add New{" "}
                          {activeTab.charAt(0).toUpperCase() +
                            activeTab.slice(1)}{" "}
                          Account
                        </DialogTitle>
                      </DialogHeader>
                      <AccountForm
                        type={activeTab}
                        onSuccess={() => setIsAddOpen(false)}
                      />
                    </DialogContent>
                  </Dialog>
                  <Dialog>
                    {" "}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-blue-600 border-blue-300 hover:bg-blue-600 hover:text-white"
                            disabled={!isAdmin}
                          >
                            <FileUp className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                      </TooltipTrigger>
                      <TooltipContent>
                        {isAdmin ? (
                          <p>Impor banyak akun sekaligus via teks.</p>
                        ) : (
                          <p>Anda tidak memiliki akses untuk impor massal.</p>
                        )}
                      </TooltipContent>
                    </Tooltip>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Bulk Import Accounts</DialogTitle>
                      </DialogHeader>
                      <BulkImport />
                    </DialogContent>
                  </Dialog>
                </div>
              )}

              <Dialog open={isRequestOpen} onOpenChange={setIsRequestOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button className="bg-green-600 hover:bg-green-700 text-white font-bold">
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Request Account
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Buka form untuk meminta akun baru.</p>
                  </TooltipContent>
                </Tooltip>
                <DialogContent className="max-w-4xl">
                  <DialogHeader>
                    <DialogTitle>Request New Account</DialogTitle>
                  </DialogHeader>
                  <RequestAccount />
                </DialogContent>
              </Dialog>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="text-blue-600 border-blue-300 hover:bg-blue-600 hover:text-white"
                  >
                    <RefreshCw
                      className={`h-4 w-4 mr-1 ${
                        isRefreshing ? "animate-spin" : ""
                      }`}
                    />
                    <span className="sr-only md:not-sr-only md:inline">
                      Refresh
                    </span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Muat ulang data dari server.</p>
                </TooltipContent>
              </Tooltip>
              <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="text-blue-600 border-blue-300 hover:bg-blue-600 hover:text-white"
                      >
                        <Search className="h-4 w-4 mr-1" />
                        <span className="sr-only md:not-sr-only md:inline">
                          Search
                        </span>
                      </Button>
                    </DialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cari akun berdasarkan email.</p>
                  </TooltipContent>
                </Tooltip>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Search Accounts</DialogTitle>
                  </DialogHeader>
                  <AccountSearch onClose={() => setIsSearchOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </TooltipProvider>
        </div>

        {/* Konten Tab untuk Admin (Sekarang hanya menampilkan daftar akun) */}
        <div className="mt-6">
          <TabsContent value="private">
            <AccountList type="private" />
          </TabsContent>
          <TabsContent value="sharing">
            <AccountList type="sharing" />
          </TabsContent>
          <TabsContent value="vip">
            {/* Placeholder untuk vip, kita akan fungsikan AccountList di sini nanti */}
            <AccountList type="vip" />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
