"use client";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useAccounts } from "@/contexts/account-context";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Sparkles, Save, RefreshCw, LogOut } from "lucide-react";

// Props title dan subtitle tidak lagi dibutuhkan karena header sekarang statis
export function DashboardHeader() {
  const { logout } = useAuth();
  const { saveAllData, refreshData } = useAccounts();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await saveAllData();
      toast({
        title: "💾 Data Saved",
        description: "All data has been synchronized with the database.",
      });
    } catch (error) {
      toast({
        title: "❌ Save Failed",
        description: "Failed to save data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      toast({
        title: "🔄 Data Refreshed",
        description: "Data has been refreshed from the database.",
      });
    } catch (error) {
      toast({
        title: "❌ Refresh Failed",
        description: "Failed to refresh data. Please check your connection.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    // Menggunakan kelas dari contoh Anda untuk menciptakan efek kartu melayang
    <header className="zenith-card mx-4 mt-4 border-0 relative z-20">
      <div className="container mx-auto px-6 py-4 flex justify-between items-center">
        {/* Sisi Kiri Header */}
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-zenith-gradient rounded-xl">
            {/* Menggunakan logo asli */}
            <Image
              src="/images/trustdigital-logo.jpg"
              alt="TrustDigital.ID Logo"
              width={180}
              height={50}
              className="h-8 w-auto"
              style={{ color: "transparent" }}
            />
          </div>
          <div className="hidden md:block">
            <div className="flex items-center">
              <Sparkles className="h-5 w-5 text-zenith-primary mr-2" />
              <div className="text-lg font-bold gradient-text">
                Account Management System
              </div>
            </div>
          </div>
        </div>

        {/* Sisi Kanan Header */}
        <div className="flex items-center space-x-3">
          <Button
            aria-label="Manual save"
            title="Manual Save Data"
            variant="ghost"
            size="icon"
            onClick={handleSave}
            disabled={isSaving}
            className="h-10 w-10 rounded-xl hover:bg-green-100 text-green-600"
          >
            <Save className={`h-5 w-5 ${isSaving ? "animate-pulse" : ""}`} />
          </Button>

          <Button
            aria-label="Refresh data"
            title="Refresh Data"
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-10 w-10 rounded-xl hover:bg-blue-100 text-blue-600"
          >
            <RefreshCw
              className={`h-5 w-5 ${isRefreshing ? "animate-spin" : ""}`}
            />
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                className="bg-white/80 border-zenith-primary/20 text-zenith-primary hover:bg-zenith-gradient hover:text-white rounded-xl px-6 font-semibold"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="zenith-card">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">
                  Konfirmasi Logout
                </AlertDialogTitle>
                <AlertDialogDescription className="text-muted-foreground">
                  Apakah Anda yakin ingin keluar dari sistem?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleLogout}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Logout
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </header>
  );
}
