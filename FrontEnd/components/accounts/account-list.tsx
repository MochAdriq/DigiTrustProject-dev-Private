"use client";

import { useState, useEffect, useCallback } from "react"; // Import useCallback
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAccounts } from "@/contexts/account-context";
import { ListFilter, Edit, Trash } from "lucide-react";
import EditAccountDialog from "./edit-account-dialog"; // Pastikan path ini benar
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import LoadingSpinner from "../shared/loading-spinner";
import { useAuth } from "@/hooks/use-auth";
import type { Account } from "@prisma/client"; // Impor tipe Account

// Helper untuk tipe Profile (jika belum ada secara global)
type Profile = { profile: string; pin: string; used: boolean };

// Helper untuk judul card
const getTitle = (type: "private" | "sharing" | "vip"): string => {
  switch (type) {
    case "private":
      return "Private";
    case "sharing":
      return "Sharing";
    case "vip":
      return "VIP";
    default:
      return "Unknown";
  }
};

interface AccountListProps {
  type: "private" | "sharing" | "vip";
}

export default function AccountList({ type }: AccountListProps) {
  // Ambil fungsi dan state dari context
  // getAccountsByType di context sudah benar (filter client-side state)
  const {
    getAccountsByType,
    getRemainingDays,
    deleteAccount,
    isLoading: isContextLoading,
  } = useAccounts();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  // State lokal
  // Gabungkan state loading context dan lokal
  const [isLoading, setIsLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null); // Gunakan tipe Account
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [accountIdToDelete, setAccountIdToDelete] = useState<string | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Update loading state berdasarkan context dan loading lokal
  useEffect(() => {
    // Jika context selesai loading DAN loading lokal selesai
    if (!isContextLoading) {
      // Beri sedikit jeda agar UI tidak terasa 'jumpy'
      const timer = setTimeout(() => setIsLoading(false), 200);
      return () => clearTimeout(timer);
    } else {
      setIsLoading(true); // Tetap loading jika context masih loading
    }
  }, [isContextLoading]);

  // Handler Edit (gunakan useCallback)
  const handleEdit = useCallback((account: Account) => {
    // Pastikan mengirim data yang benar ke dialog
    // Tipe Account dari Prisma harusnya sudah pakai expiresAt (camelCase)
    setEditingAccount(account);
    setIsEditDialogOpen(true);
  }, []); // Dependency kosong karena fungsi tidak bergantung state komponen ini

  // Handler Delete (gunakan useCallback)
  const handleDelete = useCallback((accountId: string) => {
    setAccountIdToDelete(accountId);
    setIsDeleteDialogOpen(true);
  }, []);

  // Konfirmasi Delete (gunakan useCallback)
  const confirmDelete = useCallback(async () => {
    if (!accountIdToDelete) return;

    setIsDeleting(true);
    try {
      // Panggil deleteAccount dari context (yang memanggil API)
      const success = await deleteAccount(accountIdToDelete);
      // Context sudah handle toast
      if (!success) {
        console.error("Delete operation failed in context.");
        // Mungkin tampilkan toast error spesifik di sini jika perlu
      }
    } catch (error) {
      console.error("Error during delete confirmation:", error);
      // Context sudah handle toast error
    } finally {
      setIsDeleting(false);
      setAccountIdToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  }, [accountIdToDelete, deleteAccount]); // Tambahkan dependency

  // Ambil data yang sudah difilter dari context (client-side filter)
  const filteredAccounts = getAccountsByType(type);

  // Tampilkan loading jika context ATAU loading lokal aktif
  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Card className="border-gray-200 shadow-sm">
        {/* --- JUDUL CARD DINAMIS --- */}
        <CardHeader className="bg-blue-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <ListFilter className="mr-2 h-5 w-5" />
            {getTitle(type)} Accounts {/* Gunakan helper getTitle */}
          </CardTitle>
        </CardHeader>
        {/* --- AKHIR JUDUL CARD --- */}
        <CardContent className="pt-6">
          {filteredAccounts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                No {type} accounts found
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Password</TableHead>
                    <TableHead className="text-center">
                      Profiles (Avail/Total)
                    </TableHead>
                    <TableHead className="text-center">Days Left</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Gunakan tipe Account di map */}
                  {filteredAccounts.map((account: Account) => {
                    // --- PERHITUNGAN PROFIL LEBIH AMAN ---
                    let availableProfiles = 0;
                    let totalProfiles = 0;
                    let profileDisplay = "-/-";
                    if (Array.isArray(account.profiles)) {
                      try {
                        const profilesArray =
                          account.profiles as unknown as Profile[];
                        totalProfiles = profilesArray.length;
                        availableProfiles = profilesArray.filter(
                          (p) =>
                            typeof p === "object" &&
                            p !== null &&
                            p.used === false
                        ).length;
                        profileDisplay = `${availableProfiles}/${totalProfiles}`;
                      } catch (e) {
                        console.error("Error processing profiles:", e);
                        profileDisplay = "Error";
                      }
                    }
                    // --- AKHIR PERHITUNGAN PROFIL ---

                    // --- LOGIKA STATUS EXPIRED DISAMAKAN ---
                    const daysLeft = getRemainingDays(account);
                    const isExpired = daysLeft < 0; // Expired jika negatif
                    const isExpiringToday = daysLeft === 0 && !isExpired; // Kondisi hari ini
                    const isActive = !isExpired && !isExpiringToday;
                    // --- AKHIR LOGIKA STATUS ---

                    return (
                      <TableRow
                        key={account.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <TableCell className="font-medium text-sm">
                          {account.email}
                        </TableCell>
                        <TableCell className="text-sm">
                          {account.password}
                        </TableCell>
                        <TableCell className="text-center">
                          {/* Badge Profil */}
                          <Badge
                            variant={
                              availableProfiles === 0
                                ? "destructive"
                                : availableProfiles < totalProfiles / 3
                                ? "secondary" // Ubah threshold jika perlu
                                : "default" // Ganti 'success'
                            }
                            className="font-mono text-xs" // Styling tambahan
                          >
                            {profileDisplay}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {/* Badge Sisa Hari */}
                          <Badge
                            variant={
                              daysLeft <= 3
                                ? "destructive"
                                : daysLeft <= 7
                                ? "secondary" // Ganti yellow ke secondary
                                : "default" // Ganti green ke default
                            }
                            className="font-mono text-xs"
                          >
                            {daysLeft} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {/* Badge Status */}
                          {account.reported ? (
                            <Badge variant="destructive" className="text-xs">
                              Reported
                            </Badge>
                          ) : isExpired ? (
                            <Badge variant="destructive" className="text-xs">
                              Expired ({Math.abs(daysLeft)}d ago)
                            </Badge>
                          ) : isExpiringToday ? (
                            <Badge variant="secondary" className="text-xs">
                              Expires Today
                            </Badge> // Warna beda untuk hari ini
                          ) : (
                            <Badge
                              variant="default"
                              className="text-xs bg-green-600 hover:bg-green-700"
                            >
                              {" "}
                              {/* Default = Aktif */}
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {/* Tombol Actions */}
                          <div className="flex justify-end space-x-1">
                            <Button
                              variant="ghost" // Lebih halus
                              size="icon"
                              onClick={
                                isAdmin ? () => handleEdit(account) : undefined
                              }
                              className={`h-7 w-7 text-blue-600 hover:bg-blue-100 ${
                                !isAdmin && "opacity-50 cursor-not-allowed"
                              }`}
                              disabled={!isAdmin}
                              aria-disabled={!isAdmin}
                              title="Edit Account" // Tambah tooltip
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost" // Lebih halus
                              size="icon"
                              onClick={
                                isAdmin
                                  ? () => handleDelete(account.id)
                                  : undefined
                              }
                              className={`h-7 w-7 text-red-600 hover:bg-red-100 ${
                                !isAdmin && "opacity-50 cursor-not-allowed"
                              }`}
                              disabled={!isAdmin}
                              aria-disabled={!isAdmin}
                              title="Delete Account" // Tambah tooltip
                            >
                              <Trash className="h-4 w-4" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Edit */}
      {editingAccount && (
        <EditAccountDialog
          account={editingAccount}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}

      {/* Dialog Konfirmasi Delete */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              account{" "}
              <strong>
                {/* --- PERBAIKAN DI SINI --- */}
                {/* Gunakan filteredAccounts dan beri tipe 'Account' pada 'acc' */}
                {filteredAccounts.find(
                  (acc: Account) => acc.id === accountIdToDelete
                )?.email || ""}
                {/* --- AKHIR PERBAIKAN --- */}
              </strong>
              .
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700" // Warna delete lebih kuat
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, delete account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
