"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";

type SearchSettings = {
  keyword: string;
  location: string;
  industry: string;
  resultLimit: number;
};

const EMPTY: SearchSettings = { keyword: "", location: "", industry: "", resultLimit: 50 };

export default function SearchSettingsPage() {
  const [settings, setSettings] = useState<SearchSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    fetch("/api/search-settings")
      .then((res) => res.json())
      .then((data) => setSettings(data))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch("/api/search-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });

    setSaving(false);
    setMessage(
      res.ok
        ? { type: "success", text: "Arama ayarları kaydedildi." }
        : { type: "error", text: "Kaydedilemedi, lütfen tekrar deneyin." }
    );
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Yükleniyor...</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-medium text-slate-100">Arama Ayarları</h2>
        <p className="mt-1 text-sm text-slate-400">
          Dashboard&apos;daki &quot;Yeni Arama Başlat&quot; butonu bu kriterlerle n8n
          workflow&apos;unu tetikler.
        </p>
      </div>

      <Card className="max-w-xl">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field
            label="Anahtar Kelime"
            value={settings.keyword}
            onChange={(v) => setSettings({ ...settings, keyword: v })}
            placeholder="örn. dijital pazarlama ajansı"
          />
          <Field
            label="Konum"
            value={settings.location}
            onChange={(v) => setSettings({ ...settings, location: v })}
            placeholder="örn. İstanbul"
          />
          <Field
            label="Sektör"
            value={settings.industry}
            onChange={(v) => setSettings({ ...settings, industry: v })}
            placeholder="örn. e-ticaret"
          />

          <div>
            <label className="mb-1.5 block text-sm text-slate-400">Sonuç Limiti</label>
            <input
              type="number"
              min={1}
              max={500}
              value={settings.resultLimit}
              onChange={(e) =>
                setSettings({ ...settings, resultLimit: Number(e.target.value) })
              }
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
            />
          </div>

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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm text-slate-400">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
      />
    </div>
  );
}
