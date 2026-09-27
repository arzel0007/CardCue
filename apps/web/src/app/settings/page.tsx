"use client";

import * as React from "react";
import { useStore } from "@/lib/store";
import { currencies, timezones } from "@/lib/mock-data";
import { SwitchRow } from "@/components/ui/switch";
import { Field, Select } from "@/components/ui/form";
import { SectionHeader, Surface } from "@/components/ui/surface";
import { Badge } from "@/components/ui/badge";

const statementPrefs = [
  {
    key: "statement7Days" as const,
    label: "Statement · 7 days before",
    description: "A quiet heads-up a week out.",
  },
  {
    key: "statement3Days" as const,
    label: "Statement · 3 days before",
    description: "Closer reminder as the statement approaches.",
  },
  {
    key: "statementGenerated" as const,
    label: "Statement generated",
    description: "When the statement closes.",
  },
];

const duePrefs = [
  {
    key: "due7Days" as const,
    label: "Due · 7 days before",
    description: "Early payment window notice.",
  },
  {
    key: "due3Days" as const,
    label: "Due · 3 days before",
    description: "Payment approaching.",
  },
  {
    key: "dueDate" as const,
    label: "Due date",
    description: "On the day payment is due.",
  },
];

const thresholdPrefs = [
  {
    key: "threshold50" as const,
    label: "50% of Personal Cycle Limit",
    description: "Halfway through your cycle budget.",
  },
  {
    key: "threshold75" as const,
    label: "75% of Personal Cycle Limit",
    description: "Three-quarters used.",
  },
  {
    key: "threshold90" as const,
    label: "90% of Personal Cycle Limit",
    description: "Approaching your limit.",
  },
  {
    key: "threshold100" as const,
    label: "100% of Personal Cycle Limit",
    description: "Cycle limit reached.",
  },
];

export default function SettingsPage() {
  const {
    user,
    notificationPreference,
    updateNotificationPreference,
    updateUser,
  } = useStore();
  const [mounted, setMounted] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!mounted) return;
    setSaved(true);
    const t = window.setTimeout(() => setSaved(false), 1800);
    return () => window.clearTimeout(t);
  }, [notificationPreference, user.preferredCurrency, user.timezone, mounted]);

  if (!mounted) {
    return (
      <div className="space-y-8">
        <PageHeader saved={false} />
        <div className="surface h-64 animate-pulse" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <PageHeader saved={saved} />

      <section aria-labelledby="prefs-heading" className="space-y-5">
        <SectionHeader
          title="Preferences"
          subtitle="Currency and timezone used across the companion."
        />
        <Surface className="grid gap-6 p-6 sm:grid-cols-2">
          <Field
            label="Currency"
            htmlFor="set-currency"
            hint="Used for all money values."
          >
            <Select
              id="set-currency"
              value={user.preferredCurrency}
              onChange={(e) => updateUser({ preferredCurrency: e.target.value })}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Timezone"
            htmlFor="set-timezone"
            hint={`Current: ${user.timezone}`}
          >
            <Select
              id="set-timezone"
              value={user.timezone}
              onChange={(e) => updateUser({ timezone: e.target.value })}
            >
              {timezones.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </Select>
          </Field>
        </Surface>
      </section>

      <section aria-labelledby="notif-heading" className="space-y-5">
        <SectionHeader
          title="Notifications"
          subtitle="Calm reminders — never fear-based, never advice."
        />

        <Surface className="divide-y divide-divider p-2">
          <div className="px-4 pt-3 pb-1">
            <h3 className="caption text-ink-secondary">Statement</h3>
          </div>
          {statementPrefs.map((p) => (
            <div key={p.key} className="px-4">
              <SwitchRow
                id={`np-${p.key}`}
                label={p.label}
                description={p.description}
                checked={notificationPreference[p.key]}
                onCheckedChange={(next) =>
                  updateNotificationPreference({ [p.key]: next })
                }
              />
            </div>
          ))}
        </Surface>

        <Surface className="divide-y divide-divider p-2">
          <div className="px-4 pt-3 pb-1">
            <h3 className="caption text-ink-secondary">Payment due</h3>
          </div>
          {duePrefs.map((p) => (
            <div key={p.key} className="px-4">
              <SwitchRow
                id={`np-${p.key}`}
                label={p.label}
                description={p.description}
                checked={notificationPreference[p.key]}
                onCheckedChange={(next) =>
                  updateNotificationPreference({ [p.key]: next })
                }
              />
            </div>
          ))}
        </Surface>

        <Surface className="divide-y divide-divider p-2">
          <div className="px-4 pt-3 pb-1">
            <h3 className="caption text-ink-secondary">
              Personal Cycle Limit utilization
            </h3>
          </div>
          {thresholdPrefs.map((p) => (
            <div key={p.key} className="px-4">
              <SwitchRow
                id={`np-${p.key}`}
                label={p.label}
                description={p.description}
                checked={notificationPreference[p.key]}
                onCheckedChange={(next) =>
                  updateNotificationPreference({ [p.key]: next })
                }
              />
            </div>
          ))}
        </Surface>
      </section>

      <section aria-label="Account" className="space-y-4">
        <SectionHeader title="Account" />
        <Surface className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="text-[15px] font-medium text-ink">{user.email}</p>
            <p className="mt-1 text-[13px] text-ink-secondary">
              Member since {new Date(user.createdAt).toLocaleDateString("en-PH")}
            </p>
          </div>
          <Badge tone="accent">Local mock data</Badge>
        </Surface>
        <p className="text-[12px] leading-relaxed text-ink-tertiary">
          This companion runs on local state. No bank connections, no full card
          numbers, no secrets. Preferences sync with iOS when Supabase is wired.
        </p>
      </section>
    </div>
  );
}

function PageHeader({ saved }: { saved: boolean }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-ink">
          Settings
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-ink-secondary">
          Notifications, currency, and timezone.
        </p>
      </div>
      <span
        role="status"
        aria-live="polite"
        className={[
          "text-[13px] transition-opacity duration-200",
          saved ? "text-accent opacity-100" : "opacity-0",
        ].join(" ")}
      >
        Saved
      </span>
    </header>
  );
}
