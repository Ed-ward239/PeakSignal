import { clsx, type ClassValue } from "clsx";

/** Tailwind class merge helper. */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}
