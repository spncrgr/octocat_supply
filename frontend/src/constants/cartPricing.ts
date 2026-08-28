export const FREE_SHIPPING_THRESHOLD = 100;
export const SHIPPING_FEE = 25;

export const SHIPPING_POLICY_LABEL = `Shipping (Free over $${FREE_SHIPPING_THRESHOLD})`;

export function getSubtotalCents(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100);
}

export function calculateShipping(subtotal: number): number {
  const subtotalCents = getSubtotalCents(subtotal);

  if (subtotalCents === 0 || subtotalCents > FREE_SHIPPING_THRESHOLD * 100) {
    return 0;
  }

  return SHIPPING_FEE;
}
