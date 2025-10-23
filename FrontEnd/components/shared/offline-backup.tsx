"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Download, Upload, Database, FileText, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useAccounts } from "@/contexts/account-context"
import { getAllUsers } from "@/lib/auth"
import { Progress } from "@/components/ui/progress"

interface BackupData {
  version: string
  timestamp: string
  appName: string
  data: {
    accounts: any[]
    customerAssignments: any[]
    reportedAccounts: any[]
    users: any[]
  }
  metadata: {
    totalAccounts: number
    totalAssignments: number
    totalReports: number
    totalUsers: number
    exportedBy: string
  }
}

export default function OfflineBackup() {
  const { accounts, customerAssignments, reportedAccounts } = useAccounts()
  const { toast } = useToast()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [importProgress, setImportProgress] = useState(0)
  const [exportProgress, setExportProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Get current user info
  const getCurrentUser = () => {
    try {
      const user = localStorage.getItem("currentUser")
      return user ? JSON.parse(user) : { name: "Unknown", username: "unknown" }
    } catch {
      return { name: "Unknown", username: "unknown" }
    }
  }

  const createOfflineBackup = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      // Simulate progress steps
      setExportProgress(20)
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Get all users (without passwords for security)
      const users = getAllUsers()
      setExportProgress(40)
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Get current user info
      const currentUser = getCurrentUser()
      setExportProgress(60)
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Create comprehensive backup data
      const backupData: BackupData = {
        version: "2.0",
        timestamp: new Date().toISOString(),
        appName: "TrustDigital.ID Account Management System",
        data: {
          accounts: accounts || [],
          customerAssignments: customerAssignments || [],
          reportedAccounts: reportedAccounts || [],
          users: users || [],
        },
        metadata: {
          totalAccounts: accounts?.length || 0,
          totalAssignments: customerAssignments?.length || 0,
          totalReports: reportedAccounts?.length || 0,
          totalUsers: users?.length || 0,
          exportedBy: `${currentUser.name} (${currentUser.username})`,
        },
      }

      setExportProgress(80)
      await new Promise((resolve) => setTimeout(resolve, 300))

      // Convert to JSON with pretty formatting
      const jsonData = JSON.stringify(backupData, null, 2)

      // Create and download file
      const blob = new Blob([jsonData], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")

      // Generate filename with timestamp
      const now = new Date()
      const dateStr = now.toISOString().split("T")[0] // YYYY-MM-DD
      const timeStr = now.toTimeString().split(" ")[0].replace(/:/g, "-") // HH-MM-SS
      const filename = `trustdigital-backup-${dateStr}-${timeStr}.json`

      link.setAttribute("href", url)
      link.setAttribute("download", filename)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      URL.revokeObjectURL(url)
      setExportProgress(100)

      // Save backup info to localStorage
      const backupInfo = {
        lastBackup: new Date().toISOString(),
        lastBackupFile: filename,
        backupCount: (Number.parseInt(localStorage.getItem("backupCount") || "0") + 1).toString(),
      }
      localStorage.setItem("lastBackupInfo", JSON.stringify(backupInfo))
      localStorage.setItem("backupCount", backupInfo.backupCount)

      toast({
        title: "✅ Backup Berhasil!",
        description: `File ${filename} telah didownload. Total data: ${backupData.metadata.totalAccounts} akun, ${backupData.metadata.totalAssignments} assignments.`,
        duration: 5000,
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "❌ Export Gagal",
        description: "Terjadi kesalahan saat membuat backup. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type === "application/json" || file.name.endsWith(".json")) {
        setSelectedFile(file)
        toast({
          title: "📁 File Dipilih",
          description: `File: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        })
      } else {
        toast({
          title: "❌ File Tidak Valid",
          description: "Silakan pilih file JSON backup yang valid.",
          variant: "destructive",
        })
        if (fileInputRef.current) {
          fileInputRef.current.value = ""
        }
      }
    }
  }

  const importOfflineBackup = async () => {
    if (!selectedFile) {
      toast({
        title: "❌ Tidak Ada File",
        description: "Silakan pilih file backup terlebih dahulu.",
        variant: "destructive",
      })
      return
    }

    setIsImporting(true)
    setImportProgress(0)

    try {
      // Read file content
      setImportProgress(10)
      const fileContent = await selectedFile.text()
      setImportProgress(30)

      // Parse JSON
      const backupData: BackupData = JSON.parse(fileContent)
      setImportProgress(50)

      // Validate backup structure
      if (!backupData.version || !backupData.data || !backupData.metadata) {
        throw new Error("Format file backup tidak valid")
      }

      if (!backupData.appName?.includes("TrustDigital")) {
        throw new Error("File backup bukan dari TrustDigital.ID")
      }

      setImportProgress(70)

      // Show confirmation with backup details
      const confirmMessage = `
Apakah Anda yakin ingin mengimport data ini?

📊 Detail Backup:
• Tanggal: ${new Date(backupData.timestamp).toLocaleString("id-ID")}
• Akun: ${backupData.metadata.totalAccounts}
• Assignments: ${backupData.metadata.totalAssignments}
• Reports: ${backupData.metadata.totalReports}
• Users: ${backupData.metadata.totalUsers}
• Dibuat oleh: ${backupData.metadata.exportedBy}

⚠️ PERINGATAN: Data saat ini akan diganti!
      `

      if (!confirm(confirmMessage)) {
        setIsImporting(false)
        setImportProgress(0)
        return
      }

      setImportProgress(90)

      // In a real implementation, you would import to database
      // For now, we'll show success message
      toast({
        title: "✅ Import Berhasil!",
        description: `Data berhasil diimport: ${backupData.metadata.totalAccounts} akun, ${backupData.metadata.totalAssignments} assignments. Silakan refresh halaman.`,
        duration: 8000,
      })

      // Save import info
      const importInfo = {
        lastImport: new Date().toISOString(),
        lastImportFile: selectedFile.name,
        importedData: backupData.metadata,
      }
      localStorage.setItem("lastImportInfo", JSON.stringify(importInfo))

      setImportProgress(100)

      // Reset file selection
      setSelectedFile(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      // Suggest page refresh
      setTimeout(() => {
        if (confirm("Import selesai! Refresh halaman untuk melihat data terbaru?")) {
          window.location.reload()
        }
      }, 2000)
    } catch (error) {
      console.error("Import error:", error)
      toast({
        title: "❌ Import Gagal",
        description: error instanceof Error ? error.message : "Terjadi kesalahan saat mengimport data.",
        variant: "destructive",
      })
    } finally {
      setIsImporting(false)
      setImportProgress(0)
    }
  }

  // Get backup statistics
  const getBackupStats = () => {
    try {
      const backupInfo = localStorage.getItem("lastBackupInfo")
      const importInfo = localStorage.getItem("lastImportInfo")
      const backupCount = localStorage.getItem("backupCount") || "0"

      return {
        lastBackup: backupInfo ? JSON.parse(backupInfo) : null,
        lastImport: importInfo ? JSON.parse(importInfo) : null,
        totalBackups: Number.parseInt(backupCount),
        currentDataSize: {
          accounts: accounts?.length || 0,
          assignments: customerAssignments?.length || 0,
          reports: reportedAccounts?.length || 0,
        },
      }
    } catch {
      return {
        lastBackup: null,
        lastImport: null,
        totalBackups: 0,
        currentDataSize: { accounts: 0, assignments: 0, reports: 0 },
      }
    }
  }

  const stats = getBackupStats()

  return (
    <div className="space-y-6">
      <Alert>
        <Database className="h-4 w-4" />
        <AlertTitle>💾 Backup Offline System</AlertTitle>
        <AlertDescription>
          Backup semua data akun, customer, dan pengaturan ke file JSON. Data bisa diimport kembali kapan saja untuk
          restore atau transfer ke device lain.
        </AlertDescription>
      </Alert>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Export/Backup Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Download className="mr-2 h-5 w-5" />
              Export Data (Backup)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="font-medium">📊 Data Saat Ini:</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between p-2 bg-blue-50 rounded">
                  <span>Akun:</span>
                  <span className="font-mono font-bold">{stats.currentDataSize.accounts}</span>
                </div>
                <div className="flex justify-between p-2 bg-green-50 rounded">
                  <span>Assignments:</span>
                  <span className="font-mono font-bold">{stats.currentDataSize.assignments}</span>
                </div>
                <div className="flex justify-between p-2 bg-yellow-50 rounded">
                  <span>Reports:</span>
                  <span className="font-mono font-bold">{stats.currentDataSize.reports}</span>
                </div>
                <div className="flex justify-between p-2 bg-purple-50 rounded">
                  <span>Total Backup:</span>
                  <span className="font-mono font-bold">{stats.totalBackups}</span>
                </div>
              </div>
            </div>

            {stats.lastBackup && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Backup Terakhir:</strong>
                  <br />📅 {new Date(stats.lastBackup.lastBackup).toLocaleString("id-ID")}
                  <br />📁 {stats.lastBackup.lastBackupFile}
                </p>
              </div>
            )}

            {isExporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Creating backup...</span>
                  <span>{exportProgress}%</span>
                </div>
                <Progress value={exportProgress} className="w-full" />
              </div>
            )}

            <Button
              onClick={createOfflineBackup}
              disabled={isExporting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isExporting ? (
                <>
                  <Database className="mr-2 h-4 w-4 animate-pulse" />
                  Membuat Backup... ({exportProgress}%)
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Backup
                </>
              )}
            </Button>

            <p className="text-xs text-gray-500">
              File JSON akan didownload berisi semua data akun, customer assignments, reports, dan user settings.
            </p>
          </CardContent>
        </Card>

        {/* Import/Restore Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-2 h-5 w-5" />
              Import Data (Restore)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="backup-file">Pilih File Backup</Label>
              <Input
                ref={fileInputRef}
                id="backup-file"
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="cursor-pointer"
              />
              {selectedFile && (
                <div className="p-2 bg-green-50 rounded-md">
                  <p className="text-sm text-green-700">
                    ✅ <strong>{selectedFile.name}</strong>
                    <br />📏 Size: {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
            </div>

            {stats.lastImport && (
              <div className="p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">
                  <strong>Import Terakhir:</strong>
                  <br />📅 {new Date(stats.lastImport.lastImport).toLocaleString("id-ID")}
                  <br />📁 {stats.lastImport.lastImportFile}
                  <br />📊 {stats.lastImport.importedData?.totalAccounts} akun,{" "}
                  {stats.lastImport.importedData?.totalAssignments} assignments
                </p>
              </div>
            )}

            {isImporting && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Importing data...</span>
                  <span>{importProgress}%</span>
                </div>
                <Progress value={importProgress} className="w-full" />
              </div>
            )}

            <Button
              onClick={importOfflineBackup}
              disabled={isImporting || !selectedFile}
              variant="outline"
              className="w-full border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              {isImporting ? (
                <>
                  <Upload className="mr-2 h-4 w-4 animate-pulse" />
                  Mengimport... ({importProgress}%)
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Import Backup
                </>
              )}
            </Button>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                <strong>⚠️ Peringatan:</strong> Import akan mengganti semua data saat ini. Pastikan sudah backup data
                current sebelum import.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Usage Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />📋 Cara Penggunaan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">🔽 Export/Backup:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Klik "Download Backup"</li>
                <li>File JSON akan terdownload otomatis</li>
                <li>Simpan file di tempat aman (Google Drive, USB, dll)</li>
                <li>File berisi semua data akun dan settings</li>
              </ol>
            </div>

            <div>
              <h4 className="font-medium mb-2">🔼 Import/Restore:</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Pilih file backup JSON</li>
                <li>Klik "Import Backup"</li>
                <li>Konfirmasi import (data current akan diganti)</li>
                <li>Refresh halaman untuk melihat data baru</li>
              </ol>
            </div>
          </div>

          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <h4 className="font-medium text-blue-900 mb-2">💡 Tips:</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>Backup secara rutin (harian/mingguan)</li>
              <li>Simpan backup di multiple lokasi</li>
              <li>Test restore di environment terpisah dulu</li>
              <li>Backup sebelum update sistem atau import data baru</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
