import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merges Tailwind CSS classes with clsx, handling conflicts intelligently.
 * 
 * @param inputs - Class names to merge
 * @returns Merged class string
 * 
 * @example
 * ```tsx
 * cn("px-2 py-1", condition && "bg-blue-500", "text-white")
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Capitalizes the first letter of a string.
 * 
 * @param val - The string to capitalize
 * @returns String with first letter capitalized
 * 
 * @example
 * ```ts
 * capitalizeFirstLetter("hello") // "Hello"
 * ```
 */
export function capitalizeFirstLetter(val: string): string {
  return String(val).charAt(0).toUpperCase() + String(val).slice(1);
}