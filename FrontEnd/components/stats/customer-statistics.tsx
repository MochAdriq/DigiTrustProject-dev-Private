"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAccounts } from "@/contexts/account-context";
import { BarChart, PieChart, Users, Calendar, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import OperatorStatistics from "@/components/stats/operator-statistics";

export default function CustomerStatistics() {
  const { customerAssignments, getCustomerStatistics } = useAccounts();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get current user from localStorage
    const user = localStorage.getItem("currentUser");
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const stats = getCustomerStatistics();

  // Get unique customers with their assignments
  const customerMap = new Map<string, typeof customerAssignments>();

  customerAssignments.forEach((assignment) => {
    if (!customerMap.has(assignment.customer_identifier)) {
      customerMap.set(assignment.customer_identifier, []);
    }
    customerMap.get(assignment.customer_identifier)?.push(assignment);
  });

  // Filter customers based on search term and date range
  const filteredCustomers = Array.from(customerMap.entries())
    .filter(([customer]) =>
      customer.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .map(([customer, assignments]) => {
      // Filter assignments by date range if set
      let filteredAssignments = [...assignments];

      if (dateRange?.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);

        filteredAssignments = filteredAssignments.filter((assignment) => {
          const assignmentDate = new Date(assignment.assigned_at);
          return assignmentDate >= fromDate;
        });
      }

      if (dateRange?.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);

        filteredAssignments = filteredAssignments.filter((assignment) => {
          const assignmentDate = new Date(assignment.assigned_at);
          return assignmentDate <= toDate;
        });
      }

      return [customer, filteredAssignments] as [
        string,
        typeof customerAssignments
      ];
    })
    .filter(([, assignments]) => assignments.length > 0) // Remove customers with no assignments after date filtering
    .sort(([, assignmentsA], [, assignmentsB]) => {
      // Sort by most recent assignment
      const latestA = new Date(
        Math.max(...assignmentsA.map((a) => new Date(a.assigned_at).getTime()))
      );
      const latestB = new Date(
        Math.max(...assignmentsB.map((a) => new Date(a.assigned_at).getTime()))
      );
      return latestB.getTime() - latestA.getTime();
    });

  // Calculate filtered statistics
  const filteredStats = {
    totalCustomers: filteredCustomers.length,
    totalAssignments: filteredCustomers.reduce(
      (sum, [, assignments]) => sum + assignments.length,
      0
    ),
    privateAccounts: filteredCustomers.reduce(
      (sum, [, assignments]) =>
        sum + assignments.filter((a) => a.account_type === "private").length,
      0
    ),
    sharingAccounts: filteredCustomers.reduce(
      (sum, [, assignments]) =>
        sum + assignments.filter((a) => a.account_type === "sharing").length,
      0
    ),
  };

  const exportToExcel = () => {
    // Prepare data for export
    const data = filteredCustomers.flatMap(([customer, assignments]) =>
      assignments.map((assignment) => ({
        Customer: customer,
        Email: assignment.account_email,
        Type: assignment.account_type,
        Profile: assignment.profile_name,
        Operator: assignment.operator_name || "Unknown",
        Date: new Date(assignment.assigned_at).toLocaleDateString("id-ID", {
          day: "numeric",
          month: "numeric",
          year: "numeric",
        }),
      }))
    );

    // Create CSV content
    const headers = [
      "Customer",
      "Email",
      "Type",
      "Profile",
      "Operator",
      "Date",
    ];
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((header) => {
            // Escape commas and quotes in the data
            const cell = String(row[header as keyof typeof row]).replace(
              /"/g,
              '""'
            );
            return `"${cell}"`;
          })
          .join(",")
      ),
    ].join("\n");

    // Create and download the file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    // Create filename with date range if set
    let filename = "customer-data";
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
      description: "Customer data has been exported to CSV",
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setDateRange(undefined);
  };

  const isAdmin = currentUser?.role === "admin";

  return (
    <Tabs defaultValue="customers" className="w-full">
      <TabsList className="grid w-full grid-cols-2 mb-4">
        <TabsTrigger value="customers">Customer Statistics</TabsTrigger>
        {isAdmin && (
          <TabsTrigger value="operators">Operator Statistics</TabsTrigger>
        )}
      </TabsList>

      <TabsContent value="customers">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Customers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-500 mr-2" />
                  <div className="text-2xl font-bold">
                    {filteredStats.totalCustomers}
                  </div>
                  {dateRange && (
                    <span className="text-xs text-gray-500 ml-2">
                      (filtered)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Total Assignments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-gray-500 mr-2" />
                  <div className="text-2xl font-bold">
                    {filteredStats.totalAssignments}
                  </div>
                  {dateRange && (
                    <span className="text-xs text-gray-500 ml-2">
                      (filtered)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Private Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <BarChart className="h-5 w-5 text-gray-500 mr-2" />
                  <div className="text-2xl font-bold">
                    {filteredStats.privateAccounts}
                  </div>
                  {dateRange && (
                    <span className="text-xs text-gray-500 ml-2">
                      (filtered)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  Sharing Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <PieChart className="h-5 w-5 text-gray-500 mr-2" />
                  <div className="text-2xl font-bold">
                    {filteredStats.sharingAccounts}
                  </div>
                  {dateRange && (
                    <span className="text-xs text-gray-500 ml-2">
                      (filtered)
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Customer Assignment History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-4 items-start">
                <div className="w-full md:w-auto flex-1">
                  <Input
                    placeholder="Search customers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex gap-2">
                  <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                    placeholder="Filter by date"
                  />

                  {(searchTerm || dateRange) && (
                    <Button variant="outline" onClick={clearFilters} size="sm">
                      Clear Filters
                    </Button>
                  )}

                  <Button
                    onClick={exportToExcel}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export CSV
                  </Button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Accounts</TableHead>
                      <TableHead>Operator</TableHead>
                      <TableHead>Last Assignment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCustomers.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-4 text-gray-500"
                        >
                          No customer data found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCustomers.map(([customer, assignments]) => {
                        // Sort assignments by date (newest first)
                        const sortedAssignments = [...assignments].sort(
                          (a, b) =>
                            new Date(b.assigned_at).getTime() -
                            new Date(a.assigned_at).getTime()
                        );

                        const latestAssignment = sortedAssignments[0];
                        const assignmentDate = new Date(
                          latestAssignment.assigned_at
                        );

                        return (
                          <TableRow
                            key={customer}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <TableCell className="font-medium">
                              {customer}
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {sortedAssignments.map((assignment, index) => (
                                  <div
                                    key={index}
                                    className="flex items-center"
                                  >
                                    <Badge
                                      className={
                                        assignment.account_type === "private"
                                          ? "bg-blue-500 mr-2"
                                          : "bg-purple-500 mr-2"
                                      }
                                    >
                                      {assignment.account_type}
                                    </Badge>
                                    <span className="text-sm">
                                      {assignment.account_email}
                                    </span>
                                    <span className="text-xs text-gray-500 ml-2">
                                      {new Date(
                                        assignment.assigned_at
                                      ).toLocaleDateString("id-ID", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                      })}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {latestAssignment.operator_name || "Unknown"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {assignmentDate.toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {isAdmin && (
        <TabsContent value="operators">
          <OperatorStatistics />
        </TabsContent>
      )}
    </Tabs>
  );
}
