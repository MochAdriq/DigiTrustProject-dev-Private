"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAccounts } from "@/contexts/account-context";
import { AlertCircle, RefreshCw, Copy } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AccountDetails {
  id: string;
  email: string;
  password: string;
  profile: string;
  pin: string;
  type: string;
  customerIdentifier?: string;
  expires_at: string;
}

export default function RequestAccount() {
  const { toast } = useToast();
  const {
    getAccountsByType,
    markProfileAsUsed,
    getAvailableProfileCount,
    isCustomerIdentifierUsed,
    addCustomerAssignment,
  } = useAccounts();

  const [accountType, setAccountType] = useState<string>("");
  const [customerIdentifier, setCustomerIdentifier] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [accountDetails, setAccountDetails] = useState<AccountDetails | null>(
    null
  );
  const [stockDepleted, setStockDepleted] = useState(false);
  const [customerError, setCustomerError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // Get current user from localStorage
    const user = localStorage.getItem("currentUser");
    if (user) {
      setCurrentUser(JSON.parse(user));
    }
  }, []);

  const handleRequest = async () => {
    if (!accountType) {
      toast({
        title: "Error",
        description: "Please select an account type",
        variant: "destructive",
      });
      return;
    }

    if (!customerIdentifier) {
      toast({
        title: "Error",
        description: "Please enter customer phone number or name",
        variant: "destructive",
      });
      return;
    }

    // Check if customer identifier has been used before
    if (isCustomerIdentifierUsed(customerIdentifier)) {
      setCustomerError("This customer has already been assigned an account");
      return;
    }

    setIsLoading(true);
    setAccountDetails(null);
    setStockDepleted(false);
    setCustomerError(null);

    try {
      // Get accounts of the selected type
      const accounts = getAccountsByType(accountType as "private" | "sharing");

      // Check if there are any available profiles
      const availableProfileCount = getAvailableProfileCount(
        accountType as "private" | "sharing"
      );

      if (availableProfileCount === 0) {
        setStockDepleted(true);
        throw new Error(
          `No available ${accountType} accounts. Stock depleted.`
        );
      }

      // Find accounts with available profiles
      const accountsWithAvailableProfiles = accounts.filter((account) =>
        account.profiles.some((profile) => !profile.used)
      );

      if (accountsWithAvailableProfiles.length === 0) {
        setStockDepleted(true);
        throw new Error(
          `No available ${accountType} accounts. Stock depleted.`
        );
      }

      // Select a random account with available profiles
      const randomAccount =
        accountsWithAvailableProfiles[
          Math.floor(Math.random() * accountsWithAvailableProfiles.length)
        ];

      // Get available profiles
      const availableProfiles = randomAccount.profiles
        .map((profile, index) => ({ profile, index }))
        .filter((item) => !item.profile.used);

      // Select a random available profile
      const randomProfileData =
        availableProfiles[Math.floor(Math.random() * availableProfiles.length)];

      const randomProfile = randomAccount.profiles[randomProfileData.index];

      // Mark the profile as used
      await markProfileAsUsed(randomAccount.id, randomProfileData.index);

      // Create account details
      const details: AccountDetails = {
        id: randomAccount.id,
        email: randomAccount.email,
        password: randomAccount.password,
        profile: randomProfile.profile,
        pin: randomProfile.pin,
        type: accountType,
        customerIdentifier,
        expires_at: randomAccount.expires_at,
      };

      // Record the customer assignment with operator name
      await addCustomerAssignment({
        customer_identifier: customerIdentifier,
        account_id: randomAccount.id,
        account_email: randomAccount.email,
        account_type: accountType as "private" | "sharing",
        profile_name: randomProfile.profile,
        operator_name: currentUser?.name || currentUser?.username || "Unknown",
      });

      setAccountDetails(details);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to request account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReload = () => {
    window.location.reload();
  };

  // Format expiration date
  const formatExpirationDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <Card className="border-gray-200 shadow-sm">
      <CardHeader className="bg-blue-600 text-white rounded-t-lg">
        <CardTitle>
          Request Account - TrustDigital.ID
          {currentUser && (
            <div className="text-sm font-normal mt-1 opacity-90">
              Operator: {currentUser.name || currentUser.username}
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-type">Account Type</Label>
              <Select onValueChange={setAccountType}>
                <SelectTrigger
                  id="account-type"
                  className="border-gray-300 focus:ring-blue-500"
                >
                  <SelectValue placeholder="Select account type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Private Account</SelectItem>
                  <SelectItem value="sharing">Sharing Account</SelectItem>
                  <SelectItem value="vip">vip Account</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-identifier">
                Customer Phone Number or Name
              </Label>
              <Input
                id="customer-identifier"
                type="text"
                value={customerIdentifier}
                onChange={(e) => {
                  setCustomerIdentifier(e.target.value);
                  setCustomerError(null); // Clear error when input changes
                }}
                placeholder="Enter customer phone number or name"
                className="border-gray-300 focus-visible:ring-blue-500"
                required
              />
              {customerError && (
                <p className="text-sm text-red-500 mt-1">{customerError}</p>
              )}
            </div>

            {stockDepleted ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Stock Depleted</AlertTitle>
                <AlertDescription>
                  No available {accountType} accounts. Please contact admin to
                  add more accounts.
                </AlertDescription>
                <Button
                  onClick={handleReload}
                  variant="outline"
                  className="mt-2 w-full"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reload Page
                </Button>
              </Alert>
            ) : (
              <Button
                onClick={handleRequest}
                className="w-full bg-blue-600 hover:bg-blue-700"
                disabled={
                  isLoading ||
                  !accountType ||
                  !customerIdentifier ||
                  !!customerError
                }
              >
                {isLoading ? "Requesting..." : "Request Account"}
              </Button>
            )}

            {accountType && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Available {accountType} accounts:{" "}
                {getAvailableProfileCount(accountType as "private" | "sharing")}
              </div>
            )}
          </div>

          {accountDetails ? (
            <div>
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md font-mono text-sm whitespace-pre-wrap border border-gray-200 dark:border-gray-700">
                {`!!! NETFLIX - TRUSTDIGITAL.ID !!!

1. Login hanya di 1 DEVICE !!
2. Garansi akun 23 Hari
3. Ketika ada kendala akun :
 - Hapus chache app
 - (DIBACA) GUNAKAN DATA SELULER/HOTSPOT SAAT LOGIN SAJA
 - Install Ulang App
4. Dilarang mengubah Nama profile, Pin, membuka pengaturan akun !!

💌 Email: ${accountDetails.email}
🔑 Password: ${accountDetails.password}
👤 Profil: ${accountDetails.profile}
PIN: ${accountDetails.pin}
tipe: ${accountDetails.type === "private" ? "Private" : "Sharing"}
📱 Customer: ${accountDetails.customerIdentifier}
👨‍💼 Operator: ${currentUser?.name || currentUser?.username}
⏱️ Berlaku sampai: ${formatExpirationDate(accountDetails.expires_at)}

Melanggar? Akun ditarik + denda Rp300K
Terima kasih telah memesan di TrustDigital.ID
Contact: @TRUSTDIGITAL001 | IG: @trustdigital.indonesia
Website: https://trustdigital.id

KRITIK DAN SARAN:
https://docs.google.com/forms/d/e/1FAIpQLScSpnLbo4ouMf2hH1rYgJi-xIdV6s8i2euLBTY9Fg1tzVrWyw/viewform?usp=header`}
              </div>
              <div className="mt-4">
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `!!! NETFLIX - TRUSTDIGITAL.ID !!!\n\n1. Login hanya di 1 DEVICE !!\n2. Garansi akun 23 Hari\n3. Ketika ada kendala akun :\n - Hapus chache app\n - (DIBACA) GUNAKAN DATA SELULER/HOTSPOT SAAT LOGIN SAJA\n - Install Ulang App\n4. Dilarang mengubah Nama profile, Pin, membuka pengaturan akun !!\n\n💌 Email: ${
                        accountDetails.email
                      }\n🔑 Password: ${accountDetails.password}\n👤 Profil: ${
                        accountDetails.profile
                      }\nPIN: ${accountDetails.pin}\ntipe: ${
                        accountDetails.type === "private"
                          ? "Private"
                          : "Sharing"
                      }\n📱 Customer: ${
                        accountDetails.customerIdentifier
                      }\n👨‍💼 Operator: ${
                        currentUser?.name || currentUser?.username
                      }\n⏱️ Berlaku sampai: ${formatExpirationDate(
                        accountDetails.expires_at
                      )}\n\nMelanggar? Akun ditarik + denda Rp300K\nTerima kasih telah memesan di TrustDigital.ID\nContact: @TRUSTDIGITAL001 | IG: @trustdigital.indonesia\nWebsite: https://trustdigital.id\n\nKRITIK DAN SARAN:\nhttps://docs.google.com/forms/d/e/1FAIpQLScSpnLbo4ouMf2hH1rYgJi-xIdV6s8i2euLBTY9Fg1tzVrWyw/viewform?usp=header`
                    );
                    toast({
                      title: "Copied",
                      description: "Account details copied to clipboard",
                    });
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copy to Clipboard
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p>Account details will appear here</p>
                <p className="text-sm mt-1">
                  Select an account type and enter customer information
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
