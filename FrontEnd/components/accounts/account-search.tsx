"use client"

import type React from "react"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useAccounts } from "@/contexts/account-context"
import { Search, Copy, X } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface AccountSearchProps {
  onClose?: () => void
}

export default function AccountSearch({ onClose }: AccountSearchProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const { accounts, getRemainingDays } = useAccounts()
  const { toast } = useToast()
  const [searchResult, setSearchResult] = useState<{
    email: string
    password: string
    type: string
    daysLeft: number
    profiles: { profile: string; pin: string; used: boolean }[]
  } | null>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    if (!searchTerm.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address to search",
        variant: "destructive",
      })
      return
    }

    setIsSearching(true)
    setSearchResult(null)

    try {
      console.log("=== SEARCH DEBUG ===")
      console.log("Search term:", searchTerm)
      console.log("Available accounts:", accounts.length)
      console.log(
        "Account emails:",
        accounts.map((acc) => acc.email),
      )

      // Improved search logic - case insensitive and partial match
      const trimmedSearch = searchTerm.trim().toLowerCase()

      const account = accounts.find((account) => {
        const accountEmail = account.email.toLowerCase()
        console.log(`Comparing: "${accountEmail}" with "${trimmedSearch}"`)

        // Try exact match first, then partial match
        return accountEmail === trimmedSearch || accountEmail.includes(trimmedSearch)
      })

      console.log("Found account:", account)

      if (account) {
        const result = {
          email: account.email,
          password: account.password,
          type: account.type,
          daysLeft: getRemainingDays(account),
          profiles: account.profiles,
        }

        console.log("Search result:", result)
        setSearchResult(result)

        toast({
          title: "✅ Account Found",
          description: `Found account: ${account.email}`,
        })
      } else {
        setSearchResult(null)
        toast({
          title: "❌ Account Not Found",
          description: `No account found with email containing: "${searchTerm}"`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Search error:", error)
      toast({
        title: "Error",
        description: "An error occurred while searching for the account.",
        variant: "destructive",
      })
    } finally {
      setIsSearching(false)
    }
  }

  const copyToClipboard = () => {
    if (!searchResult) return

    const accountText = `!!! NETFLIX - TRUSTDIGITAL.ID !!!

1. Login hanya di 1 DEVICE !!
2. Garansi akun 23 Hari
3. Ketika ada kendala akun :
 - Hapus chache app
 - (DIBACA) GUNAKAN DATA SELULER/HOTSPOT SAAT LOGIN SAJA
 - Install Ulang App
4. Dilarang mengubah Nama profile, Pin, membuka pengaturan akun !!

💌 Email: ${searchResult.email}
🔑 Password: ${searchResult.password}
👤 Profil: ${searchResult.profiles.filter((p) => !p.used)[0]?.profile || "No available profiles"}
PIN: ${searchResult.profiles.filter((p) => !p.used)[0]?.pin || "N/A"}
tipe: ${searchResult.type === "private" ? "Private" : "Sharing"}
⏱️ Sisa hari: ${searchResult.daysLeft} hari

Melanggar? Akun ditarik + denda Rp300K
Terima kasih telah memesan di TrustDigital.ID
Contact: @TRUSTDIGITAL001 | IG: @trustdigital.indonesia
Website: https://trustdigital.id

KRITIK DAN SARAN:
https://docs.google.com/forms/d/e/1FAIpQLScSpnLbo4ouMf2hH1rYgJi-xIdV6s8i2euLBTY9Fg1tzVrWyw/viewform?usp=header`

    navigator.clipboard.writeText(accountText)

    toast({
      title: "📋 Copied",
      description: "Account details copied to clipboard in TrustDigital format",
    })
  }

  const clearSearch = () => {
    setSearchTerm("")
    setSearchResult(null)
  }

  return (
    <div className="space-y-4">
      {/* Search Form */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <Input
              type="text"
              placeholder="Enter email address (partial match supported)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8"
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={clearSearch}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
          <Button type="submit" disabled={isSearching || !searchTerm.trim()}>
            <Search className="h-4 w-4 mr-2" />
            {isSearching ? "Searching..." : "Search"}
          </Button>
        </div>

        <div className="text-xs text-gray-500">
          💡 Tips: You can search with partial email (e.g., "murphy" will find "murphyd73.golden@outlook.com")
        </div>
      </form>

      {/* Search Results */}
      {searchResult && (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-start mb-3">
            <h3 className="font-medium text-gray-900 dark:text-white flex items-center">✅ Account Found</h3>
            <Button variant="ghost" size="sm" onClick={copyToClipboard}>
              <Copy className="h-4 w-4 mr-1" />
              Copy Details
            </Button>
          </div>

          <div className="space-y-3 font-mono text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="font-semibold text-gray-600">📧 Email:</span>
                <div className="bg-white p-2 rounded border">{searchResult.email}</div>
              </div>

              <div>
                <span className="font-semibold text-gray-600">🔑 Password:</span>
                <div className="bg-white p-2 rounded border">{searchResult.password}</div>
              </div>

              <div>
                <span className="font-semibold text-gray-600">📱 Type:</span>
                <div className="mt-1">
                  <Badge className={searchResult.type === "private" ? "bg-blue-500" : "bg-purple-500"}>
                    {searchResult.type === "private" ? "Private" : "Sharing"}
                  </Badge>
                </div>
              </div>

              <div>
                <span className="font-semibold text-gray-600">⏰ Days Left:</span>
                <div className="mt-1">
                  <Badge
                    className={
                      searchResult.daysLeft <= 3
                        ? "bg-red-500"
                        : searchResult.daysLeft <= 7
                          ? "bg-yellow-500"
                          : "bg-green-500"
                    }
                  >
                    {searchResult.daysLeft} days
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <span className="font-semibold text-gray-600">👥 Available Profiles:</span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {searchResult.profiles
                  .filter((profile) => !profile.used)
                  .map((profile, index) => (
                    <div key={index} className="text-xs p-2 bg-green-100 dark:bg-green-800 rounded border">
                      <div className="font-medium">{profile.profile}</div>
                      <div className="text-gray-600">PIN: {profile.pin}</div>
                    </div>
                  ))}
                {searchResult.profiles.filter((profile) => !profile.used).length === 0 && (
                  <div className="col-span-2 text-xs text-red-500 p-2 bg-red-100 rounded">❌ No available profiles</div>
                )}
              </div>
            </div>

            {/* Used Profiles */}
            {searchResult.profiles.filter((profile) => profile.used).length > 0 && (
              <div>
                <span className="font-semibold text-gray-600">🚫 Used Profiles:</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {searchResult.profiles
                    .filter((profile) => profile.used)
                    .map((profile, index) => (
                      <div key={index} className="text-xs p-2 bg-gray-100 dark:bg-gray-700 rounded border opacity-60">
                        <div className="font-medium">{profile.profile}</div>
                        <div className="text-gray-600">PIN: {profile.pin}</div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === "development" && (
        <div className="text-xs text-gray-400 p-2 bg-gray-100 rounded">
          <strong>Debug Info:</strong>
          <br />
          Total accounts: {accounts.length}
          <br />
          Search term: "{searchTerm}"<br />
          Last search: {isSearching ? "In progress..." : "Completed"}
        </div>
      )}
    </div>
  )
}
