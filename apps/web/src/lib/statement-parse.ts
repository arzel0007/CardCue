/**
 * Statement line parser — turns OCR/PDF text into candidate transactions.
 *
 * SOAs / screenshots vary wildly. Strategies:
 * 1. Single line: date + merchant + amount
 * 2. Date on one line, merchant + amount on the next
 * 3. Table-like rows: take the **last money token** as amount (right column)
 * 4. Amount-only lines attached to the previous date
 *
 * OCR cleanup: O/0, l/1, B/8, trailing CR/DR, peso signs, etc.
 */

export interface ParsedTransaction {
  transactionDate: string; // YYYY-MM-DD
  amount: number;
  merchant: string;
  category: string;
  notes?: string;
  raw: string;
}

export interface ParseOptions {
  defaultYear?: number;
  includeCredits?: boolean;
}

const CREDIT_MARKERS = /\b(CR|CREDIT|PAYMENT|PAYMENT\s+THANK|REFUND|REVERSAL|DISPUTE)\b/i;

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6, jul: 7, july: 7,
  aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

/** Heuristic category from merchant text. */
export function categorizeMerchant(merchant: string): string {
  const m = merchant.toLowerCase();
  if (/sm\s|supermarket|grocery|puregold|landers|s&r|market|waltermart/.test(m)) return "Groceries";
  if (/petron|shell|caltex|fuel|gas\s|unioil|seaoil/.test(m)) return "Fuel";
  if (/restaurant|jollibee|mcdonald|kfc|starbucks|coffee|food|pizza|ramen|grill|eat|canteen|turo/.test(m)) return "Restaurant";
  if (/grab|angkas|uber|taxi|transport|lrt|mrt|fare|sakay|joybus/.test(m)) return "Travel";
  if (/mercury|watsons|hospital|clinic|pharmacy|medical|dental/.test(m)) return "Health";
  if (/netflix|spotify|disney|cinema|gaming|steam|playstation|youtube/.test(m)) return "Entertainment";
  if (/meralco|manila water|maynilad|pldt|globe|smart|bills|electric|water|internet|converge/.test(m)) return "Bills";
  if (/zalora|lazada|shopee|uniqlo|h&m|shopping|mall|store|landmark|sm store/.test(m)) return "Shopping";
  return "Other";
}

/** OCR noise: O↔0, l/I↔1, B↔8 near digits only. */
function cleanOcrNumber(raw: string): string {
  return raw
    .replace(/[Oo]/g, "0")
    .replace(/[lI|]/g, "1")
    .replace(/[Bb]/g, "8")
    .replace(/[Ss]/g, "5");
}

