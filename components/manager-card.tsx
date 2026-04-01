import { getManagerHeat } from "@/lib/dashboard-data";
import type { ManagerSummary } from "@/lib/types";

type ManagerCardProps = {
  manager: ManagerSummary;
};

export function ManagerCard({ manager }: ManagerCardProps) {
  const heat = getManagerHeat(manager);

  return (
    <article className={`manager-card manager-card--${heat}`}>
      <div className="manager-card__header">
        <div>
          <p className="eyebrow">Manager</p>
          <h3>{manager.name}</h3>
        </div>
        <div className="manager-score-ring">
          <span>{Math.round(manager.averageCompletion)}%</span>
        </div>
      </div>

      <div className="manager-card__stats">
        <div>
          <span>Direct reports</span>
          <strong>{manager.directReports}</strong>
        </div>
        <div>
          <span>At risk</span>
          <strong>{manager.atRiskCount}</strong>
        </div>
        <div>
          <span>100% complete</span>
          <strong>{manager.completedCount}</strong>
        </div>
      </div>

      <div className="manager-team-list">
        {manager.team.slice(0, 5).map((member) => (
          <div key={member.employee_email} className="mini-person-row">
            <div>
              <p>{member.employee_name}</p>
              <span>{member.job_title ?? "Team member"}</span>
            </div>
            <strong>{member.completion_score}%</strong>
          </div>
        ))}
      </div>
    </article>
  );
}
