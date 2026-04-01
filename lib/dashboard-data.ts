import { demoEmployees } from "@/lib/demo-snapshot";
import type {
  DashboardSnapshot,
  EmployeeCompletionRow,
  ManagerSummary
} from "@/lib/types";

function round(value: number) {
  return Math.round(value * 10) / 10;
}

function buildManagers(employees: EmployeeCompletionRow[]): ManagerSummary[] {
  const teams = new Map<string, EmployeeCompletionRow[]>();

  for (const employee of employees) {
    if (!employee.manager_name) {
      continue;
    }

    const current = teams.get(employee.manager_name) ?? [];
    current.push(employee);
    teams.set(employee.manager_name, current);
  }

  return Array.from(teams.entries())
    .map(([name, team]) => {
      const directReports = team.length;
      const averageCompletion =
        team.reduce((sum, member) => sum + member.completion_score, 0) / directReports;

      return {
        name,
        email: team.find((member) => member.manager_email)?.manager_email ?? null,
        directReports,
        averageCompletion: round(averageCompletion),
        atRiskCount: team.filter((member) => member.completion_score < 70).length,
        completedCount: team.filter((member) => member.completion_score >= 100).length,
        team: [...team].sort((a, b) => a.completion_score - b.completion_score)
      };
    })
    .sort((a, b) => b.averageCompletion - a.averageCompletion);
}

export function buildDashboardSnapshot(
  employees: EmployeeCompletionRow[],
  asOf: string
): DashboardSnapshot {
  const sortedEmployees = [...employees].sort((a, b) => a.completion_score - b.completion_score);
  const managers = buildManagers(sortedEmployees);

  const totalEmployees = sortedEmployees.length;
  const averageCompletion =
    totalEmployees === 0
      ? 0
      : round(
          sortedEmployees.reduce((sum, employee) => sum + employee.completion_score, 0) /
            totalEmployees
        );

  return {
    asOf,
    employees: sortedEmployees,
    managers,
    totals: {
      totalEmployees,
      activeManagers: managers.length,
      averageCompletion,
      completedCount: sortedEmployees.filter((employee) => employee.completion_score >= 100).length,
      atRiskCount: sortedEmployees.filter((employee) => employee.completion_score < 70).length
    }
  };
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  return buildDashboardSnapshot(demoEmployees, "2026-04-01");
}

export function getManagerHeat(manager: ManagerSummary) {
  if (manager.averageCompletion >= 90) {
    return "excellent";
  }

  if (manager.averageCompletion >= 75) {
    return "watch";
  }

  return "urgent";
}

export function getCompletionBand(score: number) {
  if (score >= 100) {
    return "Complete";
  }

  if (score >= 70) {
    return "Nearly Complete";
  }

  return "Needs Attention";
}

export function getScoreTone(score: number) {
  const band = getCompletionBand(score);

  if (band === "Complete") {
    return "complete";
  }

  if (band === "Nearly Complete") {
    return "watch";
  }

  return "risk";
}
