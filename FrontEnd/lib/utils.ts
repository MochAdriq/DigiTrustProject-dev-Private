import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateRandomProfiles(type: "private" | "sharing") {
  const count = type === "private" ? 8 : 20
  const profiles = []
  const profileNames = ["A", "B", "C", "D", "E", "F", "G", "H"]

  for (let i = 0; i < count; i++) {
    const profileIndex = i % 8
    const pin = String((profileIndex + 1) * 1111).padStart(4, "0")

    profiles.push({
      profile: `Profile ${profileNames[profileIndex]}`,
      pin,
    })
  }

  // Shuffle the array to randomize the order
  return profiles.sort(() => Math.random() - 0.5)
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}
