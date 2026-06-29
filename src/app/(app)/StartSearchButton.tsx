"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { PrimaryButton } from "@/components/PrimaryButton";

const SEARCH_SETTINGS_KEY = "search-settings";
const APP_SETTINGS_KEY = "app-settings";

type StoredSearchSettings = {
  keyword?: string;
  keywords?: string[];
  location?: string;
  industry?: string;
  resultLimit?: number;
  start?: number;
};

type StoredAppSettings = {
  n8nWebhookUrl?: string;
  n8nApiUrl?: string;
  n8nApiKey?: string;
  n8nWorkflowId?: string;
  googleSheetsId?: string;
  googleSheetsRange?: string;
};

export function StartSearchButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  function getStoredSettings<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  function saveStoredStart(start: number) {
    try {
      const settings = getStoredSettings<StoredSearchSettings>(SEARCH_SETTINGS_KEY) || {};
      window.localStorage.setItem(
        SEARCH_SETTINGS_KEY,
        JSON.stringify({ ...settings, start })
      );
    } catch {
      window.localStorage.setItem(SEARCH_SETTINGS_KEY, JSON.stringify({ start }));
    }
  }

  async function handleClick() {
    setLoading(true);
    setMessage(null);

    const searchSettings = getStoredSettings<StoredSearchSettings>(SEARCH_SETTINGS_KEY) || {};
    const appSettings = getStoredSettings<StoredAppSettings>(APP_SETTINGS_KEY) || {};

    const webhookUrl = appSettings.n8nWebhookUrl?.trim();
    if (!webhookUrl) {
      setLoading(false);
      setMessage({ type: "error", text: "n8n webhook URL ayarlanmamış." });
      return;
    }

    const nextStart = typeof searchSettings.start === "number" && searchSettings.start >= 1 ? searchSettings.start : 1;
    const keywords = Array.isArray(searchSettings.keywords)
      ? searchSettings.keywords
      : [];
    const payload = {
      webhookUrl,
      keyword: typeof searchSettings.keyword === "string" ? searchSettings.keyword : "",
      keywords: keywords.length > 0 ? keywords : searchSettings.keyword ? [searchSettings.keyword] : [],
      location: searchSettings.location,
      industry: searchSettings.industry,
      resultLimit: searchSettings.resultLimit,
      start: nextStart,
    };

    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage({ type: "error", text: data.error ?? "Arama başlatılamadı." });
      return;
    }

    saveStoredStart(nextStart + 20);
    setMessage({
      type: "success",
      text: "Arama başlatıldı. Sonuçlar Lead Listesi'ne düşecek.",
    });
    router.refresh();
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <PrimaryButton onClick={handleClick} loading={loading}>
        <Search className="h-4 w-4" />
        Yeni Arama Başlat
      </PrimaryButton>
      {message && (
        <p
          className={`text-sm ${
            message.type === "success" ? "text-emerald-400" : "text-rose-400"
          }`}
        >
          {message.text}
        </p>
      )}
    </div>
  );
}
