"use client";

import { FormEvent, useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";

type GeneralSettings = {
  n8nWebhookUrl: string;
  n8nApiUrl: string;
  n8nApiKey: string;
  n8nWorkflowId: string;
  googleSheetsId: string;
  googleSheetsRange: string;
};

const STORAGE_KEY = "app-settings";

const EMPTY: GeneralSettings = {
  n8nWebhookUrl: "",
  n8nApiUrl: "",
  n8nApiKey: "",
  n8nWorkflowId: "",
  googleSheetsId: "",
  googleSheetsRange: "",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<GeneralSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSettings({ ...EMPTY, ...parsed });
      } catch {
        setSettings(EMPTY);
      }
    }
    setLoading(false);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    setSaving(false);
    setMessage({ type: "success", text: "Ayarlar kaydedildi." });
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Yükleniyor...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-medium text-slate-100">Ayarlar</h2>
        <p className="mt-1 text-sm text-slate-400">
          n8n ve Google Sheets bağlantı bilgilerini buradan yönetin.
        </p>
      </div>

      <Card className="max-w-xl space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300">n8n</h3>
            <Field
              label="Webhook URL"
              value={settings.n8nWebhookUrl}
              onChange={(v) => setSettings({ ...settings, n8nWebhookUrl: v })}
              placeholder="https://n8n.example.com/webhook/lead-search"
            />
            <Field
              label="API URL"
              value={settings.n8nApiUrl}
              onChange={(v) => setSettings({ ...settings, n8nApiUrl: v })}
              placeholder="https://n8n.example.com/api/v1"
            />
            <Field
              label="API Key"
              type="password"
              value={settings.n8nApiKey}
              onChange={(v) => setSettings({ ...settings, n8nApiKey: v })}
              placeholder="n8n API anahtarı"
            />
            <Field
              label="Workflow ID"
              value={settings.n8nWorkflowId}
              onChange={(v) => setSettings({ ...settings, n8nWorkflowId: v })}
              placeholder="Workflow Logları için filtre (opsiyonel)"
            />
          </section>

          <section className="space-y-4 border-t border-slate-800 pt-6">
            <h3 className="text-sm font-medium text-slate-300">Google Sheets</h3>
            <Field
              label="Sheet ID"
              value={settings.googleSheetsId}
              onChange={(v) => setSettings({ ...settings, googleSheetsId: v })}
              placeholder="Google Sheet'in ID'si"
            />
            <Field
              label="Aralık (Range)"
              value={settings.googleSheetsRange}
              onChange={(v) => setSettings({ ...settings, googleSheetsRange: v })}
              placeholder="Leads!A:F"
            />
          </section>

          {message && (
            <p
              className={`text-sm ${
                message.type === "success" ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {message.text}
            </p>
          )}

          <PrimaryButton type="submit" loading={saving}>
            Kaydet
          </PrimaryButton>
        </form>
      </Card>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-slate-400">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
      />
    </div>
  );
}
