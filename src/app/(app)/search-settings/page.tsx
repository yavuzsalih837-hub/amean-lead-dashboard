"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/Card";
import { PrimaryButton } from "@/components/PrimaryButton";

type SearchSettings = {
  keyword: string;
  keywords: string[];
  location: string;
  industry: string;
  resultLimit: number;
  start: number;
};

const STORAGE_KEY = "search-settings";
const EMPTY: SearchSettings = {
  keyword: "",
  keywords: [],
  location: "",
  industry: "",
  resultLimit: 50,
  start: 1,
};

export default function SearchSettingsPage() {
  const [settings, setSettings] = useState<SearchSettings>(EMPTY);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const parsedStored = stored ? JSON.parse(stored) : null;

    fetch("/api/search-settings")
      .then((res) => res.json())
      .then((data) => setSettings({ ...EMPTY, ...data, ...parsedStored }))
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

    if (res.ok) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }

    setSaving(false);
    setMessage(
      res.ok
        ? { type: "success", text: "Arama ayarları kaydedildi." }
        : { type: "error", text: "Kaydedilemedi, lütfen tekrar deneyin." }
    );
  }

  function handleResetStart() {
    const next = { ...settings, start: 1 };
    setSettings(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setMessage({ type: "success", text: "Başlangıç değeri 1 olarak ayarlandı." });
  }

  function handleAddKeyword() {
    const trimmed = newKeyword.trim();
    if (!trimmed) return;
    if (settings.keywords.includes(trimmed)) {
      setMessage({ type: "error", text: "Bu anahtar kelime zaten ekli." });
      return;
    }
    const next = { ...settings, keywords: [...settings.keywords, trimmed] };
    setSettings(next);
    setNewKeyword("");
    setMessage({ type: "success", text: "Anahtar kelime eklendi." });
  }

  function handleRemoveKeyword(index: number) {
    const next = {
      ...settings,
      keywords: settings.keywords.filter((_, i) => i !== index),
    };
    setSettings(next);
    setMessage({ type: "success", text: "Anahtar kelime silindi." });
  }

  function handleKeywordInputKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddKeyword();
    }
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

          <div className="space-y-3 rounded-lg border border-slate-800 bg-slate-950 p-4">
            <label className="block text-sm font-medium text-slate-100">Anahtar Kelimeler</label>
            <p className="text-xs text-slate-400">Birden fazla anahtar kelime ekleyerek sırayla taratabilirsiniz.</p>

            {settings.keywords.length > 0 && (
              <div className="space-y-2">
                {settings.keywords.map((kw, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded bg-slate-900 px-3 py-2"
                  >
                    <span className="text-sm text-slate-100">{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(idx)}
                      className="rounded bg-rose-900 px-2 py-1 text-xs font-medium text-rose-100 transition hover:bg-rose-800"
                    >
                      Sil
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={handleKeywordInputKeyDown}
                placeholder="Yeni anahtar kelime..."
                className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddKeyword}
                className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
              >
                Ekle
              </button>
            </div>
          </div>

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

          <div>
            <label className="mb-1.5 block text-sm text-slate-400">
              Başlangıç (Start)
            </label>
            <input
              type="number"
              min={1}
              step={20}
              value={settings.start}
              onChange={(e) => setSettings({ ...settings, start: Number(e.target.value) })}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              1, 21, 41, 61 gibi değerler girilebilir.
            </p>
          </div>

          <div className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950 p-4">
            <p className="text-sm text-slate-200">
              Sonraki arama başlangıcı: <span className="font-semibold">{settings.start}</span>
            </p>
            <button
              type="button"
              onClick={handleResetStart}
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800"
            >
              Baştan Başlat
            </button>
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
