"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { PrimaryButton } from "@/components/PrimaryButton";

const STORAGE_KEY = "search-settings";

type StoredSearchSettings = {
  keyword?: string;
  keywords?: string[];
  location?: string;
  industry?: string;
  resultLimit?: number;
  start?: number;
};

export function StartSearchButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  function getStoredSettings(): StoredSearchSettings {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      return JSON.parse(raw) as StoredSearchSettings;
    } catch {
      return {};
    }
  }

  function saveStoredStart(start: number) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...parsed, start }));
    } catch {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ start }));
    }
  }

  async function handleClick() {
    setLoading(true);
    setMessage(null);

    const settings = getStoredSettings();
    const nextStart = typeof settings.start === "number" && settings.start >= 1 ? settings.start : 1;
    const payload: StoredSearchSettings = {
      ...settings,
      start: nextStart,
      keywords: settings.keywords ?? [],
      keyword: settings.keyword ?? "",
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
