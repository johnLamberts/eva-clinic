import { Card, CardContent } from "@/components/ui/card"
import { Calendar, DollarSign, TrendingUp, Users } from "lucide-react"

export function StatsCards() {
  const stats = [
    {
      label: "Total Patients",
      value: "2,847",
      change: "+12%",
      icon: Users,
      positive: true,
    },
    {
      label: "Today's Appointments",
      value: "24",
      change: "3 pending",
      icon: Calendar,
      positive: true,
    },
    {
      label: "Monthly Revenue",
      value: "$54,231",
      change: "+8%",
      icon: DollarSign,
      positive: true,
    },
    {
      label: "Patient Satisfaction",
      value: "98%",
      change: "+2%",
      icon: TrendingUp,
      positive: true,
    },
  ]

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <Card key={stat.label} className="border-border">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="h-10 w-10 rounded-full bg-accent/50 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <span className={`text-xs font-medium ${stat.positive ? "text-chart-1" : "text-destructive"}`}>
                  {stat.change}
                </span>
              </div>
              <div>
                <p className="text-2xl font-serif font-semibold tracking-tight">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
