"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/Card";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import type { Lead } from "@/lib/googleSheets";

function normalizeWebsiteUrl(value: string) {
  if (!value) return null;
  return value.startsWith("http://") || value.startsWith("https://")
    ? value
    : `https://${value}`;
}

function normalizeInstagramUrl(value: string) {
  if (!value) return null;
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return `https://instagram.com/${value.replace(/^@/, "")}`;
}

const columns: Column<Lead>[] = [
  { key: "firma_adi", header: "Firma Adı" },
  {
    key: "website",
    header: "Website",
    render: (row) => {
      const url = normalizeWebsiteUrl(row.website);
      return url ? (
        <a href={url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
          {row.website}
        </a>
      ) : (
        "—"
      );
    },
  },
  { key: "telefon", header: "Telefon" },
  {
    key: "mail",
    header: "Mail",
    render: (row) =>
      row.mail ? (
        <a href={`mailto:${row.mail}`} className="text-indigo-400 hover:underline">
          {row.mail}
        </a>
      ) : (
        "—"
      ),
  },
  {
    key: "instagram",
    header: "Instagram",
    render: (row) => {
      const url = normalizeInstagramUrl(row.instagram);
      return url ? (
        <a href={url} target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">
          {row.instagram}
        </a>
      ) : (
        "—"
      );
    },
  },
  { key: "sehir", header: "Şehir" },
  { key: "kategori", header: "Kategori" },
  { key: "lead_skoru", header: "Lead Skoru" },
  {
    key: "durum",
    header: "Durum",
    render: (row) => (row.durum ? <StatusBadge status={row.durum} /> : "—"),
  },
  { key: "eklenme_tarihi", header: "Eklenme Tarihi" },
  { key: "son_islem", header: "Son İşlem" },
];

const HEADER_MAP: Record<string, keyof Lead> = {
  "Firma Adı": "firma_adi",
  Website: "website",
  Telefon: "telefon",
  Mail: "mail",
  Instagram: "instagram",
  Şehir: "sehir",
  Kategori: "kategori",
  "Lead Skoru": "lead_skoru",
  Durum: "durum",
  "Eklenme Tarihi": "eklenme_tarihi",
  "Son İşlem": "son_islem",
};

const DEFAULT_RANGE = "Sayfa1!A:K";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char === "\r") {
      // ignore
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function buildFetchUrl(sheetId: string, range: string) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&range=${encodeURIComponent(
    range
  )}`;
}

export default function LeadsPage() {
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sheetId, setSheetId] = useState<string | null>(null);
  const [range, setRange] = useState<string>(DEFAULT_RANGE);

  const sheetUrl = useMemo(() => {
    return sheetId
      ? `https://docs.google.com/spreadsheets/d/${sheetId}/edit#gid=0`
      : "";
  }, [sheetId]);

  useEffect(() => {
    const stored = window.localStorage.getItem("app-settings");
    if (!stored) {
      setError("Google Sheets ayarları bulunamadı. Ayarlar sayfasından Sheet ID girin.");
      setLoading(false);
      return;
    }

    let settings: { googleSheetsId?: string; googleSheetsRange?: string };
    try {
      settings = JSON.parse(stored);
    } catch {
      setError("Google Sheets ayarları okunamadı. Ayarlar sayfasından kaydedin.");
      setLoading(false);
      return;
    }

    const sheet = settings.googleSheetsId?.trim();
    const rangeValue = settings.googleSheetsRange?.trim() || DEFAULT_RANGE;
    setSheetId(sheet || null);
    setRange(rangeValue);

    if (!sheet) {
      setError("Sheet ID boş. Ayarlar sayfasında Sheet ID girin.");
      setLoading(false);
      return;
    }

    const url = buildFetchUrl(sheet, rangeValue);

    fetch(url, { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const text = await res.text();
        if (text.trim().startsWith("<")) {
          throw new Error("Sheet public değil veya ID/aralık yanlış.");
        }
        return text;
      })
      .then((text) => {
        const table = parseCsv(text).filter((r) => r.length > 0 && r.some((cell) => cell.trim() !== ""));
        if (table.length < 2) {
          setRows([]);
          setError("Sheet'te veri bulunamadı. Sheet ve aralığı kontrol edin.");
          return;
        }

        const [headerRow, ...dataRows] = table;
        const headers = headerRow.map((h) => h.trim());

        const parsedRows = dataRows
          .filter((row) => row.some((cell) => cell.trim() !== ""))
          .map((row) => {
            const item: Partial<Lead> = {};
            headers.forEach((header, idx) => {
              const key = HEADER_MAP[header];
              if (key) {
                item[key] = row[idx] ?? "";
              }
            });
            return {
              firma_adi: "",
              website: "",
              telefon: "",
              mail: "",
              instagram: "",
              sehir: "",
              kategori: "",
              lead_skoru: "",
              durum: "",
              eklenme_tarihi: "",
              son_islem: "",
              ...item,
            };
          });

        if (parsedRows.length === 0) {
          setError("Sheet'te veri bulunamadı. Sheet aralığını kontrol edin.");
        } else {
          setRows(parsedRows);
          setError(null);
        }
      })
      .catch((fetchError) => {
        setRows([]);
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Google Sheets verisi alınamadı."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-medium text-slate-100">Lead Listesi</h2>
        <p className="mt-1 text-sm text-slate-400">
          Google Sheets'ten çekilen lead sonuçları. Sheet ayarları Ayarlar sayfasında saklanır.
        </p>
      </div>

      {sheetId ? (
        <div className="flex flex-wrap gap-3">
          <p className="text-sm text-slate-400">Sheet ID: {sheetId}</p>
          <p className="text-sm text-slate-400">Aralık: {range}</p>
          <button
            type="button"
            onClick={() => window.open(sheetUrl, "_blank")}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Google Sheets'i Aç
          </button>
        </div>
      ) : null}

      {loading ? (
        <Card>
          <p className="text-sm text-slate-400">Google Sheets verisi okunuyor...</p>
        </Card>
      ) : rows.length > 0 ? (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(_, idx) => String(idx)}
          emptyMessage="Henüz lead bulunmuyor."
        />
      ) : (
        <Card>
          <p className="text-sm text-rose-400">{error || "Lead verisi bulunamadı."}</p>
          {sheetId ? (
            <div className="mt-4">
              <iframe
                src={sheetUrl}
                title="Google Sheets önizlemesi"
                className="h-[420px] w-full rounded-xl border border-slate-800 bg-white"
              />
            </div>
          ) : (
            <p className="mt-1 text-sm text-slate-500">
              Ayarlar sayfasından Google Sheets Sheet ID ve Range bilgilerini girin.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
