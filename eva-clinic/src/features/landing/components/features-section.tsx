import { Card, CardContent } from "@/components/ui/card"
import { BarChart3, Calendar, Clock, FileText, Shield, Users } from "lucide-react"

const features = [
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Intelligent appointment booking with automated reminders and conflict detection.",
  },
  {
    icon: Users,
    title: "Patient Management",
    description: "Comprehensive patient profiles with medical history, treatment plans, and notes.",
  },
  {
    icon: FileText,
    title: "Digital Records",
    description: "Secure, HIPAA-compliant electronic health records accessible anywhere.",
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Real-time insights into practice performance, revenue, and patient trends.",
  },
  {
    icon: Shield,
    title: "Compliance & Security",
    description: "Built-in compliance tools and enterprise-grade security for peace of mind.",
  },
  {
    icon: Clock,
    title: "Save Time",
    description: "Automate routine tasks and reduce administrative burden by up to 70%.",
  },
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-6 bg-secondary/30">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wider">Features</p>
          <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight text-balance">
            Everything you need to run a <span className="italic">successful</span> practice.
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border/50 bg-card hover:shadow-lg transition-shadow">
              <CardContent className="p-8">
                <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-accent-foreground" />
                </div>
                <h4 className="font-semibold text-xl mb-2">{feature.title}</h4>
                <p className="text-muted-foreground leading-relaxed text-pretty">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
