import { DashboardHeader } from "./components/dashboard-header";
import { QuickActions } from "./components/quick-actions";
import { RecentActivity } from "./components/recent-activity";
import { StatsCards } from "./components/stats-card";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl tracking-tight mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, Dr. Sarah Johnson</p>
        </div>

        <StatsCards />

        <div className="grid lg:grid-cols-3 gap-6 mt-8">
          <div className="lg:col-span-2 space-y-6">
            {/* <AppointmentsTable /> */}
          </div>
          <div className="space-y-6">
            <QuickActions />
            <RecentActivity />
          </div>
        </div>
      </main>
    </div>
  )
}
