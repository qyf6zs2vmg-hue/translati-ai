import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(prefix: string = 'id', index?: number) {
  const random = Math.random().toString(36).substr(2, 9);
  const suffix = index !== undefined ? `-${index}` : `-${random}`;
  return `${prefix}-${Date.now()}${suffix}`;
}
