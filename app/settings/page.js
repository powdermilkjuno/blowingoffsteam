import AppHeader from "@/components/AppHeader";
import Card from "@/components/Card";
import Field from "@/components/Field";
import Button from "@/components/Button";
import Toggle from "@/components/Toggle";

function Section({ title, description, children, tone = "panel" }) {
  return (
    <Card className="p-6" tone={tone}>
      <h2 className="text-sm text-paper">{title}</h2>
      {description ? (
        <p className="mt-1 text-xs text-muted">{description}</p>
      ) : null}
      <div className="mt-5">{children}</div>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="min-h-screen">
      <AppHeader active="settings" />

      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm text-fern">Account</p>
          <h1 className="mt-1 text-2xl tracking-tight text-paper">Settings</h1>
        </div>

        <div className="space-y-6">
          <Section title="Profile">
            <div className="space-y-4">
              <Field id="settings-username" label="Username" defaultValue="alex_chen" />
              <Field
                id="settings-email"
                label="Email"
                type="email"
                defaultValue="alex.chen@example.com"
              />
              <Button variant="outline">Save changes</Button>
            </div>
          </Section>

          <Section title="Password">
            <div className="space-y-4">
              <Field id="current-password" label="Current password" type="password" />
              <Field id="new-password" label="New password" type="password" />
              <Field id="confirm-password" label="Confirm new password" type="password" />
              <Button variant="outline">Update password</Button>
            </div>
          </Section>

          <Section
            title="Connected accounts"
            description="uptime uses this connection to read playtime data."
          >
            <div className="flex items-center justify-between rounded border border-clay/25 bg-clay/10 px-4 py-3.5">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded border border-line bg-surface">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" stroke="rgb(var(--color-clay))" strokeWidth="1.6" />
                    <circle cx="12" cy="12" r="3" stroke="rgb(var(--color-clay))" strokeWidth="1.6" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm text-paper">Steam</p>
                  <p className="text-xs text-clay">Connected as alex_chen</p>
                </div>
              </div>
              <Button variant="outline">Disconnect</Button>
            </div>
          </Section>

          <Section title="Notifications">
            <div className="divide-y divide-line">
              <Toggle
                id="notif-summary"
                label="Weekly summary email"
                description="A recap of your playtime, sent every Monday."
                defaultChecked
              />
              <Toggle
                id="notif-rank"
                label="Rank change alerts"
                description="Get notified when your leaderboard position changes."
                defaultChecked
              />
              <Toggle
                id="notif-friends"
                label="Friend requests"
                description="Notify me when someone adds me on uptime."
              />
            </div>
          </Section>

          <Section
            title="Danger zone"
            description="Permanently delete your account and all tracked data."
            tone="danger"
          >
            <Button variant="danger">Delete account</Button>
          </Section>
        </div>
      </main>
    </div>
  );
}
