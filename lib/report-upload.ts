import { buildDashboardSnapshot } from "@/lib/dashboard-data";
import { demoEmployees } from "@/lib/demo-snapshot";
import type { DashboardSnapshot, EmployeeCompletionRow } from "@/lib/types";

const SHARED_SNAPSHOT_KEY = "shared/latest-dashboard-snapshot.json";
const HISTORY_INDEX_KEY = "shared/history-index.json";

function normalize(value: string | null | undefined) {
  return (value ?? "").trim().toLowerCase();
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"') {
      if (inQuotes && next === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (character === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }

    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && next === "\n") {
        index += 1;
      }

      row.push(field);
      field = "";

      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }

      row = [];
      continue;
    }

    field += character;
  }

  row.push(field);
  if (row.some((cell) => cell.length > 0)) {
    rows.push(row);
  }

  return rows;
}

export function mergeCompletionReport(csvText: string, filename: string): DashboardSnapshot {
  const rows = parseCsv(csvText);
  const [headers, ...dataRows] = rows;

  if (!headers?.length) {
    throw new Error("The uploaded file is empty.");
  }

  const headerIndex = new Map(headers.map((header, index) => [header.trim(), index]));
  for (const requiredHeader of ["Name", "Email", "Completion score"]) {
    if (!headerIndex.has(requiredHeader)) {
      throw new Error(`The file must include the "${requiredHeader}" column.`);
    }
  }

  const byEmail = new Map(demoEmployees.map((employee) => [normalize(employee.employee_email), employee]));
  const byName = new Map(demoEmployees.map((employee) => [normalize(employee.employee_name), employee]));
  const merged: EmployeeCompletionRow[] = demoEmployees.map((employee) => ({
    ...employee,
    groups: [...employee.groups]
  }));

  for (const dataRow of dataRows) {
    const email = normalize(dataRow[headerIndex.get("Email") ?? -1]);
    const name = dataRow[headerIndex.get("Name") ?? -1]?.trim() ?? "";
    const completionRaw = dataRow[headerIndex.get("Completion score") ?? -1]?.trim() ?? "";
    const match =
      (email && byEmail.get(email)) ||
      (name && byName.get(normalize(name))) ||
      null;

    if (!match) {
      continue;
    }

    const mergedIndex = merged.findIndex((employee) => employee.employee_email === match.employee_email);
    if (mergedIndex === -1) {
      continue;
    }

    const numericCompletion = Number.parseFloat(completionRaw.replace("%", ""));
    const groupsRaw = dataRow[headerIndex.get("Groups") ?? -1] ?? "";
    const reportManager = dataRow[headerIndex.get("Reports to") ?? -1]?.trim() ?? "";
    const lastActive = dataRow[headerIndex.get("Last active") ?? -1]?.trim() ?? "";
    const jobTitle = dataRow[headerIndex.get("Job title") ?? -1]?.trim() ?? "";

    merged[mergedIndex] = {
      ...merged[mergedIndex],
      employee_name: name || merged[mergedIndex].employee_name,
      employee_email: email || merged[mergedIndex].employee_email,
      job_title: jobTitle || merged[mergedIndex].job_title,
      completion_score: Number.isNaN(numericCompletion)
        ? merged[mergedIndex].completion_score
        : numericCompletion,
      trainual_manager_name: reportManager || merged[mergedIndex].trainual_manager_name,
      manager_name:
        merged[mergedIndex].roster_manager_name ||
        reportManager ||
        merged[mergedIndex].manager_name,
      last_active: lastActive || merged[mergedIndex].last_active,
      groups: groupsRaw
        ? groupsRaw.split(",").map((item) => item.trim()).filter(Boolean)
        : merged[mergedIndex].groups
    };
  }

  const uploadedAt = new Date();
  const snapshot = buildDashboardSnapshot(merged, uploadedAt.toLocaleString());

  return {
    ...snapshot,
    asOf: uploadedAt.toLocaleString(),
    uploaded_at: uploadedAt.toISOString(),
    source_filename: filename
  };
}

export function getSharedSnapshotKey() {
  return SHARED_SNAPSHOT_KEY;
}

export function getHistoryIndexKey() {
  return HISTORY_INDEX_KEY;
}
