import { Card } from "@/components/Card";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { fetchLeads, type Lead, type LeadsResult } from "@/lib/googleSheets";

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

export default async function LeadsPage() {
  let leadsResult: LeadsResult;
  let error: string | null = null;

  try {
    leadsResult = await fetchLeads();
  } catch (e) {
    error = e instanceof Error ? e.message : "Lead'ler okunamadı.";
    leadsResult = { rows: [] };
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-medium text-slate-100">Lead Listesi</h2>
        <p className="mt-1 text-sm text-slate-400">
          n8n workflow&apos;unun ürettiği lead sonuçları (Google Sheets).
        </p>
      </div>

      {error ? (
        <Card>
          <p className="text-sm text-rose-400">{error}</p>
          <p className="mt-1 text-sm text-slate-500">
            Ayarlar sayfasından Google Sheets bağlantısını kontrol edin.
          </p>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          rows={leadsResult.rows}
          getRowKey={(_, idx) => String(idx)}
          emptyMessage="Henüz lead bulunmuyor. Dashboard'dan bir arama başlatın ya da Ayarlar'dan Google Sheets bağlantısını kontrol edin. (Sunucu loglarında detay olabilir.)"
        />
      )}
    </div>
  );
}