function parseAmount(raw: string): number | null {
  let s = raw
    .replace(/PHP|₱|P\b|USD|\$|,|\s/gi, "")
    .replace(/[^0-9.\-]/g, "");
  if (!s || s === "-" || s === ".") return null;
  // If cleaning OCR noise helps a digit-only mess, try again once
  if (!/^\d+(\.\d{1,2})?$/.test(s)) {
    const noise = cleanOcrNumber(raw)
      .replace(/PHP|₱|P\b|USD|\$|,|\s/gi, "")
      .replace(/[^0-9.\-]/g, "");
    if (/^\d+(\.\d{1,2})?$/.test(noise)) s = noise;
    else return null;
  }
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  if (n < 1) return null;
  return n;
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function toISO(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return `${year}-${pad(month)}-${pad(day)}`;
}

function monthNum(token: string): number | null {
  // Exact month name or 3-letter abbrev only — "market" is not March.
  return MONTHS[token.toLowerCase().replace(/\.$/, "")] ?? null;
}

export function parseDate(line: string, defaultYear: number): string | null {
  type Hit = { index: number; iso: string };
  const hits: Hit[] = [];

  for (const m of line.matchAll(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g)) {
    const iso = toISO(Number(m[1]), Number(m[2]), Number(m[3]));
    if (iso) hits.push({ index: m.index ?? 0, iso });
  }

  for (const m of line.matchAll(/\b(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?\b/g)) {
    const a = Number(m[1]);
    const b = Number(m[2]);
    let y = defaultYear;
    if (m[3]) y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
    let iso: string | null = null;
    if (a >= 1 && a <= 12 && b >= 1 && b <= 31) iso = toISO(y, a, b);
    else if (b >= 1 && b <= 12 && a >= 1 && a <= 31) iso = toISO(y, b, a);
    if (iso) hits.push({ index: m.index ?? 0, iso });
  }

  for (const m of line.matchAll(
    /\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(20\d{2}))?\b/g
  )) {
    const mon = monthNum(m[1]);
    if (mon != null) {
      const iso = toISO(m[3] ? Number(m[3]) : defaultYear, mon, Number(m[2]));
      if (iso) hits.push({ index: m.index ?? 0, iso });
    }
  }

  for (const m of line.matchAll(
    /\b(\d{1,2})(?:st|nd|rd|th)?[\s\-\/]([A-Za-z]{3,9})\.?(?:[\s\-\/](20\d{2}|\d{2}))?\b/g
  )) {
    const mon = monthNum(m[2]);
    if (mon != null) {
      let y = defaultYear;
      if (m[3]) y = m[3].length === 2 ? 2000 + Number(m[3]) : Number(m[3]);
      const iso = toISO(y, mon, Number(m[1]));
      if (iso) hits.push({ index: m.index ?? 0, iso });
    }
  }

  if (!hits.length) return null;
  hits.sort((a, b) => a.index - b.index);
  return hits[0].iso;
}

/** All money-like tokens; prefer the last (statement amount column). */
function amountCandidates(line: string): number[] {
  // Prefer full numbers with decimals / thousands; don't truncate 1500 → 150
  const re =
    /(?:PHP|₱|P|USD|\$)?\s*(\d{1,3}(?:,\d{3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)(?:\s*(?:CR|DR))?/gi;
  const out: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const n = parseAmount(m[1] ?? m[0]);
    if (n != null) out.push(n);
  }
  return out;
}

function isCreditLine(line: string): boolean {
  return CREDIT_MARKERS.test(line);
}

function stripDatePortion(line: string): string {
  let s = line
    .replace(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g, " ")
    // / and - only — do not treat money "49.49" as a date
    .replace(/\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b/g, " ");

  // Only strip month-name dates when the word is actually a month
  s = s.replace(
    /\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(20\d{2}))?\b/g,
    (full, mon: string, day: string) =>
      monthNum(mon) != null ? " " : full
  );
  s = s.replace(
    /\b(\d{1,2})(?:st|nd|rd|th)?[\s\-\/]([A-Za-z]{3,9})\.?(?:[\s\-\/](20\d{2}|\d{2}))?\b/g,
    (full, day: string, mon: string) =>
      monthNum(mon) != null ? " " : full
  );
  return s;
}

const SKIP_LINE =
  /^(page\s+\d+|statement|account\s+(no|number|ending)|card\s+member|previous\s+balance|new\s+balance|beginning\s+balance|ending\s+balance|past\s+due|minimum\s+amount|minimum\s+payment|credit\s+limit|available\s+credit|total|subtotal|finance\s+charge|interest|cutoff|due\s+date|statement\s+date|payment\s+due|unbilled\s+installment|installment\s+balance|installment\s+amortization|customer\s+number)/i;

/** Account / card numbers and cardholder header lines — not transactions. */
function isAccountNoise(line: string): boolean {
  // 548809-3-70-0524197 (3+ hyphen groups) — not ISO dates (2 hyphens)
  if (/\d+(-\d+){3,}/.test(line)) return true;
  // Long bare card/account digits
  if (/\b\d{12,19}\b/.test(line)) return true;
  // "548809-3-70-0524197 - ARJAY P RESURRECCION" cardholder header (4+ number groups)
  if (/\d+(-\d+){3,}/.test(line) && /\b[A-Z]{3,}\s+[A-Z]/.test(line)) {
    return true;
  }
  return false;
}

function isJunkLine(line: string): boolean {
  if (line.length < 6) return true;
  if (SKIP_LINE.test(line)) return true;
  if (isAccountNoise(line)) return true;
  if (
    /\b(previous\s+balance|new\s+balance|ending\s+balance|unbilled\s+installment|installment\s+balance|finance\s+charge|total\s+amount\s+due)\b/i.test(
      line
    )
  ) {
    return true;
  }
  return false;
}

// Debug-only exports for tests
export function __debugLine(line: string, defaultYear: number) {
  return {
    junk: isJunkLine(line),
    account: isAccountNoise(line),
    date: parseDate(line, defaultYear),
    stripped: stripDatePortion(line),
    amounts: amountCandidates(stripDatePortion(line)),
    amount: pickAmount(amountCandidates(stripDatePortion(line)), line),
    merchant: cleanMerchant(line),
  };
}

/** Prefer real money tokens (decimals or reasonable magnitude). */
function pickAmount(amounts: number[], line: string): number | null {
  if (amounts.length === 0) return null;
  // Prefer tokens that look like money: have .xx or under 10M
  const withDecimals = amounts.filter((n) => Math.abs(n) % 1 !== 0 || n < 1_000_000);
  const pool = withDecimals.length ? withDecimals : amounts;
  const last = pool[pool.length - 1];
  // Reject absurd OCR garbage (e.g. 5,826,318 from random digits)
  if (last >= 10_000_000) return null;
  // Skip if line is clearly a summary already filtered
  if (/installment\s+amount|balance/i.test(line) && !/payment|apple|zus|sm |mall/i.test(line)) {
    return null;
  }
  return last;
}

function cleanMerchant(line: string): string {
  let m = line;
  m = m.replace(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/g, " ");
  m = m.replace(/\b\d{1,2}[\/\-.]\d{1,2}(?:[\/\-.]\d{2,4})?\b/g, " ");
  m = m.replace(
    /\b([A-Za-z]{3,9})\.?\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s*20\d{2})?\b/g,
    " "
  );
  m = m.replace(
    /\b\d{1,2}(?:st|nd|rd|th)?[\s\-\/]([A-Za-z]{3,9})\.?(?:[\s\-\/](20\d{2}|\d{2}))?\b/g,
    " "
  );
  m = m.replace(/(?:PHP|₱|P|USD|\$)\s*[\d,.\s]+(?:\s*(?:CR|DR))?/gi, " ");
  m = m.replace(/\b[\d,]+\.\d{2}\b(?:\s*(?:CR|DR))?/gi, " ");
  m = m.replace(/\b(?:CR|DR)\b/gi, " ");
  m = m.replace(/\s{2,}/g, " ").trim();
  return m.replace(/^[\s\-–—•.|]+/, "").replace(/[\s\-–—•.|]+$/, "").slice(0, 80);
}

