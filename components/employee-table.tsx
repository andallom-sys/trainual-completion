"use client";

import { startTransition, useDeferredValue, useState } from "react";
import { getScoreTone } from "@/lib/dashboard-data";
import type { EmployeeCompletionRow, ManagerSummary } from "@/lib/types";

type EmployeeTableProps = {
  employees: EmployeeCompletionRow[];
  managers: ManagerSummary[];
};

export function EmployeeTable({ employees, managers }: EmployeeTableProps) {
  const [query, setQuery] = useState("");
  const [managerFilter, setManagerFilter] = useState("All managers");
  const deferredQuery = useDeferredValue(query);

  const filteredEmployees = employees.filter((employee) => {
    const matchesQuery =
      deferredQuery.trim().length === 0 ||
      employee.employee_name.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      employee.employee_email.toLowerCase().includes(deferredQuery.toLowerCase()) ||
      (employee.job_title ?? "").toLowerCase().includes(deferredQuery.toLowerCase());

    const matchesManager =
      managerFilter === "All managers" || employee.manager_name === managerFilter;

    return matchesQuery && matchesManager;
  });

  return (
    <section className="table-shell">
      <div className="table-toolbar">
        <label className="field">
          <span>Search employee</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, email, or title"
          />
        </label>

        <label className="field">
          <span>Filter manager</span>
          <select
            value={managerFilter}
            onChange={(event) => {
              startTransition(() => setManagerFilter(event.target.value));
            }}
          >
            <option>All managers</option>
            {managers.map((manager) => (
              <option key={manager.name} value={manager.name}>
                {manager.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="employee-table-wrap">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Manager</th>
              <th>Title</th>
              <th>Completion</th>
              <th>Last active</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmployees.map((employee) => (
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
                <td>{employee.last_active ?? "No recent activity"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
