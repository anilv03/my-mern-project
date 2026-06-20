export const CART_KEY = 'zalnio_cart';
export const WISHLIST_KEY = 'zalnio_wishlist';

export const loadState = (key) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
};

export const saveState = (key, state) => {
  try {
    localStorage.setItem(key, JSON.stringify(state));
  } catch {
  }
};
