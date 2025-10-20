"use client"

import { useState, useEffect } from "react"
import { Bell, X, AlertTriangle, Info, CheckCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAccounts } from "@/contexts/account-context"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

interface Notification {
  id: string
  type: "warning" | "info" | "success" | "error"
  title: string
  message: string
  timestamp: string
  read: boolean
}

export default function NotificationSystem() {
  const { accounts, getAvailableProfileCount, getReportedAccounts } = useAccounts()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Generate notifications based on system state
  useEffect(() => {
    const newNotifications: Notification[] = []

    // Check for low stock
    const privateStock = getAvailableProfileCount("private")
    const sharingStock = getAvailableProfileCount("sharing")

    if (privateStock <= 5) {
      newNotifications.push({
        id: `low-private-${Date.now()}`,
        type: "warning",
        title: "Low Private Account Stock",
        message: `Only ${privateStock} private profiles remaining`,
        timestamp: new Date().toISOString(),
        read: false,
      })
    }

    if (sharingStock <= 10) {
      newNotifications.push({
        id: `low-sharing-${Date.now()}`,
        type: "warning",
        title: "Low Sharing Account Stock",
        message: `Only ${sharingStock} sharing profiles remaining`,
        timestamp: new Date().toISOString(),
        read: false,
      })
    }

    // Check for expiring accounts (within 3 days)
    const expiringAccounts = accounts.filter((account) => {
      const daysLeft = Math.ceil(
        (new Date(account.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
      )
      return daysLeft <= 3 && daysLeft > 0
    })

    if (expiringAccounts.length > 0) {
      newNotifications.push({
        id: `expiring-${Date.now()}`,
        type: "warning",
        title: "Accounts Expiring Soon",
        message: `${expiringAccounts.length} accounts will expire within 3 days`,
        timestamp: new Date().toISOString(),
        read: false,
      })
    }

    // Check for reported accounts
    const reportedAccounts = getReportedAccounts()
    if (reportedAccounts.length > 0) {
      newNotifications.push({
        id: `reported-${Date.now()}`,
        type: "error",
        title: "Unresolved Reports",
        message: `${reportedAccounts.length} accounts need attention`,
        timestamp: new Date().toISOString(),
        read: false,
      })
    }

    // Update notifications (avoid duplicates)
    setNotifications((prev) => {
      const existingIds = prev.map((n) => n.id.split("-")[0] + "-" + n.id.split("-")[1])
      const filteredNew = newNotifications.filter(
        (n) => !existingIds.includes(n.id.split("-")[0] + "-" + n.id.split("-")[1]),
      )
      return [...filteredNew, ...prev].slice(0, 20) // Keep only latest 20
    })
  }, [accounts, getAvailableProfileCount, getReportedAccounts])

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    return `${diffDays}d ago`
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-red-500 text-white text-xs">
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notifications</CardTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                      !notification.read ? "bg-blue-50" : ""
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-2 flex-1">
                        {getIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{notification.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                          <div className="flex items-center mt-1">
                            <Clock className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-400">{formatTime(notification.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeNotification(notification.id)
                        }}
                        className="h-6 w-6 p-0 hover:bg-gray-200"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )
}