/**
 * Parse multi-line statement text into transaction candidates.
 */
export function parseStatementText(
  text: string,
  options: ParseOptions = {}
): ParsedTransaction[] {
  const year = options.defaultYear ?? new Date().getFullYear();
  const includeCredits = options.includeCredits ?? false;
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/[ \t]{2,}/g, " ").trim())
    .filter(Boolean);

  const out: ParsedTransaction[] = [];
  let lastDate: string | null = null;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    if (isJunkLine(line)) continue;

    const isCredit = isCreditLine(line);
    if (isCredit && !includeCredits) {
      // Still remember date if present
      const dOnly = parseDate(line, year);
      if (dOnly) lastDate = dOnly;
      continue;
    }

    const date = parseDate(line, year);
    // Don't treat "2025" in "Sep 12, 2025" as an amount
    const amounts = amountCandidates(stripDatePortion(line));
    const amount = pickAmount(amounts, line);

    // Strategy A: date + amount on same line
    if (date && amount != null) {
      const merchant = cleanMerchant(line) || "Imported";
      if (!/^\d+$/.test(merchant) && amount >= 1) {
        out.push(makeRow(date, amount, merchant, isCredit, line));
        lastDate = date;
        continue;
      }
    }

    // Remember date-only lines for multi-line rows
    if (date && amount == null) {
      lastDate = date;
      continue;
    }

    // Strategy B: amount without date — use previous date on nearby lines
    if (!date && amount != null && lastDate) {
      const merchant = cleanMerchant(line) || "Imported";
      if (merchant && !/^\d+$/.test(merchant) && amount >= 1) {
        out.push(makeRow(lastDate, amount, merchant, isCredit, line));
      }
    }
  }

  // De-dupe
  const seen = new Set<string>();
  return out.filter((t) => {
    const key = `${t.transactionDate}|${t.amount}|${t.merchant.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function makeRow(
  date: string,
  amount: number,
  merchant: string,
  isCredit: boolean,
  raw: string
): ParsedTransaction {
  return {
    transactionDate: date,
    amount: isCredit ? -amount : amount,
    merchant,
    category: categorizeMerchant(merchant),
    notes: isCredit ? "Credit / payment line" : "Imported from statement",
    raw,
  };
}

export function parsedToTransactionInput(
  parsed: ParsedTransaction,
  cardId: string
): Omit<ParsedTransaction, "raw"> & {
  id: string;
  cardId: string;
  createdAt: string;
  updatedAt: string;
} {
  const now = new Date().toISOString();
  return {
    id: `txn-${crypto.randomUUID()}`,
    cardId,
    transactionDate: parsed.transactionDate,
    amount: Math.abs(parsed.amount),
    merchant: parsed.merchant,
    category: parsed.category,
    notes: parsed.notes,
    createdAt: now,
    updatedAt: now,
  };
}
