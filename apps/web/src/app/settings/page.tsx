"use client";

import * as React from "react";
import { useStore, displayNameForUser } from "@/lib/store";
import { currencies, timezones } from "@/lib/mock-data";
import { SwitchRow } from "@/components/ui/switch";
import { Field, Input, Select } from "@/components/ui/form";
import { SectionHeader, Surface } from "@/components/ui/surface";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  applyThemePreference,
  readThemePreference,
  type ThemePreference,
} from "@/lib/theme";

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
    isDemoMode,
  } = useStore();
  const [mounted, setMounted] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [draftName, setDraftName] = React.useState("");
  const [nameSaved, setNameSaved] = React.useState(false);
  const [theme, setTheme] = React.useState<ThemePreference>("auto");

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (mounted) setTheme(readThemePreference());
  }, [mounted]);

  React.useEffect(() => {
    setDraftName(displayNameForUser(user));
  }, [user]);

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

      <section aria-label="Appearance" className="space-y-4">
        <SectionHeader
          title="Appearance"
          subtitle="Choose light, dark, or follow your device."
        />
        <Surface className="p-4 sm:p-6">
          <div
            role="radiogroup"
            aria-label="Theme"
            className="grid grid-cols-3 gap-2 sm:gap-3"
          >
            {(
              [
                {
                  value: "light" as const,
                  label: "Light",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
                      <path
                        d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.2 5.2l1.6 1.6M17.2 17.2l1.6 1.6M18.8 5.2l-1.6 1.6M6.8 17.2l-1.6 1.6"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                      />
                    </svg>
                  ),
                },
                {
                  value: "dark" as const,
                  label: "Dark",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path
                        d="M20 14.5A8.5 8.5 0 0 1 9.5 4 7.5 7.5 0 1 0 20 14.5Z"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ),
                },
                {
                  value: "auto" as const,
                  label: "Auto",
                  icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.6" />
                      <path d="M3 15h18" stroke="currentColor" strokeWidth="1.6" />
                      <circle cx="8" cy="10" r="1.2" fill="currentColor" />
                    </svg>
                  ),
                },
              ]
            ).map((opt) => {
              const selected = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setTheme(opt.value);
                    applyThemePreference(opt.value);
                  }}
                  className={[
                    "flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border-2 px-2 py-3 text-[12px] font-medium transition-colors",
                    selected
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-divider bg-surface text-ink-secondary hover:border-ink-tertiary",
                  ].join(" ")}
                >
                  <span aria-hidden="true">{opt.icon}</span>
                  {opt.label}
                </button>
              );
            })}
          </div>
        </Surface>
      </section>

      <section aria-label="Account" className="space-y-4">
        <SectionHeader title="Account" />
        <Surface className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-ink">{displayNameForUser(user)}</p>
              <p className="mt-0.5 text-[13px] text-ink-secondary">{user.email}</p>
              <p className="mt-1 text-[13px] text-ink-secondary">
                Member since {new Date(user.createdAt).toLocaleDateString("en-PH")}
              </p>
            </div>
            <Badge tone="accent">
              {isDemoMode ? "Demo data" : "Firebase"}
            </Badge>
          </div>

          <form
            className="mt-5 flex flex-wrap items-end gap-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (draftName.trim()) {
                updateUser({
                  displayName: draftName.trim(),
                  preferences: {
                    ...user.preferences,
                    displayName: draftName.trim(),
                  },
                });
                setNameSaved(true);
              }
            }}
          >
            <div className="min-w-[200px] flex-1">
              <Field label="Display name" htmlFor="display-name">
                <Input
                  id="display-name"
                  value={draftName}
                  onChange={(e) => {
                    setDraftName(e.target.value);
                    setNameSaved(false);
                  }}
                  placeholder="e.g. Arjay"
                  autoComplete="nickname"
                />
              </Field>
            </div>
            <Button type="submit" disabled={!draftName.trim()}>
              Save name
            </Button>
            {nameSaved ? (
              <span className="text-[13px] text-status-complete">Saved</span>
            ) : null}
          </form>
        </Surface>
        <p className="text-[12px] leading-relaxed text-ink-tertiary">
          No bank connections, no full card numbers, no secrets. Cards and
          transactions sync to your Firebase account when you are signed in.
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
