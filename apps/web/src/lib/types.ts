/**
 * CardCue domain types — mirrors docs/DOMAIN.md.
 * These map 1:1 to Supabase tables when the live backend is wired up.
 */

export type ISODateString = string; // YYYY-MM-DD
export type ISODateTimeString = string;
export type UUID = string;

export interface User {
  id: UUID;
  email: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
  /** ISO 4217, default "PHP" */
  preferredCurrency: string;
  /** IANA timezone, default device */
  timezone: string;
  /** UI / notification defaults */
  preferences: Record<string, unknown>;
}

export interface CreditCard {
  id: UUID;
  userId: UUID;
  /** e.g. "BPI Rewards" */
  nickname: string;
  /** e.g. "BPI" */
  issuer: string;
  /** optional enum-ish */
  cardType?: string;
  /** **only** last 4 — never store a full PAN */
  lastFourDigits: string;
  /** display only */
  creditLimit: number;
  /** user's cycle budget — NEVER "available credit". null = not set */
  personalCycleLimit: number | null;
  /** 1–31 */
  statementDay: number;
  /** 1–31 */
  dueDay: number;
  isArchived: boolean;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface Transaction {
  id: UUID;
  userId: UUID;
  cardId: UUID;
  /** positive = spend */
  amount: number;
  /** user-entered posting/transaction date */
  transactionDate: ISODateString;
  category: string;
  merchant?: string;
  notes?: string;
  createdAt: ISODateTimeString;
  updatedAt: ISODateTimeString;
}

export interface NotificationPreference {
  id: UUID;
  userId: UUID;
  /** null = global default */
  cardId: UUID | null;
  statement7Days: boolean;
  statement3Days: boolean;
  statementGenerated: boolean;
  due7Days: boolean;
  due3Days: boolean;
  dueDate: boolean;
  threshold50: boolean;
  threshold75: boolean;
  threshold90: boolean;
  threshold100: boolean;
}

export type CardStatus = "neutral" | "upcoming" | "attention" | "threshold" | "complete";

export interface SpendingSnapshot {
  currentCycleSpending: number;
  personalCycleLimit: number | null;
  personalLimitRemaining: number | null;
  /** 0..1 */
  personalLimitUtilization: number | null;
}

export interface BillingCycleSnapshot {
  currentCycleStart: ISODateString;
  currentCycleEnd: ISODateString;
  nextStatementDate: ISODateString;
  nextDueDate: ISODateString;
  daysUntilStatement: number;
  daysUntilDue: number;
  /** 0..1 */
  cycleProgress: number;
  today: ISODateString;
}

export interface CardCycleView {
  card: CreditCard;
  cycle: BillingCycleSnapshot;
  spending: SpendingSnapshot;
  status: CardStatus;
}
