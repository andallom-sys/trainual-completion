export type EmployeeCompletionRow = {
  snapshot_date: string;
  employee_id: string | null;
  employee_name: string;
  employee_email: string;
  job_title: string | null;
  completion_score: number;
  trainual_manager_name: string | null;
  roster_manager_name: string | null;
  manager_name: string | null;
  manager_email: string | null;
  employee_status: string | null;
  last_active: string | null;
  groups: string[];
};

export type ManagerSummary = {
  name: string;
  email: string | null;
  directReports: number;
  averageCompletion: number;
  atRiskCount: number;
  completedCount: number;
  team: EmployeeCompletionRow[];
};

export type DashboardSnapshot = {
  asOf: string;
  uploaded_at?: string | null;
  source_filename?: string | null;
  storage_key?: string | null;
  employees: EmployeeCompletionRow[];
  managers: ManagerSummary[];
  totals: {
    totalEmployees: number;
    activeManagers: number;
    averageCompletion: number;
    completedCount: number;
    atRiskCount: number;
  };
};
