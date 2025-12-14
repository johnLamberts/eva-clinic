import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CheckCircle2, FileText, UserPlus } from "lucide-react"

export function RecentActivity() {
  const activities = [
    {
      id: 1,
      action: "Appointment completed",
      patient: "Emily Chen",
      time: "30 min ago",
      icon: CheckCircle2,
    },
    {
      id: 2,
      action: "New patient registered",
      patient: "David Kim",
      time: "1 hour ago",
      icon: UserPlus,
    },
    {
      id: 3,
      action: "Lab report uploaded",
      patient: "Sarah Williams",
      time: "2 hours ago",
      icon: FileText,
    },
    {
      id: 4,
      action: "Appointment scheduled",
      patient: "James Anderson",
      time: "3 hours ago",
      icon: Calendar,
    },
  ]

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => {
            const Icon = activity.icon
            return (
              <div key={activity.id} className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-accent/50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="h-4 w-4 text-accent-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground leading-tight">{activity.action}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.patient}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.time}</p>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
