import type { CreditCard, NotificationPreference, Transaction, User } from "./types";

/**
 * Demo-mode dataset (no Firebase env configured).
 * Used only for local UI exploration — never for production user data.
 * Live data is loaded from Firestore when Firebase is configured.
 */

const nowISO = new Date().toISOString();
const userId = "user-mock-0001";

export const mockUser: User = {
  id: userId,
  email: "alex@cardcue.app",
  createdAt: nowISO,
  updatedAt: nowISO,
  preferredCurrency: "PHP",
  timezone: "Asia/Manila",
  preferences: {
    theme: "system",
    defaultView: "dashboard",
  },
};

function daysFromToday(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export const mockCards: CreditCard[] = [
  {
    id: "card-0001",
    userId,
    nickname: "BPI Rewards",
    issuer: "BPI",
    cardType: "Rewards",
    lastFourDigits: "4281",
    creditLimit: 120_000,
    personalCycleLimit: 30_000,
    statementBalance: 8_500,
    statementDay: 5,
    dueDay: 25,
    isArchived: false,
    createdAt: nowISO,
    updatedAt: nowISO,
  },
  {
    id: "card-0002",
    userId,
    nickname: "BDO Gold",
    issuer: "BDO",
    cardType: "Gold",
    lastFourDigits: "9012",
    creditLimit: 200_000,
    personalCycleLimit: 45_000,
    statementBalance: 12_200,
    statementDay: 12,
    dueDay: 2,
    isArchived: false,
    createdAt: nowISO,
    updatedAt: nowISO,
  },
  {
    id: "card-0003",
    userId,
    nickname: "Metrobank Cashback",
    issuer: "Metrobank",
    cardType: "Cashback",
    lastFourDigits: "7734",
    creditLimit: 80_000,
    personalCycleLimit: 18_000,
    statementBalance: 0,
    statementDay: 28,
    dueDay: 18,
    isArchived: false,
    createdAt: nowISO,
    updatedAt: nowISO,
  },
];

export const mockTransactions: Transaction[] = [
  {
    id: "txn-0001",
    userId,
    cardId: "card-0001",
    amount: 2_450,
    transactionDate: daysFromToday(-1),
    category: "Groceries",
    merchant: "SM Supermarket",
    createdAt: nowISO,
    updatedAt: nowISO,
  },
  {
    id: "txn-0002",
    userId,
    cardId: "card-0001",
    amount: 890,
    transactionDate: daysFromToday(-3),
    category: "Restaurant",
    merchant: "Wildflour",
    createdAt: nowISO,
    updatedAt: nowISO,
  },
  {
    id: "txn-0003",
    userId,
    cardId: "card-0001",
    amount: 1_200,
    transactionDate: daysFromToday(-6),
    category: "Fuel",
    merchant: "Shell",
    notes: "Full tank",
    createdAt: nowISO,
    updatedAt: nowISO,
  },
  {
    id: "txn-0004",
    userId,
    cardId: "card-0001",
    amount: 4_500,
    transactionDate: daysFromToday(-10),
    category: "Shopping",
    merchant: "Zalora",
    createdAt: nowISO,
    updatedAt: nowISO,
  },
  {
    id: "txn-0005",
    userId,
    cardId: "card-0001",
    amount: 3_200,
    transactionDate: daysFromToday(-14),
    category: "Utilities",
    merchant: "Meralco",
    createdAt: nowISO,
    updatedAt: nowISO,
  },
  {
    id: "txn-0006",
    userId,
    cardId: "card-0001",
    amount: 12_340,
    transactionDate: daysFromToday(-18),
    category: "Travel",
    merchant: "Cebu Pacific",
    createdAt: nowISO,
    updatedAt: nowISO,
  },
  {
    id: "txn-0007",
    userId,
    cardId: "card-0002",
    amount: 6_800,
    transactionDate: daysFromToday(-2),
    category: "Shopping",
    merchant: "SM Store",
    createdAt: nowISO,
    updatedAt: nowISO,
  },
  {
    id: "txn-0008",
    userId,
    cardId: "card-0002",
    amount: 1_560,
    transactionDate: daysFromToday(-5),
    category: "Restaurant",
    merchant: "Mendokoro",
    createdAt: nowISO,
    updatedAt: nowISO,
  },
  {
    id: "txn-0009",
    userId,
    cardId: "card-0002",
    amount: 22_000,
    transactionDate: daysFromToday(-8),
    category: "Electronics",
    merchant: "Power Mac Center",
    createdAt: nowISO,
    updatedAt: nowISO,
  },
  {
    id: "txn-0010",
    userId,
    cardId: "card-0002",
    amount: 3_100,
    transactionDate: daysFromToday(-12),
    category: "Groceries",
    merchant: "Landers",
    createdAt: nowISO,
    updatedAt: nowISO,
  },
  {
    id: "txn-0011",
    userId,
    cardId: "card-0003",
    amount: 780,
    transactionDate: daysFromToday(-1),
    category: "Coffee",
    merchant: "Habitual Coffee",
    createdAt: nowISO,
    updatedAt: nowISO,
  },
  {
    id: "txn-0012",
    userId,
    cardId: "card-0003",
    amount: 1_450,
    transactionDate: daysFromToday(-4),
    category: "Groceries",
    merchant: "Robinsons Supermarket",
    createdAt: nowISO,
    updatedAt: nowISO,
  },
  {
    id: "txn-0013",
    userId,
    cardId: "card-0003",
    amount: 9_800,
    transactionDate: daysFromToday(-9),
    category: "Health",
    merchant: "Metro Dental",
    createdAt: nowISO,
    updatedAt: nowISO,
  },
  {
    id: "txn-0014",
    userId,
    cardId: "card-0003",
    amount: 2_100,
    transactionDate: daysFromToday(-15),
    category: "Fuel",
    merchant: "Petron",
    createdAt: nowISO,
    updatedAt: nowISO,
  },
];

export const mockNotificationPreference: NotificationPreference = {
  id: "np-0001",
  userId,
  cardId: null,
  statement7Days: true,
  statement3Days: true,
  statementGenerated: true,
  due7Days: true,
  due3Days: true,
  dueDate: true,
  threshold50: false,
  threshold75: true,
  threshold90: true,
  threshold100: true,
};

export const transactionCategories = [
  "Groceries",
  "Restaurant",
  "Fuel",
  "Shopping",
  "Utilities",
  "Travel",
  "Health",
  "Coffee",
  "Electronics",
  "Other",
] as const;

export const cardIssuers = ["BPI", "BDO", "Metrobank", "UnionBank", "Security Bank", "RCBC", "EastWest", "Other"] as const;

export const currencies = [
  { code: "PHP", label: "Philippine Peso (₱)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "JPY", label: "Japanese Yen (¥)" },
  { code: "SGD", label: "Singapore Dollar (S$)" },
] as const;

export const timezones = [
  "Asia/Manila",
  "Asia/Singapore",
  "Asia/Tokyo",
  "America/Los_Angeles",
  "America/New_York",
  "Europe/London",
  "UTC",
] as const;
