"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAccounts } from "@/contexts/account-context"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function ReportedAccounts() {
  const { getReportedAccounts, resolveReport, reportAccount } = useAccounts()
  const { toast } = useToast()
  const [selectedReport, setSelectedReport] = useState<string | null>(null)
  const [newPassword, setNewPassword] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // New state for reporting accounts
  const [emailToReport, setEmailToReport] = useState("")
  const [reportReason, setReportReason] = useState("")
  const [isReporting, setIsReporting] = useState(false)

  const reportedAccounts = getReportedAccounts()

  const handleResolve = (reportId: string) => {
    setSelectedReport(reportId)
    setNewPassword("")
    setIsDialogOpen(true)
  }

  const handleUpdatePassword = () => {
    if (!selectedReport) return

    resolveReport(selectedReport, newPassword)

    toast({
      title: "Account Updated",
      description: "The account has been updated with the new password.",
    })

    setIsDialogOpen(false)
    setSelectedReport(null)
    setNewPassword("")
  }

  const handleMarkAsResolved = () => {
    if (!selectedReport) return

    resolveReport(selectedReport)

    toast({
      title: "Report Resolved",
      description: "The report has been marked as resolved.",
    })

    setIsDialogOpen(false)
    setSelectedReport(null)
  }

  const handleReportAccount = (e: React.FormEvent) => {
    e.preventDefault()
    setIsReporting(true)

    try {
      const success = reportAccount(emailToReport, reportReason)

      if (success) {
        toast({
          title: "Account Reported",
          description: "The account has been reported successfully.",
        })
        setEmailToReport("")
        setReportReason("")
      } else {
        toast({
          title: "Error",
          description: "Account not found. Please check the email address.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to report account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsReporting(false)
    }
  }

  return (
    <Tabs defaultValue="list" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="list" className="data-[state=active]:bg-luna-primary data-[state=active]:text-white">
          Reported Accounts
        </TabsTrigger>
        <TabsTrigger value="report" className="data-[state=active]:bg-luna-primary data-[state=active]:text-white">
          Report Account
        </TabsTrigger>
      </TabsList>

      <TabsContent value="list">
        {reportedAccounts.length === 0 ? (
          <div className="text-center py-4">
            <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
            <h3 className="text-base font-medium text-luna-primary dark:text-white mb-1">No Reported Accounts</h3>
            <p className="text-sm text-muted-foreground">All accounts are working properly.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Issue</TableHead>
                <TableHead>Reported At</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportedAccounts.map((report) => (
                <TableRow key={report.id}>
                  <TableCell className="font-medium">{report.email}</TableCell>
                  <TableCell>{report.reportReason}</TableCell>
                  <TableCell>{new Date(report.reportedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-luna-primary border-luna-primary hover:bg-luna-primary hover:text-white"
                      onClick={() => handleResolve(report.id)}
                    >
                      Resolve
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </TabsContent>

      <TabsContent value="report">
        <form onSubmit={handleReportAccount} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email-to-report">Account Email</Label>
              <Input
                id="email-to-report"
                type="email"
                value={emailToReport}
                onChange={(e) => setEmailToReport(e.target.value)}
                placeholder="Enter email address"
                className="border-luna-primary/20 focus-visible:ring-luna-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="report-reason">Issue Description</Label>
              <Input
                id="report-reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Describe the issue"
                className="border-luna-primary/20 focus-visible:ring-luna-primary"
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            className="w-full bg-luna-primary hover:bg-luna-secondary"
            disabled={isReporting || !emailToReport || !reportReason}
          >
            {isReporting ? "Reporting..." : "Report Account"}
          </Button>
        </form>
      </TabsContent>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Account Issue</DialogTitle>
            <DialogDescription>
              You can update the password for this account or mark the issue as resolved without changes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password (Optional)</Label>
              <Input
                id="new-password"
                type="text"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
              <p className="text-xs text-muted-foreground">
                Leave blank if you want to mark the issue as resolved without changing the password.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="secondary" onClick={handleMarkAsResolved}>
              Mark as Resolved
            </Button>
            <Button onClick={handleUpdatePassword} disabled={!newPassword}>
              Update Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Tabs>
  )
}
