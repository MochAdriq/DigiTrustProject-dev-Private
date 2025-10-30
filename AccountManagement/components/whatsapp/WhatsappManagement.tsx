"use client";

import { useState, useCallback } from "react";
import { useAccounts } from "@/contexts/account-context";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import type { WhatsappAccount } from "@prisma/client"; // Import tipe

// Komponen Form untuk Add/Edit (bisa dipisah ke file lain jika kompleks)
interface WaFormProps {
  initialData?: WhatsappAccount | null; // Untuk mode edit
  onSubmit: (data: { name: string; number: string }) => Promise<void>;
  onClose: () => void;
}

function WaForm({ initialData, onSubmit, onClose }: WaFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [number, setNumber] = useState(initialData?.number || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !number.trim()) {
      toast({
        title: "Error",
        description: "Nama dan Nomor WA tidak boleh kosong.",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ name: name.trim(), number: number.trim() });
      onClose(); // Tutup dialog jika sukses
    } catch (error) {
      // Toast error sudah dihandle di context, tapi bisa tambah di sini jika perlu
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="wa-name">Nama Akun WA</Label>
        <Input
          id="wa-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="cth: WA META"
          required
          disabled={isSubmitting}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="wa-number">Nomor WA</Label>
        <Input
          id="wa-number"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="cth: 081234567890"
          required
          disabled={isSubmitting}
        />
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline" disabled={isSubmitting}>
            Batal
          </Button>
        </DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...
            </>
          ) : initialData ? (
            "Simpan Perubahan"
          ) : (
            "Tambah Akun WA"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

// Komponen Utama Manajemen WA
export default function WhatsappManagement() {
  const {
    whatsappAccounts,
    addWhatsappAccount,
    updateWhatsappAccount, // Kita akan pakai ini nanti
    deleteWhatsappAccount, // Kita akan pakai ini nanti
    isLoading, // Ambil status loading global
  } = useAccounts();
  const { toast } = useToast();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  // State untuk edit/delete bisa ditambahkan di sini
  // const [editData, setEditData] = useState<WhatsappAccount | null>(null);
  // const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = useState(false);
  // const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleAddSubmit = async (data: { name: string; number: string }) => {
    await addWhatsappAccount(data); // Panggil fungsi context
    // Toast sukses/error sudah dihandle di context
  };

  // Fungsi handleEditSubmit dan handleDelete nanti ditambahkan di sini

  if (isLoading && whatsappAccounts.length === 0) {
    // Tampilkan loading hanya jika data belum ada sama sekali
    return <div className="text-center p-6">Memuat daftar akun WA...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Tambah WA Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Tambah Akun WhatsApp Baru</DialogTitle>
            </DialogHeader>
            <WaForm
              onSubmit={handleAddSubmit}
              onClose={() => setIsAddDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Akun WA</TableHead>
              <TableHead>Nomor WA</TableHead>
              <TableHead className="text-right w-[120px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {whatsappAccounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  Belum ada akun WA ditambahkan.
                </TableCell>
              </TableRow>
            ) : (
              whatsappAccounts.map((wa) => (
                <TableRow key={wa.id}>
                  <TableCell className="font-medium">{wa.name}</TableCell>
                  <TableCell>{wa.number}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      // onClick={() => handleEditClick(wa)} // Logika edit nanti
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      // onClick={() => handleDeleteClick(wa.id)} // Logika delete nanti
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialog untuk Edit nanti di sini */}
      {/* <Dialog open={!!editData} onOpenChange={() => setEditData(null)}> ... </Dialog> */}

      {/* Dialog Konfirmasi Delete nanti di sini */}
      {/* <AlertDialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}> ... </AlertDialog> */}
    </div>
  );
}
