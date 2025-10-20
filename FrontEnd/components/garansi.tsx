"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useAccounts } from "@/contexts/account-context"
import { Calendar, Shield, Copy, Info, Database } from "lucide-react"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface GaransiProps {
  userRole: "admin" | "operator"
}

export default function Garansi({ userRole }: GaransiProps) {
  const { getGaransiAccountsByDate, getRemainingDays, garansiAccounts } = useAccounts()
  const { toast } = useToast()
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [accounts, setAccounts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return

    setSelectedDate(date)
    setIsLoading(true)

    try {
      const dateAccounts = getGaransiAccountsByDate(date.toISOString())
      setAccounts(dateAccounts)
      console.log(`Found ${dateAccounts.length} garansi accounts for ${format(date, "dd/MM/yyyy")}`)
    } catch (error) {
      toast({
        title: "❌ Error",
        description: "Failed to load garansi accounts for selected date.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const copyAccountDetails = (account: any) => {
    const details = `Email: ${account.email}\nPassword: ${account.password}\nType: ${account.type}\nExpires: ${format(new Date(account.expires_at), "dd/MM/yyyy")}`

    navigator.clipboard.writeText(details)
    toast({
      title: "📋 Copied",
      description: "Account details copied to clipboard",
    })
  }

  const copyAllAccounts = () => {
    const allDetails = accounts
      .map(
        (account) =>
          `Email: ${account.email}\nPassword: ${account.password}\nType: ${account.type}\nExpires: ${format(new Date(account.expires_at), "dd/MM/yyyy")}`,
      )
      .join("\n\n")

    navigator.clipboard.writeText(allDetails)
    toast({
      title: "📋 Copied",
      description: `${accounts.length} garansi account details copied to clipboard`,
    })
  }

  return (
    <div className="space-y-6">
      <Alert className="bg-blue-50 border-blue-200">
        <Database className="h-4 w-4" />
        <AlertTitle>🛡️ Fitur Garansi - Database Terpisah</AlertTitle>
        <AlertDescription>
          Fitur ini menggunakan database garansi terpisah yang{" "}
          <strong className="text-blue-800">TIDAK mempengaruhi stok utama</strong>. Data ini hanya untuk referensi
          garansi dan customer service. Total garansi accounts: <strong>{garansiAccounts.length}</strong>
        </AlertDescription>
      </Alert>

      <Card className="zenith-card border-0">
        <CardHeader className="bg-zenith-gradient text-white rounded-t-2xl">
          <CardTitle className="flex items-center text-xl">
            <Shield className="mr-3 h-6 w-6" />
            Fitur Garansi - {userRole === "admin" ? "Admin" : "Operator"} (Database Terpisah)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-base font-semibold text-gray-700">📅 Pilih Tanggal untuk Cek Garansi</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "zenith-input w-full justify-start text-left font-normal h-14",
                      !selectedDate && "text-muted-foreground",
                    )}
                  >
                    <Calendar className="mr-2 h-5 w-5" />
                    {selectedDate ? format(selectedDate, "dd/MM/yyyy") : "Pilih tanggal"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => {
                      const today = new Date()
                      const thirtyDaysAgo = new Date()
                      thirtyDaysAgo.setDate(today.getDate() - 30)
                      return date > today || date < thirtyDaysAgo
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <p className="text-sm text-gray-500">
                Pilih tanggal dalam 30 hari terakhir untuk melihat akun garansi yang dibuat pada tanggal tersebut
              </p>
            </div>

            {selectedDate && accounts.length > 0 && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold gradient-text">
                    📅 Akun Garansi untuk tanggal {format(selectedDate, "dd/MM/yyyy")} ({accounts.length} akun)
                  </h3>
                  <Button onClick={copyAllAccounts} className="zenith-button">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Semua
                  </Button>
                </div>

                <Alert className="bg-green-50 border-green-200">
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    <strong>📋 Database Garansi:</strong> Data ini berasal dari database garansi terpisah dan{" "}
                    <strong className="text-green-800">TIDAK mempengaruhi stok utama (8/20)</strong>. Hanya untuk
                    referensi garansi customer.
                  </AlertDescription>
                </Alert>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Email</TableHead>
                        <TableHead>Password</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Tanggal Habis</TableHead>
                        <TableHead>Sisa Hari</TableHead>
                        <TableHead>Status Garansi</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {accounts.map((account) => {
                        const daysLeft = getRemainingDays(account)
                        const isUnderWarranty = daysLeft > 0
                        return (
                          <TableRow key={account.id}>
                            <TableCell className="font-medium">{account.email}</TableCell>
                            <TableCell className="font-mono">{account.password}</TableCell>
                            <TableCell>
                              <Badge className={account.type === "private" ? "bg-blue-500" : "bg-purple-500"}>
                                {account.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{format(new Date(account.expires_at), "dd/MM/yyyy")}</TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  daysLeft <= 3 ? "bg-red-500" : daysLeft <= 7 ? "bg-yellow-500" : "bg-green-500"
                                }
                              >
                                {daysLeft} hari
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={isUnderWarranty ? "bg-green-500" : "bg-red-500"}>
                                {isUnderWarranty ? "✅ Masih Garansi" : "❌ Expired"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button onClick={() => copyAccountDetails(account)} className="zenith-button h-8 px-3">
                                <Copy className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {selectedDate && accounts.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <Shield className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Tidak Ada Akun Garansi</h3>
                <p className="text-gray-500">
                  Tidak ada akun garansi yang dibuat pada tanggal {format(selectedDate, "dd/MM/yyyy")}
                </p>
              </div>
            )}

            {!selectedDate && (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-medium text-gray-900 mb-2">Pilih Tanggal</h3>
                <p className="text-gray-500">
                  Pilih tanggal untuk melihat akun garansi yang dibuat pada tanggal tersebut
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Instructions */}
      <Card className="zenith-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gradient-text text-xl">
            <Info className="mr-3 h-6 w-6" />📋 Cara Penggunaan Fitur Garansi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-4 bg-blue-50 rounded-xl">
              <h4 className="font-bold mb-3 text-blue-800">🔍 Untuk Operator:</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside text-blue-700">
                <li>Pilih tanggal pembuatan akun customer</li>
                <li>Lihat daftar akun garansi yang dibuat pada tanggal tersebut</li>
                <li>Check status garansi (masih berlaku/expired)</li>
                <li>Copy detail akun untuk customer service</li>
              </ol>
            </div>

            <div className="p-4 bg-green-50 rounded-xl">
              <h4 className="font-bold mb-3 text-green-800">👨‍💼 Untuk Admin:</h4>
              <ol className="text-sm space-y-2 list-decimal list-inside text-green-700">
                <li>Monitor akun garansi berdasarkan tanggal pembuatan</li>
                <li>Track status garansi semua akun</li>
                <li>Export data untuk laporan garansi</li>
                <li>Analisis performa akun per tanggal</li>
              </ol>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <h4 className="font-bold text-yellow-900 mb-3">⚠️ PENTING - Database Terpisah:</h4>
            <ul className="text-sm text-yellow-800 space-y-2 list-disc list-inside">
              <li>
                <strong>Database garansi terpisah</strong> - tidak mempengaruhi stok utama
              </li>
              <li>Data yang ditampilkan adalah akun garansi yang tidak masuk hitungan 8/20</li>
              <li>Gunakan untuk customer service dan tracking garansi saja</li>
              <li>Untuk menambah akun ke stok utama, gunakan mode normal di "Bulk Import"</li>
              <li>Stok counter (8/20) hanya menghitung akun dari database utama</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
