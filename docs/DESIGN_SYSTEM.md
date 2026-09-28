# CardO Design System

Premium, calm, Apple-inspired financial utility. Confidence through typography, spacing, hierarchy, and subtle motion — not decoration.

## Personality

Premium · Calm · Intelligent · Minimal · Trustworthy · Precise

**Avoid:** cheap gradients, cards-within-cards, heavy shadows, glassmorphism spam, clutter, spreadsheet tables on mobile, gamification, fear-based colors, advice language.

---

## Style anchor

Apple Wallet + Things 3 + calm fintech (Copilot / Monarch restraint).  
Print-genre reference: a well-set financial almanac — large numerals, generous margins, quiet rules.

## Palette

### Light

| Token | Hex | Role |
| --- | --- | --- |
| `bg` | `#F7F5F2` | Warm porcelain canvas |
| `surface` | `#FFFFFF` | Cards, sheets, rows |
| `surfaceMuted` | `#EFECE8` | Subtle secondary surfaces |
| `ink` | `#1A1A1A` | Primary text |
| `inkSecondary` | `#6B6B6B` | Labels, captions |
| `inkTertiary` | `#9A9A9A` | Placeholders, disabled |
| `divider` | `#E4E0DB` | Hairlines |
| `accent` | `#0E6B63` | Deep petrol teal — brand |
| `accentSoft` | `#E2F0EE` | Accent tint fills |

### Dark

| Token | Hex | Role |
| --- | --- | --- |
| `bg` | `#0F1114` | Deep charcoal canvas |
| `surface` | `#1A1D22` | Cards, sheets |
| `surfaceMuted` | `#24282E` | Secondary surfaces |
| `ink` | `#F5F5F7` | Primary text |
| `inkSecondary` | `#98989D` | Labels |
| `inkTertiary` | `#6E6E73` | Placeholders |
| `divider` | `#2C3036` | Hairlines |
| `accent` | `#3AA398` | Teal, lifted for contrast |
| `accentSoft` | `#1A3331` | Accent tint |

### Status (semantic)

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `statusNeutral` | `#6B7280` | `#9CA3AF` | Current cycle |
| `statusUpcoming` | `#2563EB` | `#60A5FA` | Statement approaching |
| `statusAttention` | `#B45309` | `#F59E0B` | Payment approaching |
| `statusThreshold` | `#C2410C` | `#FB923C` | Limit utilization high |
| `statusComplete` | `#047857` | `#34D399` | Cycle limit reached |
| `statusCritical` | `#B91C1C` | `#F87171` | Errors, destructive |

Never communicate status by color alone — always pair with text + icon.

---

## Typography

| Role | iOS | Web | Size / weight |
| --- | --- | --- | --- |
| Display numeral | SF Pro Display | Inter / system-ui | 40–48 / 600, tabular |
| Title | SF Pro Display | Inter | 28 / 700 |
| Headline | SF Pro Text | Inter | 20 / 600 |
| Body | SF Pro Text | Inter | 16 / 400 |
| Callout | SF Pro Text | Inter | 15 / 500 |
| Footnote | SF Pro Text | Inter | 13 / 400 |
| Caption | SF Pro Text | Inter | 11–12 / 500, uppercase tracking |

Large financial values use **tabular numerals**. Prefer Dynamic Type on iOS.

---

## Spacing (8-pt)

| Token | Value |
| --- | --- |
| `space1` | 4 |
| `space2` | 8 |
| `space3` | 12 |
| `space4` | 16 |
| `space5` | 24 |
| `space6` | 32 |
| `space7` | 40 |
| `space8` | 48 |
| `space9` | 64 |

Prefer generous whitespace. Section gaps ≥ 32. Card padding 16–24.

---

## Radii & elevation

| Token | Value |
| --- | --- |
| `radiusSm` | 8 |
| `radiusMd` | 12 |
| `radiusLg` | 16 |
| `radiusXl` | 24 |
| `radiusFull` | 999 |

Shadows: prefer flat + hairline borders. One soft elevation for floating sheets only (`0 8 24 rgba(0,0,0,0.08)`).

---

## Components

### CreditCardSummary

Physical-card-inspired, not a fake payment card.

- Issuer + nickname
- Last 4
- Current cycle dates
- Statement countdown
- Spending / personal limit progress
- Status chip (text + icon)

### Progress

```
₱21,450
of ₱30,000
[██████████████░░░░]  71.5%
₱8,550 remaining
```

Animate value changes only (200–300ms). Track muted; fill uses status color when relevant, otherwise `accent`.

### Timeline (billing cycle)

```
Sep 6
│
├──── CURRENT CYCLE ────┤
│
TODAY
│
Oct 5  STATEMENT
│
├──── PAYMENT WINDOW ───┤
│
Oct 25  DUE DATE
```

Subtle enter animation. No perpetual motion.

### Buttons

- Primary: filled `accent`, 50pt height, `radiusMd`
- Secondary: tinted / outline
- Destructive: `statusCritical`, confirmation when irreversible
- Minimum touch target 44×44

### Sheets

Native SwiftUI sheets. Drag indicator, detents, keyboard avoidance, safe-area aware.

### Empty states

Quiet illustration or mark + one line headline + one sentence + one CTA.

---

## Motion

| Interaction | Duration | Curve |
| --- | --- | --- |
| Value / progress | 250–300ms | easeOut |
| Sheet present | system | spring |
| Card insert/remove | 250ms | spring |
| Status change | 200ms | easeInOut |
| Timeline enter | 350ms | easeOut |

No floating loops, no long bounces. Respect Reduce Motion.

## Haptics (iOS)

Light impact: transaction added, card added, important confirm.  
Warning: threshold crossed.  
Never on routine scroll/taps.

---

## Accessibility

- Dynamic Type / responsive text
- VoiceOver labels on all controls
- Progress: accessible value ("71 percent of personal cycle limit")
- Contrast AA in light and dark
- Never color-only meaning

---

## Microcopy

Prefer: "Statement in 3 days" · "₱8,550 remaining" · "Due in 5 days"  
Avoid: long explanations, judgment, advice, fear.

Tone: **Calm. Clear. Confident.**
