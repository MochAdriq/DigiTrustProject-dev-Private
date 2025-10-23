"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAccounts } from "@/contexts/account-context";
import { Activity, Download, Filter, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";

interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  target: string;
  details: string;
  type: "account" | "user" | "system" | "request";
  status: "success" | "error" | "warning";
}

export default function ActivityLogs() {
  const { customerAssignments, accounts } = useAccounts();
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get current user from localStorage
    const user = localStorage.getItem("currentUser");
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  // Generate activity logs from existing data
  useEffect(() => {
    const activityLogs: ActivityLog[] = [];

    // Add account request logs
    customerAssignments.forEach((assignment) => {
      activityLogs.push({
        id: `request-${assignment.id}`,
        timestamp: assignment.assigned_at,
        user: assignment.operator_name || "Unknown",
        action: "Account Request",
        target: assignment.account_email,
        details: `Requested ${assignment.account_type} account for customer ${assignment.customer_identifier}`,
        type: "request",
        status: "success",
      });
    });

    // Add account creation logs (simulated)
    accounts.forEach((account) => {
      activityLogs.push({
        id: `create-${account.id}`,
        timestamp: account.created_at,
        user: "Admin",
        action: "Account Created",
        target: account.email,
        details: `Created ${account.type} account with ${account.profiles.length} profiles`,
        type: "account",
        status: "success",
      });
    });

    // Add system logs (simulated)
    activityLogs.push({
      id: "system-startup",
      timestamp: new Date().toISOString(),
      user: "System",
      action: "System Startup",
      target: "TrustDigital.ID",
      details: "Account management system initialized",
      type: "system",
      status: "success",
    });

    // Sort by timestamp (newest first)
    activityLogs.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    setLogs(activityLogs);
  }, [customerAssignments, accounts]);

  // Filter logs based on search and filters
  useEffect(() => {
    let filtered = [...logs];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (log) =>
          log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.target.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (filterType !== "all") {
      filtered = filtered.filter((log) => log.type === filterType);
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter((log) => log.status === filterStatus);
    }

    // Date range filter
    if (dateRange?.from) {
      const fromDate = new Date(dateRange.from);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((log) => new Date(log.timestamp) >= fromDate);
    }

    if (dateRange?.to) {
      const toDate = new Date(dateRange.to);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((log) => new Date(log.timestamp) <= toDate);
    }

    setFilteredLogs(filtered);
  }, [logs, searchTerm, filterType, filterStatus, dateRange]);

  const exportLogs = () => {
    const csvContent = [
      [
        "Timestamp",
        "User",
        "Action",
        "Target",
        "Details",
        "Type",
        "Status",
      ].join(","),
      ...filteredLogs.map((log) =>
        [
          new Date(log.timestamp).toLocaleString("id-ID"),
          log.user,
          log.action,
          log.target,
          log.details.replace(/,/g, ";"), // Replace commas to avoid CSV issues
          log.type,
          log.status,
        ]
          .map((field) => `"${field}"`)
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    let filename = "activity-logs";
    if (dateRange?.from) {
      filename += `-from-${dateRange.from.toISOString().split("T")[0]}`;
    }
    if (dateRange?.to) {
      filename += `-to-${dateRange.to.toISOString().split("T")[0]}`;
    }
    filename += ".csv";

    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: "Activity logs have been exported to CSV",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterType("all");
    setFilterStatus("all");
    setDateRange(undefined);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge className="bg-green-500">Success</Badge>;
      case "error":
        return <Badge className="bg-red-500">Error</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500">Warning</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      account: "bg-blue-500",
      user: "bg-purple-500",
      system: "bg-gray-500",
      request: "bg-green-500",
    };
    return (
      <Badge className={colors[type as keyof typeof colors] || "bg-gray-500"}>
        {type}
      </Badge>
    );
  };

  const isAdmin = currentUser?.role === "admin";

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <Activity className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Access Restricted
          </h3>
          <p className="text-gray-500">
            Activity logs are only available for administrators.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="mr-2 h-5 w-5" />
          Activity Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-start">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="account">Account</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                  <SelectItem value="request">Request</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                </SelectContent>
              </Select>

              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
                placeholder="Filter by date"
              />

              {(searchTerm ||
                filterType !== "all" ||
                filterStatus !== "all" ||
                dateRange) && (
                <Button variant="outline" onClick={clearFilters} size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}

              <Button
                onClick={exportLogs}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Results summary */}
          <div className="text-sm text-gray-500">
            Showing {filteredLogs.length} of {logs.length} activities
          </div>

          {/* Logs table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-4 text-gray-500"
                    >
                      No activity logs found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow key={log.id} className="hover:bg-gray-50">
                      <TableCell className="text-sm">
                        {new Date(log.timestamp).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </TableCell>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {log.target}
                      </TableCell>
                      <TableCell>{getTypeBadge(log.type)}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell className="max-w-xs truncate text-sm text-gray-600">
                        {log.details}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
