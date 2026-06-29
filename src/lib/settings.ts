import { promises as fs } from "fs";
import path from "path";

export type SearchSettings = {
  keyword: string;
  location: string;
  industry: string;
  resultLimit: number;
};

export type AppSettings = {
  n8nWebhookUrl: string;
  n8nApiUrl: string;
  n8nApiKey: string;
  n8nWorkflowId: string;
  googleSheetsId: string;
  googleSheetsRange: string;
  search: SearchSettings;
};

const DEFAULT_SETTINGS: AppSettings = {
  n8nWebhookUrl: "",
  n8nApiUrl: "",
  n8nApiKey: "",
  n8nWorkflowId: "",
  googleSheetsId: "",
  googleSheetsRange: "Sayfa1",
  search: {
    keyword: "",
    location: "",
    industry: "",
    resultLimit: 50,
  },
};

const SETTINGS_PATH = path.join(process.cwd(), "data", "settings.json");

async function readFile(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      search: { ...DEFAULT_SETTINGS.search, ...parsed.search },
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

async function writeFile(settings: AppSettings): Promise<void> {
  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true });
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(settings, null, 2), "utf-8");
}

export async function getSettings(): Promise<AppSettings> {
  // Ortam değişkenleri ilk kurulumda varsayılan değer sağlar, ancak
  // settings.json'daki kayıtlı değer (Ayarlar sayfasından düzenlenebilir) önceliklidir.
  const current = await readFile();
  return {
    n8nWebhookUrl: current.n8nWebhookUrl || process.env.N8N_WEBHOOK_URL || "",
    n8nApiUrl: current.n8nApiUrl || process.env.N8N_API_URL || "",
    n8nApiKey: current.n8nApiKey || process.env.N8N_API_KEY || "",
    n8nWorkflowId: current.n8nWorkflowId || process.env.N8N_WORKFLOW_ID || "",
    googleSheetsId: current.googleSheetsId || process.env.GOOGLE_SHEETS_ID || "",
    googleSheetsRange:
      current.googleSheetsRange || process.env.GOOGLE_SHEETS_RANGE || DEFAULT_SETTINGS.googleSheetsRange,
    search: current.search,
  };
}

export async function updateSettings(
  partial: Partial<Omit<AppSettings, "search">>
): Promise<AppSettings> {
  const current = await readFile();
  const next: AppSettings = { ...current, ...partial };
  await writeFile(next);
  return next;
}

export async function updateSearchSettings(
  partial: Partial<SearchSettings>
): Promise<AppSettings> {
  const current = await readFile();
  const next: AppSettings = { ...current, search: { ...current.search, ...partial } };
  await writeFile(next);
  return next;
}
