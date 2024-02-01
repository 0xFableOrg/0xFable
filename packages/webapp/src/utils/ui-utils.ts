import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines and deduplicates class names using `clsx` and `tailwind-merge`.
 *
 * This function takes any number of class value inputs, combines them into
 * a single string of class names using `clsx`, and then deduplicates
 * any Tailwind CSS classes using `tailwind-merge`. This is useful for
 * dynamically generating a class string in React components, especially when
 * dealing with conditional class names or combining classes from different sources.
 *
 * @param inputs - An array of class value inputs. Each input can be a string,
 * an array, or an object with class names as keys and boolean values as values
 * to conditionally include classes.
 *
 * @returns A string of combined and deduplicated class names.
 *
 * @example
 * cn('text-center', 'py-2', { 'bg-red-500': isError }, ['hover:bg-blue-500'])
 * // Returns a string of class names, e.g., 'text-center py-2 bg-red-500 hover:bg-blue-500'
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

