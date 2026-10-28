import type { LocalCartItem } from '@/api/cart';

export function cartItemCount(items: readonly LocalCartItem[]): number {
  return items.reduce((count, item) => count + (Number.isInteger(item.quantity) && item.quantity > 0 ? item.quantity : 0), 0);
}
