export type TriggerSearchPayload = {
  keyword?: string;
  keywords?: string[];
  location?: string;
  industry?: string;
  resultLimit?: number;
  start?: number;
};

export async function triggerSearch(webhookUrl: string, payload: TriggerSearchPayload): Promise<void> {
  if (!webhookUrl) {
    throw new Error("n8n webhook URL ayarlanmamış.");
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`n8n webhook hata döndürdü: ${res.status}`);
  }
}

export type WorkflowLog = {
  id: string;
  status: string;
  mode: string;
  startedAt: string | null;
  stoppedAt: string | null;
  durationMs: number | null;
};

type RawExecution = {
  id: number | string;
  status?: string;
  finished?: boolean;
  mode?: string;
  startedAt?: string;
  stoppedAt?: string;
};

export async function fetchWorkflowLogs(limit = 20): Promise<WorkflowLog[]> {
  const settings = await getSettings();
  if (!settings.n8nApiUrl || !settings.n8nApiKey) {
    return [];
  }

  const url = new URL(`${settings.n8nApiUrl.replace(/\/$/, "")}/executions`);
  url.searchParams.set("limit", String(limit));
  if (settings.n8nWorkflowId) {
    url.searchParams.set("workflowId", settings.n8nWorkflowId);
  }

  const res = await fetch(url.toString(), {
    headers: { "X-N8N-API-KEY": settings.n8nApiKey },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`n8n executions API hata döndürdü: ${res.status}`);
  }

  const json: { data?: RawExecution[] } = await res.json();
  const data = json.data || [];

  return data.map((exec) => {
    const startedAt = exec.startedAt ?? null;
    const stoppedAt = exec.stoppedAt ?? null;
    const durationMs =
      startedAt && stoppedAt
        ? new Date(stoppedAt).getTime() - new Date(startedAt).getTime()
        : null;

    return {
      id: String(exec.id),
      status: exec.status ?? (exec.finished ? "success" : "running"),
      mode: exec.mode ?? "webhook",
      startedAt,
      stoppedAt,
      durationMs,
    };
  });
}
