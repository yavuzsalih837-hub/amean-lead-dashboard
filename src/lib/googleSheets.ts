import { getSettings } from "./settings";

export type Lead = {
  firma_adi: string;
  website: string;
  telefon: string;
  mail: string;
  instagram: string;
  sehir: string;
  kategori: string;
  lead_skoru: string;
  durum: string;
  eklenme_tarihi: string;
  son_islem: string;
};

export type LeadsResult = {
  rows: Lead[];
};

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

const EMPTY_LEAD: Lead = {
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
};

// Geçici çözüm: service account/Sheets API yerine sheet'in herkese açık
// CSV export'unu okuyoruz. Sheet "Bağlantıya sahip olan herkes - Görüntüleyen"
// olarak paylaşılmış olmalı.
function buildCsvUrl(sheetId: string, sheetName: string) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(
    sheetName
  )}`;
}

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
      // \r\n satır sonlarında \n tarafından ele alınır
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

export async function fetchLeads(): Promise<LeadsResult> {
  const settings = await getSettings();

  if (!settings.googleSheetsId) {
    console.error("[googleSheets] googleSheetsId ayarlanmamış (Ayarlar sayfası).");
    return { rows: [] };
  }

  const sheetName = settings.googleSheetsRange || "Sayfa1";
  const url = buildCsvUrl(settings.googleSheetsId, sheetName);

  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    console.error(`[googleSheets] CSV export HTTP ${res.status} döndü (url=${url}).`);
    throw new Error(
      `Google Sheets CSV export alınamadı (HTTP ${res.status}). Sheet ID veya sekme adını kontrol edin.`
    );
  }

  const text = await res.text();

  if (text.trim().toLowerCase().startsWith("<")) {
    console.error(
      "[googleSheets] CSV export yerine HTML sayfası döndü — sheet public değil ya da ID/sekme adı yanlış."
    );
    throw new Error(
      "Sheet'e public olarak erişilemedi. Google Sheet'i açıp 'Paylaş' > 'Bağlantıya sahip olan herkes' > 'Görüntüleyen' olarak ayarlayın."
    );
  }

  const table = parseCsv(text).filter(
    (r) => r.length > 0 && r.some((cell) => cell.trim() !== "")
  );

  if (table.length === 0) {
    console.error(
      `[googleSheets] Sheet boş veya veri bulunamadı (spreadsheetId=${settings.googleSheetsId}, sheet=${sheetName}).`
    );
    return { rows: [] };
  }

  const [headerRow, ...dataRows] = table;
  const headers = headerRow.map((h) => h.trim());

  const missingHeaders = Object.keys(HEADER_MAP).filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) {
    console.error(
      `[googleSheets] Sheet'te beklenen kolon başlıkları bulunamadı: ${missingHeaders.join(", ")}. Mevcut başlıklar: ${headers.join(", ")}`
    );
  }

  const rows: Lead[] = dataRows
    .filter((row) => row.some((cell) => cell.trim() !== ""))
    .map((row) => {
      const lead: Lead = { ...EMPTY_LEAD };
      headers.forEach((header, idx) => {
        const key = HEADER_MAP[header];
        if (key) {
          lead[key] = row[idx] !== undefined ? row[idx] : "";
        }
      });
      return lead;
    });

  if (rows.length === 0) {
    console.error("[googleSheets] Başlık satırı dışında veri satırı bulunamadı.");
  }

  return { rows };
}
