"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { PrimaryButton } from "@/components/PrimaryButton";

const STORAGE_KEY = "search-settings";

export function StartSearchButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  function getStoredStart() {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return 1;
      const parsed = JSON.parse(raw);
      return typeof parsed?.start === "number" && parsed.start >= 1 ? parsed.start : 1;
    } catch {
      return 1;
    }
  }

  function saveStoredStart(start: number) {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...parsed, start })
      );
    } catch {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ start }));
    }
  }

  async function handleClick() {
    setLoading(true);
    setMessage(null);

    const currentStart = getStoredStart();
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start: currentStart }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setMessage({ type: "error", text: data.error ?? "Arama başlatılamadı." });
      return;
    }

    saveStoredStart(currentStart + 20);
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
