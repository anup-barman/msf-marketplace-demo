import type { UserState } from "./types";

export const DEMO_PIN = "1234";

interface UserStore extends UserState {
  defaultPin: string;
}

// Kept on globalThis so the in-memory balance survives dev-mode hot reloads.
// It still resets whenever the Node server process restarts.
const globalForUser = globalThis as typeof globalThis & { __upayUser?: UserStore };

export function getUserStore(): UserStore {
  globalForUser.__upayUser ??= {
    name: "Nusrat Jahan",
    phone: "01700000000",
    balance: 55000.0,
    defaultPin: DEMO_PIN,
  };
  return globalForUser.__upayUser;
}

export function publicUser(user: UserStore): UserState {
  return { name: user.name, phone: user.phone, balance: user.balance };
}
