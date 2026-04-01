import { DashboardView } from "@/components/dashboard-view";
import { getDashboardSnapshot } from "@/lib/dashboard-data";

export default async function HomePage() {
  const snapshot = await getDashboardSnapshot();

  return (
    <main className="page-shell">
      <DashboardView snapshot={snapshot} />
    </main>
  );
}
