import type { Account, AuthState } from "./types";

// Demo credentials are intentionally exposed in the UI side panel so testers
// can log in instantly without hunting for a seed file.
export const DEMO_ACCOUNTS: Account[] = [
  {
    id: "acc_001",
    name: "Nusrat Jahan",
    phone: "01700000001",
    email: "nusrat.jahan@upay demo.com",
    password: "1234",
    balance: 55000.0,
    address: "House #12, Road #4, Dhanmondi, Dhaka-1215",
    createdAt: "2025-01-10T06:00:00.000Z",
  },
  {
    id: "acc_002",
    name: "Rakib Hossain",
    phone: "01800000002",
    email: "rakib.hossain@upay demo.com",
    password: "5678",
    balance: 120000.0,
    address: "Avenue #7, Block #C, Gulshan-2, Dhaka-1212",
    createdAt: "2025-02-14T08:30:00.000Z",
  },
  {
    id: "acc_003",
    name: "Sadia Akter",
    phone: "01900000003",
    email: "sadia.akter@upay demo.com",
    password: "9012",
    balance: 8500.0,
    address: "Plot #22, Sector #11, Uttara, Dhaka-1230",
    createdAt: "2025-03-22T11:00:00.000Z",
  },
];

export const DEFAULT_DEMO_ACCOUNT = DEMO_ACCOUNTS[0];
export const DEMO_PIN = "1234";

interface AccountStore {
  current: Account | null;
  token: string | null;
  isAuthenticated: boolean;
}

const globalForAccounts = globalThis as typeof globalThis & { __upayAccounts?: AccountStore };

export function getAccountStore(): AccountStore {
  globalForAccounts.__upayAccounts ??= {
    current: null,
    token: null,
    isAuthenticated: false,
  };
  return globalForAccounts.__upayAccounts;
}

export function findAccount(identifier: string, password: string): Account | null {
  const normalized = identifier.trim().toLowerCase();
  return (
    DEMO_ACCOUNTS.find(
      (account) =>
        (account.phone.toLowerCase() === normalized ||
          account.email.toLowerCase() === normalized ||
          account.name.toLowerCase() === normalized) &&
        account.password === password,
    ) ?? null
  );
}

export function createAccount(input: {
  name: string;
  phone: string;
  email: string;
  password: string;
  address?: string;
}): Account {
  const id = `acc_${String(DEMO_ACCOUNTS.length + 1).padStart(3, "0")}`;
  const account: Account = {
    id,
    name: input.name.trim(),
    phone: input.phone.trim(),
    email: input.email.trim().toLowerCase(),
    password: input.password,
    balance: 0,
    address: input.address?.trim() || undefined,
    createdAt: new Date().toISOString(),
  };
  DEMO_ACCOUNTS.push(account);
  return account;
}

export function publicAccount(account: Account | null): Omit<Account, "password"> | null {
  if (!account) return null;
  const { password: _password, ...rest } = account;
  return rest;
}

export function authState(): AuthState {
  const store = getAccountStore();
  return {
    isAuthenticated: store.isAuthenticated,
    account: publicAccount(store.current),
    token: store.token,
  };
}

export function login(identifier: string, password: string): AuthState {
  const account = findAccount(identifier, password);
  if (!account) {
    return { isAuthenticated: false, account: null, token: null };
  }
  const store = getAccountStore();
  store.current = account;
  store.isAuthenticated = true;
  store.token = `tok_${account.id}_${Date.now().toString(36)}`;
  return authState();
}

export function logout(): AuthState {
  const store = getAccountStore();
  store.current = null;
  store.isAuthenticated = false;
  store.token = null;
  return authState();
}

export function updateBalance(accountId: string, newBalance: number): Account | null {
  const account = DEMO_ACCOUNTS.find((acc) => acc.id === accountId);
  if (!account) return null;
  account.balance = Number(newBalance.toFixed(2));
  if (getAccountStore().current?.id === accountId) {
    getAccountStore().current = account;
  }
  return account;
}

export function getCurrentAccount(): Account | null {
  return getAccountStore().current;
}