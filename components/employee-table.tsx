"use client";

import { getCompletionBand, getScoreTone } from "@/lib/dashboard-data";
import type { EmployeeCompletionRow } from "@/lib/types";

type EmployeeTableProps = {
  employees: EmployeeCompletionRow[];
};

export function EmployeeTable({ employees }: EmployeeTableProps) {
  return (
    <section className="table-shell">
      <div className="employee-table-wrap">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Manager</th>
              <th>Role</th>
              <th>Completion %</th>
              <th>Status</th>
              <th>Last active</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
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
