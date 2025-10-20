"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { getAllUsers, addUser, updateUserPassword, deleteUser } from "@/lib/auth"
import { UserPlus, Trash, Key } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function UserManagement() {
  const { toast } = useToast()
  const [users, setUsers] = useState(getAllUsers())
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<string>("")

  // Form states
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [newName, setNewName] = useState("")
  const [newRole, setNewRole] = useState<"admin" | "operator">("operator")
  const [changePassword, setChangePassword] = useState("")

  const handleAddUser = () => {
    if (!newUsername || !newPassword || !newName) {
      toast({
        title: "Error",
        description: "Semua field harus diisi",
        variant: "destructive",
      })
      return
    }

    const success = addUser({
      username: newUsername,
      password: newPassword,
      name: newName,
      role: newRole,
    })

    if (success) {
      setUsers(getAllUsers())
      setNewUsername("")
      setNewPassword("")
      setNewName("")
      setNewRole("operator")
      setIsAddDialogOpen(false)
      toast({
        title: "Berhasil",
        description: "User baru berhasil ditambahkan",
      })
    } else {
      toast({
        title: "Error",
        description: "Gagal menambahkan user",
        variant: "destructive",
      })
    }
  }

  const handleChangePassword = () => {
    if (!changePassword) {
      toast({
        title: "Error",
        description: "Password baru harus diisi",
        variant: "destructive",
      })
      return
    }

    const success = updateUserPassword(selectedUser, changePassword)

    if (success) {
      setChangePassword("")
      setIsPasswordDialogOpen(false)
      toast({
        title: "Berhasil",
        description: "Password berhasil diubah",
      })
    } else {
      toast({
        title: "Error",
        description: "Gagal mengubah password",
        variant: "destructive",
      })
    }
  }

  const handleDeleteUser = () => {
    const success = deleteUser(selectedUser)

    if (success) {
      setUsers(getAllUsers())
      setIsDeleteDialogOpen(false)
      toast({
        title: "Berhasil",
        description: "User berhasil dihapus",
      })
    } else {
      toast({
        title: "Error",
        description: "Gagal menghapus user atau tidak dapat menghapus admin",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="bg-blue-600 text-white rounded-t-lg">
          <CardTitle className="flex items-center justify-between">
            <span>Manajemen User</span>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="secondary" size="sm">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Tambah User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Tambah User Baru</DialogTitle>
                  <DialogDescription>Buat akun user baru untuk mengakses sistem</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      placeholder="Masukkan username"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Masukkan nama lengkap"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={newRole} onValueChange={(value: "admin" | "operator") => setNewRole(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="operator">Operator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Batal
                  </Button>
                  <Button onClick={handleAddUser}>Tambah User</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.username}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>
                    <Badge className={user.role === "admin" ? "bg-red-500" : "bg-blue-500"}>{user.role}</Badge>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString("id-ID")}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          setSelectedUser(user.username)
                          setIsPasswordDialogOpen(true)
                        }}
                        className="h-8 w-8"
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      {user.username !== "admin" && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user.username)
                            setIsDeleteDialogOpen(true)
                          }}
                          className="h-8 w-8 text-red-500 hover:text-red-600"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog Ubah Password */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ubah Password</DialogTitle>
            <DialogDescription>Ubah password untuk user: {selectedUser}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Password Baru</Label>
              <Input
                id="new-password"
                type="password"
                value={changePassword}
                onChange={(e) => setChangePassword(e.target.value)}
                placeholder="Masukkan password baru"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
              Batal
            </Button>
            <Button onClick={handleChangePassword}>Ubah Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Konfirmasi Hapus */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus User</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus user "{selectedUser}"? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-red-500 hover:bg-red-600">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
