"use client";

import { useState, useEffect } from "react";
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
import EditAccountDialog from "./edit-account-dialog";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";

interface AccountListProps {
  type: "private" | "sharing" | "vip";
}

export default function AccountList({ type }: AccountListProps) {
  const { getAccountsByType, getRemainingDays, deleteAccount, isLoading } =
    useAccounts();

  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [isLocalLoading, setIsLocalLoading] = useState(true);
  const [editingAccount, setEditingAccount] = useState<{
    id: string;
    email: string;
    password: string;
    expires_at: string;
  } | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [accountIdToDelete, setAccountIdToDelete] = useState<string | null>(
    null
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Simulate loading for a better UX
    const timer = setTimeout(() => {
      setIsLocalLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleEdit = (account: {
    id: string;
    email: string;
    password: string;
    expires_at: string;
  }) => {
    setEditingAccount(account);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (accountId: string) => {
    setAccountIdToDelete(accountId);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (accountIdToDelete) {
      setIsDeleting(true);
      try {
        await deleteAccount(accountIdToDelete);
      } catch (error) {
        console.error("Error deleting account:", error);
      } finally {
        setIsDeleting(false);
        setAccountIdToDelete(null);
        setIsDeleteDialogOpen(false);
      }
    }
  };

  const filteredAccounts = getAccountsByType(type);

  if (isLoading || isLocalLoading) {
    return <LoadingSpinner />;
  }

  return (
    <>
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-blue-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center">
            <ListFilter className="mr-2 h-5 w-5" />
            {type === "private" ? "Private" : "Sharing"} Accounts
          </CardTitle>
        </CardHeader>
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
                    <TableHead>Available/Total</TableHead>
                    <TableHead>Days Left</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAccounts.map((account) => {
                    const availableProfiles = account.profiles.filter(
                      (p) => !p.used
                    ).length;
                    const totalProfiles = account.profiles.length;
                    const daysLeft = getRemainingDays(account);

                    return (
                      <TableRow
                        key={account.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <TableCell className="font-medium">
                          {account.email}
                        </TableCell>
                        <TableCell>{account.password}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              availableProfiles === 0
                                ? "bg-red-500"
                                : availableProfiles < totalProfiles / 2
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }
                          >
                            {availableProfiles}/{totalProfiles}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              daysLeft <= 3
                                ? "bg-red-500"
                                : daysLeft <= 7
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }
                          >
                            {daysLeft} days
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {account.reported ? (
                            <Badge variant="destructive">Reported</Badge>
                          ) : daysLeft === 0 ? (
                            <Badge variant="destructive">Expired</Badge>
                          ) : (
                            <Badge
                              variant="outline"
                              className="bg-green-100 text-green-800 border-green-300"
                            >
                              Active
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={
                                isAdmin
                                  ? () =>
                                      handleEdit({
                                        id: account.id,
                                        email: account.email,
                                        password: account.password,
                                        expires_at: account.expiresAt,
                                      })
                                  : undefined
                              }
                              className={`h-8 w-8 border-blue-300 text-blue-600 hover:bg-blue-600 hover:text-white ${
                                !isAdmin &&
                                "opacity-50 cursor-not-allowed pointer-events-none"
                              }`} // Tambah style disabled
                              disabled={!isAdmin} // Tambahkan disabled
                              aria-disabled={!isAdmin} // Tambahkan aria-disabled
                            >
                              <Edit className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={
                                isAdmin
                                  ? () => handleDelete(account.id)
                                  : undefined
                              }
                              className={`h-8 w-8 border-red-300 text-red-500 hover:text-red-600 hover:border-red-300 ${
                                !isAdmin &&
                                "opacity-50 cursor-not-allowed pointer-events-none"
                              }`} // Tambah style disabled
                              disabled={!isAdmin} // Tambahkan disabled
                              aria-disabled={!isAdmin} // Tambahkan aria-disabled
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

      {editingAccount && (
        <EditAccountDialog
          account={editingAccount}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
        />
      )}

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              account and all its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-500 hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
