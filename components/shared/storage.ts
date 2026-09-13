export interface CartItem {
  id: string;
  title: string;
  price: number;
  qty: number;
}
export interface User {
  id?: number;
  email: string;
  name: string;
  phone: string;
  password?: string;
  avatar?: string;
  createdAt: number;
}
export interface Session {
  email: string;
  createdAt: number;
  remember?: boolean;
  dev?: boolean;
}
interface ResetRequest {
  email: string;
  token: string;
  expiresAt: number;
}
interface SavedProduct {
  id: string;
  title: string;
  price: number;
  img: string;
}
interface Order {
  id: string;
  createdAt: number | string;
  itemsCount: number;
  subtotal: number;
  total: number;
  status: string;
  payment: string;
}
interface Wallet {
  wallet: number;
  bonusPts: number;
  level: string;
  refCode: string;
}
interface Ticket {
  id: string;
  topic: string;
  orderId: string;
  text: string;
  status: string;
  createdAt: number;
}
interface Invite {
  id: string;
  email: string;
  ref: string;
  createdAt: number;
}
interface StorageData {
  food_cart_v1: CartItem[];
  food_users_v1: User[];
  food_session_v1: Session | null;
  food_reset_v1: ResetRequest | null;
  food_wishlist_v1: Record<string, SavedProduct[]>;
  food_orders_v1: Record<string, Order[]>;
  food_wallet_v1: Record<string, Wallet>;
  food_tickets_v1: Record<string, Ticket[]>;
  food_invites_v1: Record<string, Invite[]>;
}
type Validator<T> = (value: unknown) => value is T;
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const string = (value: unknown): value is string => typeof value === 'string';
const number = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const optional = <T,>(value: unknown, validate: Validator<T>) => value === undefined || validate(value);
const array = <T,>(validate: Validator<T>): Validator<T[]> => (value): value is T[] => Array.isArray(value) && value.every(validate);
const map = <T,>(validate: Validator<T>): Validator<Record<string, T>> => (value): value is Record<string, T> => record(value) && Object.values(value).every(validate);
const savedProduct: Validator<SavedProduct> = (v): v is SavedProduct => record(v) && string(v.id) && string(v.title) && number(v.price) && string(v.img);
const validators: {
  [K in keyof StorageData]: Validator<StorageData[K]>;
} = {
  food_cart_v1: array((v): v is CartItem => record(v) && string(v.id) && string(v.title) && number(v.price) && v.price >= 0 && number(v.qty) && Number.isInteger(v.qty) && v.qty > 0),
  food_users_v1: array((v): v is User => record(v) && string(v.email) && string(v.name) && string(v.phone) && number(v.createdAt) && optional(v.id, number) && optional(v.password, string) && optional(v.avatar, string)),
  food_session_v1: (v): v is Session | null => v === null || (record(v) && string(v.email) && number(v.createdAt) && optional(v.remember, (x): x is boolean => typeof x === 'boolean') && optional(v.dev, (x): x is boolean => typeof x === 'boolean')),
  food_reset_v1: (v): v is ResetRequest | null => v === null || (record(v) && string(v.email) && string(v.token) && number(v.expiresAt)),
  food_wishlist_v1: map(array(savedProduct)),
  food_orders_v1: map(array((v): v is Order => record(v) && string(v.id) && (number(v.createdAt) || string(v.createdAt)) && number(v.itemsCount) && number(v.subtotal) && number(v.total) && string(v.status) && string(v.payment))),
  food_wallet_v1: map((v): v is Wallet => record(v) && number(v.wallet) && number(v.bonusPts) && string(v.level) && string(v.refCode)),
  food_tickets_v1: map(array((v): v is Ticket => record(v) && string(v.id) && string(v.topic) && string(v.orderId) && string(v.text) && string(v.status) && number(v.createdAt))),
  food_invites_v1: map(array((v): v is Invite => record(v) && string(v.id) && string(v.email) && string(v.ref) && number(v.createdAt))),
};
/** Validate browser data before allowing it into component logic. */
export function readStorage<K extends keyof StorageData>(key: K, fallback: StorageData[K]): StorageData[K] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
    return validators[key](value) ? value : fallback;
  }
  catch {
    return fallback;
  }
}
export function writeStorage<K extends keyof StorageData>(key: K, value: StorageData[K]): void {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event("foodly-storage"));
}
