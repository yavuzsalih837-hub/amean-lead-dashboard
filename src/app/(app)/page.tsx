import { Users, Activity, Clock } from "lucide-react";
import { Card } from "@/components/Card";
import { StatCard } from "@/components/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { fetchLeads } from "@/lib/googleSheets";
import { fetchWorkflowLogs } from "@/lib/n8n";
import { StartSearchButton } from "./StartSearchButton";

function isToday(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export default async function DashboardPage() {
  const [leadsResult, logs] = await Promise.all([
    fetchLeads().catch(() => ({ rows: [] })),
    fetchWorkflowLogs().catch(() => []),
  ]);

  const totalLeads = leadsResult.rows.length;
  const todayRuns = logs.filter((log) => log.startedAt && isToday(log.startedAt)).length;
  const lastLog = logs[0];

  return (
    <div className="space-y-8">
      <Card className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-base font-medium text-slate-100">
            Yeni bir lead araması başlat
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Arama Ayarları sayfasında kayıtlı kriterlerle n8n workflow&apos;u tetiklenir.
          </p>
        </div>
        <StartSearchButton />
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Toplam Lead"
          value={totalLeads}
          hint="Google Sheets üzerindeki kayıt sayısı"
          icon={<Users className="h-5 w-5" />}
        />
        <StatCard
          label="Bugünkü Çalışmalar"
          value={todayRuns}
          hint="Bugün tetiklenen workflow sayısı"
          icon={<Activity className="h-5 w-5" />}
        />
        <StatCard
          label="Son Çalışma Durumu"
          value={lastLog ? <StatusBadge status={lastLog.status} /> : "Veri yok"}
          hint={lastLog?.startedAt ? new Date(lastLog.startedAt).toLocaleString("tr-TR") : undefined}
          icon={<Clock className="h-5 w-5" />}
        />
      </div>
    </div>
  );
}
