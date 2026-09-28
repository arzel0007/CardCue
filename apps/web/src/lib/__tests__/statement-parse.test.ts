import { describe, expect, it } from "vitest";
import { categorizeMerchant, parseStatementText } from "../statement-parse";

describe("parseStatementText", () => {
  it("parses MM/DD merchant amount lines", () => {
    const text = `
      STATEMENT PERIOD 09/01/2025 - 09/28/2025
      09/12 SM SUPERMARKET QUEZON CITY        2,500.00
      09/15 SHELL KATIPUNAN                     1,800.00
    `;
    const rows = parseStatementText(text, { defaultYear: 2025 });
    expect(rows).toHaveLength(2);
    expect(rows[0].amount).toBe(2500);
    expect(rows[0].transactionDate).toBe("2025-09-12");
    expect(rows[0].merchant.toUpperCase()).toContain("SM");
    expect(rows[0].category).toBe("Groceries");
    expect(rows[1].category).toBe("Fuel");
  });

  it("parses ISO dates and skips totals", () => {
    const text = `
      2025-09-12  AYALA MALLS   1500.00
      TOTAL   12,345.69
      MINIMUM AMOUNT DUE 1,000
    `;
    const rows = parseStatementText(text);
    expect(rows).toHaveLength(1);
    expect(rows[0].transactionDate).toBe("2025-09-12");
    expect(rows[0].amount).toBe(1500);
  });

  it("skips payment/credit lines by default", () => {
    const text = `
      09/20 PAYMENT THANK YOU   5,000.00 CR
      09/21 MERCURY DRUG        850.00
    `;
    const rows = parseStatementText(text, { defaultYear: 2025 });
    expect(rows).toHaveLength(1);
    expect(rows[0].merchant.toUpperCase()).toContain("MERCURY");
  });

  it("parses month-name dates", () => {
    const text = `Sep 12, 2025   GRAB RIDE   1,250.00`;
    const rows = parseStatementText(text);
    expect(rows[0].transactionDate).toBe("2025-09-12");
    expect(rows[0].amount).toBe(1250);
    expect(rows[0].category).toBe("Travel");
  });

  it("keeps full amounts (no 1500→150 truncation)", () => {
    const rows = parseStatementText("2025-09-12  AYALA  1500.00");
    expect(rows[0].amount).toBe(1500);
    expect(parseStatementText("09/12 STORE 2500.00", { defaultYear: 2025 })[0].amount).toBe(2500);
    expect(parseStatementText("09/12 STORE 2,500.00", { defaultYear: 2025 })[0].amount).toBe(2500);
  });

  it("uses date line then amount line", () => {
    const text = `
      Sep 12, 2025
      SM SUPERMARKET 2500.00
    `;
    const rows = parseStatementText(text);
    expect(rows).toHaveLength(1);
    expect(rows[0].transactionDate).toBe("2025-09-12");
    expect(rows[0].amount).toBe(2500);
    expect(rows[0].merchant.toUpperCase()).toContain("SM");
  });

  it("takes last money token as amount (right column)", () => {
    const rows = parseStatementText(
      "09/12 ITEM REF 12345 150.00 2500.00",
      { defaultYear: 2025 }
    );
    expect(rows[0].amount).toBe(2500);
  });

  it("ignores summary fields and account numbers (BPI SOA style)", () => {
    const text = `
      Previous Balance 7,710.16
      Ending Balance 11,143.93
      Unbilled Installment Amount 71,658.32
      548809-3-70-0524197 - ARJAY P RESURRECCION
      August 28  Digimap-Ayala Vermosa Im: 04/24  3,582.92
      July 29  Apple.Com/Bill  Cork  49.49
    `;
    const rows = parseStatementText(text, { defaultYear: 2025 });
    const names = rows.map((r) => r.merchant.toUpperCase()).join(" ");
    expect(names).not.toContain("UNBILLED");
    expect(names).not.toContain("ARJAY");
    expect(names).not.toContain("PREVIOUS");
    expect(rows.map((r) => r.amount)).not.toContain(71658.32);
    expect(rows).toHaveLength(2);
    expect(rows[0].amount).toBe(3582.92);
    expect(rows[0].transactionDate).toBe("2025-08-28");
    expect(rows[1].amount).toBe(49.49);
    expect(rows[1].merchant.toUpperCase()).toContain("APPLE");
  });
});

describe("categorizeMerchant", () => {
  it("maps common merchants", () => {
    expect(categorizeMerchant("SM SUPERMARKET")).toBe("Groceries");
    expect(categorizeMerchant("Shell Station")).toBe("Fuel");
    expect(categorizeMerchant("Grab Car")).toBe("Travel");
    expect(categorizeMerchant("Something Else LLC")).toBe("Other");
  });
});
