"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAccounts } from "@/contexts/account-context"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { BarChart, Users, Calendar } from "lucide-react"

export default function OperatorStatistics() {
  const { getOperatorStatistics } = useAccounts()
  const operatorStats = getOperatorStatistics()

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Operators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-5 w-5 text-gray-500 mr-2" />
              <div className="text-2xl font-bold">{Object.keys(operatorStats).length}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <BarChart className="h-5 w-5 text-gray-500 mr-2" />
              <div className="text-2xl font-bold">
                {Object.values(operatorStats).reduce((sum, stat) => sum + stat.total, 0)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Today's Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-500 mr-2" />
              <div className="text-2xl font-bold">
                {Object.values(operatorStats).reduce((sum, stat) => {
                  const today = new Date().toLocaleDateString("id-ID")
                  return sum + (stat.byDate[today] || 0)
                }, 0)}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Statistik per Operator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operator</TableHead>
                  <TableHead>Total Requests</TableHead>
                  <TableHead>Private</TableHead>
                  <TableHead>Sharing</TableHead>
                  <TableHead>Hari Ini</TableHead>
                  <TableHead>Aktivitas Terakhir</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(operatorStats).map(([operatorName, stats]) => {
                  const today = new Date().toLocaleDateString("id-ID")
                  const todayCount = stats.byDate[today] || 0
                  const lastActivityDate = Object.keys(stats.byDate).sort().pop() || "-"

                  return (
                    <TableRow key={operatorName}>
                      <TableCell className="font-medium">{operatorName}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{stats.total}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-500">{stats.private}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-purple-500">{stats.sharing}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={todayCount > 0 ? "bg-green-500" : "bg-gray-500"}>{todayCount}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-500">{lastActivityDate}</TableCell>
                    </TableRow>
                  )
                })}
                {Object.keys(operatorStats).length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                      Belum ada aktivitas operator
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail aktivitas per operator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(operatorStats).map(([operatorName, stats]) => (
          <Card key={operatorName}>
            <CardHeader>
              <CardTitle className="text-lg">Aktivitas {operatorName}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-sm text-gray-600">Aktivitas per hari (7 hari terakhir):</div>
                {Object.entries(stats.byDate)
                  .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                  .slice(0, 7)
                  .map(([date, count]) => (
                    <div key={date} className="flex justify-between items-center">
                      <span className="text-sm">{date}</span>
                      <Badge variant="outline">{count} requests</Badge>
                    </div>
                  ))}
                {Object.keys(stats.byDate).length === 0 && (
                  <div className="text-sm text-gray-500">Belum ada aktivitas</div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
