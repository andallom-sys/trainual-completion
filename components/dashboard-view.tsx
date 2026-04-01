"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import { EmployeeTable } from "@/components/employee-table";
import { getCompletionBand } from "@/lib/dashboard-data";
import type { DashboardSnapshot, EmployeeCompletionRow, ManagerSummary } from "@/lib/types";

type DashboardViewProps = {
  snapshot: DashboardSnapshot;
};

type ManagerMix = ManagerSummary & {
  completeCount: number;
  nearlyCompleteCount: number;
  needsAttentionCount: number;
};

function sortAlpha(values: string[]) {
  return [...values].sort((a, b) => a.localeCompare(b));
}

function getTitle(employee: EmployeeCompletionRow) {
  return employee.job_title ?? "Unknown";
}

function buildManagerMix(managers: ManagerSummary[]): ManagerMix[] {
  return managers
    .map((manager) => ({
      ...manager,
      completeCount: manager.team.filter((member) => getCompletionBand(member.completion_score) === "Complete").length,
      nearlyCompleteCount: manager.team.filter((member) => getCompletionBand(member.completion_score) === "Nearly Complete").length,
      needsAttentionCount: manager.team.filter((member) => getCompletionBand(member.completion_score) === "Needs Attention").length
    }))
    .sort((a, b) => b.averageCompletion - a.averageCompletion);
}

