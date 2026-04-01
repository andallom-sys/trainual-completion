"use client";

import { useMemo, useState } from "react";
import { getCompletionBand, getScoreTone } from "@/lib/dashboard-data";
import type { EmployeeCompletionRow } from "@/lib/types";

type EmployeeTableProps = {
  employees: EmployeeCompletionRow[];
};

type SortKey =
  | "employee"
  | "manager"
  | "role"
  | "completion"
  | "status"
  | "last_active";

type SortDirection = "asc" | "desc";

function parseLastActive(value: string | null) {
  if (!value) {
    return Number.NEGATIVE_INFINITY;
  }

  const normalized = value
    .replace(/(\d{2})-(\d{2})-(\d{4})/, "$1/$2/$3")
    .replace(/(\d{1,2}:\d{2})(am|pm)/i, "$1 $2");
  const timestamp = Date.parse(normalized);

  return Number.isNaN(timestamp) ? Number.NEGATIVE_INFINITY : timestamp;
}

export function EmployeeTable({ employees }: EmployeeTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("completion");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedEmployees = useMemo(() => {
    const rows = [...employees];

    rows.sort((left, right) => {
      let comparison = 0;

      switch (sortKey) {
        case "employee":
          comparison = left.employee_name.localeCompare(right.employee_name);
          break;
        case "manager":
          comparison = (left.manager_name ?? "Unmapped").localeCompare(right.manager_name ?? "Unmapped");
          break;
        case "role":
          comparison = (left.job_title ?? "Unknown").localeCompare(right.job_title ?? "Unknown");
          break;
        case "completion":
          comparison = left.completion_score - right.completion_score;
          break;
        case "status":
          comparison = getCompletionBand(left.completion_score).localeCompare(
            getCompletionBand(right.completion_score)
          );
          break;
        case "last_active":
          comparison = parseLastActive(left.last_active) - parseLastActive(right.last_active);
          break;
      }

      if (comparison === 0) {
        comparison = left.employee_name.localeCompare(right.employee_name);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    return rows;
  }, [employees, sortDirection, sortKey]);

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection(nextKey === "completion" || nextKey === "last_active" ? "asc" : "asc");
  }

  function getSortIndicator(key: SortKey) {
    if (sortKey !== key) {
      return "↕";
    }

    return sortDirection === "asc" ? "↑" : "↓";
  }

  return (
    <section className="table-shell">
      <div className="employee-table-wrap">
        <table className="employee-table">
          <thead>
            <tr>
              <th>
                <button type="button" className="sort-button" onClick={() => toggleSort("employee")}>
                  <span>Employee</span>
                  <span className="sort-indicator">{getSortIndicator("employee")}</span>
                </button>
              </th>
              <th>
                <button type="button" className="sort-button" onClick={() => toggleSort("manager")}>
                  <span>Manager</span>
                  <span className="sort-indicator">{getSortIndicator("manager")}</span>
                </button>
              </th>
              <th>
                <button type="button" className="sort-button" onClick={() => toggleSort("role")}>
                  <span>Role</span>
                  <span className="sort-indicator">{getSortIndicator("role")}</span>
                </button>
              </th>
              <th>
                <button type="button" className="sort-button" onClick={() => toggleSort("completion")}>
                  <span>Completion %</span>
                  <span className="sort-indicator">{getSortIndicator("completion")}</span>
                </button>
              </th>
              <th>
                <button type="button" className="sort-button" onClick={() => toggleSort("status")}>
                  <span>Status</span>
                  <span className="sort-indicator">{getSortIndicator("status")}</span>
                </button>
              </th>
              <th>
                <button type="button" className="sort-button" onClick={() => toggleSort("last_active")}>
                  <span>Last Active</span>
                  <span className="sort-indicator">{getSortIndicator("last_active")}</span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedEmployees.map((employee) => (
              <tr key={employee.employee_email}>
                <td>
                  <div className="table-person">
                    <strong>{employee.employee_name}</strong>
                    <span>{employee.employee_email}</span>
                  </div>
                </td>
                <td>{employee.manager_name ?? "Unmapped"}</td>
                <td>{employee.job_title ?? "Unknown"}</td>
                <td>
                  <span className={`score-pill score-pill--${getScoreTone(employee.completion_score)}`}>
                    {employee.completion_score}%
                  </span>
                </td>
                <td>
                  <span className={`score-pill score-pill--${getScoreTone(employee.completion_score)}`}>
                    {getCompletionBand(employee.completion_score)}
                  </span>
                </td>
                <td>{employee.last_active ?? "No recent activity"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
