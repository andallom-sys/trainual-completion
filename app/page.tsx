import { EmployeeTable } from "@/components/employee-table";
import { ManagerCard } from "@/components/manager-card";
import { MetricCard } from "@/components/metric-card";
import { getDashboardSnapshot } from "@/lib/dashboard-data";

export default async function HomePage() {
  const snapshot = await getDashboardSnapshot();
  const topManagers = snapshot.managers.slice(0, 6);
  const urgentManagers = snapshot.managers.filter((manager) => manager.averageCompletion < 75);
  const lowestEmployees = snapshot.employees.slice(0, 8);

  return (
    <main className="page-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">NAO Medical Learning Performance</p>
          <h1>Trainual completion visibility for every employee and every manager.</h1>
          <p className="hero-text">
            A branded leadership dashboard designed for fast action: executive rollup on top,
            manager accountability in the middle, and employee-level follow-up at the bottom.
          </p>
          <div className="hero-meta">
            <span>Snapshot date: {snapshot.asOf}</span>
            <span>Source: Trainual + employee roster mapping</span>
          </div>
        </div>

        <div className="hero-accent-card">
          <p className="eyebrow">Leadership Focus</p>
          <h2>{snapshot.totals.atRiskCount} employees need follow-up.</h2>
          <p>
            Use the manager panel to see where coaching should start, then drill into the employee
            table for names, emails, titles, and last activity.
          </p>
        </div>
      </section>

      <section className="metrics-grid">
        <MetricCard
          label="Average completion"
          value={`${snapshot.totals.averageCompletion}%`}
          detail="Current overall completion across the imported employee set."
        />
        <MetricCard
          label="Employees tracked"
          value={String(snapshot.totals.totalEmployees)}
          detail="Directly sourced from the joined Trainual and roster exports."
        />
        <MetricCard
          label="People managers"
          value={String(snapshot.totals.activeManagers)}
          detail="Managers with at least one matched direct report in this snapshot."
        />
        <MetricCard
          label="100% complete"
          value={String(snapshot.totals.completedCount)}
          detail="Employees who have fully completed their assigned Trainual content."
        />
      </section>

      <section className="content-grid">
        <div className="panel panel--feature">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Manager leaderboard</p>
              <h2>Team completion by manager</h2>
            </div>
            <p>Highest performing teams first, with direct visibility into at-risk team members.</p>
          </div>

          <div className="manager-grid">
            {topManagers.map((manager) => (
              <ManagerCard key={manager.name} manager={manager} />
            ))}
          </div>
        </div>

        <div className="panel panel--sidebar">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Action list</p>
              <h2>Lowest completion employees</h2>
            </div>
          </div>

          <div className="alert-stack">
            {lowestEmployees.map((employee) => (
              <article key={employee.employee_email} className="alert-card">
                <div>
                  <strong>{employee.employee_name}</strong>
                  <span>{employee.manager_name ?? "Unmapped manager"}</span>
                </div>
                <strong>{employee.completion_score}%</strong>
              </article>
            ))}
          </div>

          <div className="sidebar-summary">
            <p className="eyebrow">Manager risk</p>
            <div className="risk-list">
              {urgentManagers.length === 0 ? (
                <p className="empty-state">No managers are currently below 75% team average.</p>
              ) : (
                urgentManagers.slice(0, 6).map((manager) => (
                  <div key={manager.name} className="risk-row">
                    <span>{manager.name}</span>
                    <strong>{manager.averageCompletion}%</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Employee detail</p>
            <h2>Searchable completion table</h2>
          </div>
          <p>Filter by manager, search by employee, and use the score color to spot urgency fast.</p>
        </div>
        <EmployeeTable employees={snapshot.employees} managers={snapshot.managers} />
      </section>
    </main>
  );
}
