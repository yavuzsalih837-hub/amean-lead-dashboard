import { Card } from "@/components/Card";
import { DataTable, type Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { fetchWorkflowLogs, type WorkflowLog } from "@/lib/n8n";

function formatDuration(ms: number | null) {
  if (ms === null) return "—";
  const seconds = Math.round(ms / 1000);
  if (seconds < 60) return `${seconds} sn`;
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${minutes} dk ${rem} sn`;
}

export default async function LogsPage() {
  let logs: WorkflowLog[] = [];
  let error: string | null = null;

  try {
    logs = await fetchWorkflowLogs();
  } catch (e) {
    error = e instanceof Error ? e.message : "Loglar okunamadı.";
  }

  const columns: Column<WorkflowLog>[] = [
    { key: "id", header: "Execution ID" },
    {
      key: "status",
      header: "Durum",
      render: (row) => <StatusBadge status={row.status} />,
    },
    { key: "mode", header: "Tetikleyici" },
    {
      key: "startedAt",
      header: "Başlangıç",
      render: (row) =>
        row.startedAt ? new Date(row.startedAt).toLocaleString("tr-TR") : "—",
    },
    {
      key: "durationMs",
      header: "Süre",
      render: (row) => formatDuration(row.durationMs),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-medium text-slate-100">Workflow Logları</h2>
        <p className="mt-1 text-sm text-slate-400">n8n workflow çalıştırma geçmişi.</p>
      </div>

      {error ? (
        <Card>
          <p className="text-sm text-rose-400">{error}</p>
          <p className="mt-1 text-sm text-slate-500">
            Ayarlar sayfasından n8n API bağlantısını kontrol edin.
          </p>
        </Card>
      ) : (
        <DataTable
          columns={columns}
          rows={logs}
          getRowKey={(row) => row.id}
          emptyMessage="Henüz workflow çalıştırması bulunmuyor."
        />
      )}
    </div>
  );
}
