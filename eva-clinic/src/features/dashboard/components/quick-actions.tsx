import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, FileText, Plus, UserPlus } from "lucide-react"

export function QuickActions() {
  const actions = [
    { label: "New Appointment", icon: Plus },
    { label: "Add Patient", icon: UserPlus },
    { label: "Schedule", icon: Calendar },
    { label: "New Report", icon: FileText },
  ]

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Button
              key={action.label}
              variant="outline"
              className="w-full justify-start gap-3 h-auto py-3 bg-transparent"
            >
              <div className="h-8 w-8 rounded-full bg-accent/50 flex items-center justify-center">
                <Icon className="h-4 w-4 text-accent-foreground" />
              </div>
              <span className="text-sm">{action.label}</span>
            </Button>
          )
        })}
      </CardContent>
    </Card>
  )
}