export function DashboardView({ snapshot }: DashboardViewProps) {
  const [query, setQuery] = useState("");
  const [managerFilter, setManagerFilter] = useState("All Managers");
  const [titleFilter, setTitleFilter] = useState("All Titles");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [bandFilter, setBandFilter] = useState("All Bands");
  const deferredQuery = useDeferredValue(query);

  const managerOptions = useMemo(
    () => sortAlpha(snapshot.managers.map((manager) => manager.name)),
    [snapshot.managers]
  );

  const titleOptions = useMemo(
    () =>
      sortAlpha(
        Array.from(new Set(snapshot.employees.map((employee) => getTitle(employee)).filter(Boolean)))
      ),
    [snapshot.employees]
  );

  const statusOptions = useMemo(
    () =>
      sortAlpha(
        Array.from(
          new Set(
            snapshot.employees
              .map((employee) => employee.employee_status ?? "Unknown")
              .filter(Boolean)
          )
        )
      ),
    [snapshot.employees]
  );

  const filteredEmployees = useMemo(
    () =>
      snapshot.employees.filter((employee) => {
        const normalizedQuery = deferredQuery.trim().toLowerCase();
        const band = getCompletionBand(employee.completion_score);
        const matchesQuery =
          normalizedQuery.length === 0 ||
          employee.employee_name.toLowerCase().includes(normalizedQuery) ||
          employee.employee_email.toLowerCase().includes(normalizedQuery) ||
          getTitle(employee).toLowerCase().includes(normalizedQuery);

        const matchesManager =
          managerFilter === "All Managers" || employee.manager_name === managerFilter;
        const matchesTitle = titleFilter === "All Titles" || getTitle(employee) === titleFilter;
        const matchesStatus =
          statusFilter === "All Statuses" ||
          (employee.employee_status ?? "Unknown") === statusFilter;
        const matchesBand = bandFilter === "All Bands" || band === bandFilter;

        return matchesQuery && matchesManager && matchesTitle && matchesStatus && matchesBand;
      }),
    [bandFilter, deferredQuery, managerFilter, snapshot.employees, statusFilter, titleFilter]
  );

  const filteredManagers = useMemo(() => {
    const teams = new Map<string, EmployeeCompletionRow[]>();

    for (const employee of filteredEmployees) {
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
          directReports === 0
            ? 0
            : Math.round(
                (team.reduce((sum, member) => sum + member.completion_score, 0) / directReports) * 10
              ) / 10;

        return {
          name,
          email: team.find((member) => member.manager_email)?.manager_email ?? null,
          directReports,
          averageCompletion,
          atRiskCount: team.filter((member) => getCompletionBand(member.completion_score) === "Needs Attention").length,
          completedCount: team.filter((member) => getCompletionBand(member.completion_score) === "Complete").length,
          team: [...team].sort((a, b) => a.completion_score - b.completion_score)
        };
      })
      .sort((a, b) => b.averageCompletion - a.averageCompletion);
  }, [filteredEmployees]);

  const totals = useMemo(() => {
    const totalEmployees = filteredEmployees.length;
    const completeCount = filteredEmployees.filter(
      (employee) => getCompletionBand(employee.completion_score) === "Complete"
    ).length;
    const nearlyCompleteCount = filteredEmployees.filter(
      (employee) => getCompletionBand(employee.completion_score) === "Nearly Complete"
    ).length;
    const needsAttentionCount = filteredEmployees.filter(
      (employee) => getCompletionBand(employee.completion_score) === "Needs Attention"
    ).length;
    const averageCompletion =
      totalEmployees === 0
        ? 0
        : Math.round(
            (filteredEmployees.reduce((sum, employee) => sum + employee.completion_score, 0) /
              totalEmployees) *
              10
          ) / 10;

    return {
      totalEmployees,
      completeCount,
      nearlyCompleteCount,
      needsAttentionCount,
      averageCompletion,
      managers: filteredManagers.length
    };
  }, [filteredEmployees, filteredManagers.length]);

  const managerMix = useMemo(() => buildManagerMix(filteredManagers), [filteredManagers]);

  return (
    <>
      <section className="hero-layout">
        <article className="hero-summary-card">
          <p className="hero-chip">Leadership View</p>
          <h1>Trainual Completion Dashboard</h1>
          <p className="hero-description">
            This layout is designed to answer two questions quickly: which managers have the
            healthiest team completion rates, and which employees need follow-up right now.
          </p>
          <div className="hero-meta">
            <span>Snapshot date: {snapshot.asOf}</span>
            <span>Source: Trainual + employee roster mapping</span>
          </div>
        </article>

        <section className="scorecard-grid">
          <article className="scorecard-box">
            <p>Total Employees</p>
            <strong>{totals.totalEmployees}</strong>
          </article>
          <article className="scorecard-box">
            <p>Managers</p>
            <strong>{totals.managers}</strong>
          </article>
          <article className="scorecard-box">
            <p>Complete</p>
            <strong>{totals.completeCount}</strong>
          </article>
          <article className="scorecard-box">
            <p>Needs Attention</p>
            <strong>{totals.needsAttentionCount}</strong>
          </article>
        </section>
      </section>

      <section className="metrics-grid metrics-grid--scorecards">
        <article className="metric-card">
          <p className="metric-label">Overall Completion Rate</p>
          <h3 className="metric-value">{totals.averageCompletion}%</h3>
          <p className="metric-detail">Weighted across all filtered employees.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Complete</p>
          <h3 className="metric-value">{totals.completeCount}</h3>
          <p className="metric-detail">Employees fully done with assigned content.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Nearly Complete</p>
          <h3 className="metric-value">{totals.nearlyCompleteCount}</h3>
          <p className="metric-detail">Employees between 70% and 99% completion.</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Needs Attention</p>
          <h3 className="metric-value">{totals.needsAttentionCount}</h3>
          <p className="metric-detail">Employees below 70% completion.</p>
        </article>
      </section>

      <section className="filter-panel">
        <div className="filter-grid">
          <label className="field">
            <span>Manager</span>
            <select
              value={managerFilter}
              onChange={(event) => startTransition(() => setManagerFilter(event.target.value))}
            >
              <option>All Managers</option>
              {managerOptions.map((manager) => (
                <option key={manager} value={manager}>
                  {manager}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Title</span>
            <select
              value={titleFilter}
              onChange={(event) => startTransition(() => setTitleFilter(event.target.value))}
            >
              <option>All Titles</option>
              {titleOptions.map((title) => (
                <option key={title} value={title}>
                  {title}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Status</span>
            <select
              value={statusFilter}
              onChange={(event) => startTransition(() => setStatusFilter(event.target.value))}
            >
              <option>All Statuses</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Completion Band</span>
            <select
              value={bandFilter}
              onChange={(event) => startTransition(() => setBandFilter(event.target.value))}
            >
              <option>All Bands</option>
              <option>Complete</option>
              <option>Nearly Complete</option>
              <option>Needs Attention</option>
            </select>
          </label>
        </div>

        <label className="field field--search">
          <span>Search Employee</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, email, or title"
          />
        </label>
      </section>

      <section className="charts-grid">
        <article className="panel chart-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Manager Summary</p>
              <h2>Completion Rate by Manager</h2>
            </div>
            <p>Ranked highest to lowest</p>
          </div>

          <div className="chart-scroll">
            <div className="bar-list">
            {managerMix.map((manager) => (
              <div key={manager.name} className="bar-row">
                <strong className="bar-row__label">{manager.name}</strong>
                <div className="progress-track">
                  <span
                    className="progress-fill"
                    style={{ width: `${Math.max(manager.averageCompletion, 3)}%` }}
                  />
                </div>
                <strong className="bar-row__value">{manager.averageCompletion}%</strong>
              </div>
            ))}
            </div>
          </div>
        </article>

        <article className="panel chart-panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Team Mix</p>
              <h2>Status Distribution by Manager</h2>
            </div>
            <p>Green = complete, gold = nearly complete, red = needs attention</p>
          </div>

          <div className="chart-scroll">
            <div className="bar-list">
            {managerMix.map((manager) => {
              const total = Math.max(manager.directReports, 1);
              return (
                <div key={manager.name} className="bar-row bar-row--stacked">
                  <strong className="bar-row__label">{manager.name}</strong>
                  <div className="stacked-track">
                    <span
                      className="stacked-segment stacked-segment--complete"
                      style={{ width: `${(manager.completeCount / total) * 100}%` }}
                    />
                    <span
                      className="stacked-segment stacked-segment--watch"
                      style={{ width: `${(manager.nearlyCompleteCount / total) * 100}%` }}
                    />
                    <span
                      className="stacked-segment stacked-segment--risk"
                      style={{ width: `${(manager.needsAttentionCount / total) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          <div className="legend-row">
            <span><i className="legend-dot legend-dot--complete" />Complete</span>
            <span><i className="legend-dot legend-dot--watch" />Nearly Complete</span>
            <span><i className="legend-dot legend-dot--risk" />Needs Attention</span>
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Employee Drilldown</p>
            <h2>Completion by Employee</h2>
          </div>
          <p>Sorted lowest completion first for follow-up actions</p>
        </div>
        <EmployeeTable employees={filteredEmployees} />
      </section>
    </>
  );
}
