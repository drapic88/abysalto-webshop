// Helper utility to manage persistent client cart IDs

export const API_BASE_URL = '/api';
export const CATALOG_API_BASE_URL = '/api';

export function getOrCreateCartId() {
  if (typeof window === 'undefined') {
    return '00000000-0000-0000-0000-000000000000';
  }
  let cartId = localStorage.getItem('abysalto_cart_id');
  if (!cartId) {
    cartId = generateUUID();
    localStorage.setItem('abysalto_cart_id', cartId);
  }
  return cartId;
}

export function clearCartId() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('abysalto_cart_id');
  }
}

function generateUUID() {
  // Simple UUID v4 generator for client compatibility
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
