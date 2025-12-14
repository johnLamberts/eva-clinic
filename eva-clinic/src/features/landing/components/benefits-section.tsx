import { CheckCircle2 } from "lucide-react"

const benefits = [
  {
    stat: "70%",
    label: "Reduction in administrative tasks",
    description: "Focus more on patient care, less on paperwork",
  },
  {
    stat: "95%",
    label: "Patient satisfaction rate",
    description: "Improved experience through better communication",
  },
  {
    stat: "3x",
    label: "Faster appointment scheduling",
    description: "Fill your calendar efficiently with smart booking",
  },
  {
    stat: "100%",
    label: "HIPAA compliant",
    description: "Enterprise-grade security you can trust",
  },
]

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-20 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center mb-16">
          <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wider">Benefits</p>
          <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight mb-6 text-balance">
            Trusted by thousands of healthcare <span className="italic">professionals</span>.
          </h3>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto text-pretty">
            Join the healthcare providers who have transformed their practice operations and patient care.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit) => (
            <div key={benefit.label} className="text-center">
              <div className="text-5xl md:text-6xl font-bold mb-2 text-foreground">{benefit.stat}</div>
              <div className="font-semibold text-lg mb-2">{benefit.label}</div>
              <p className="text-muted-foreground text-sm text-pretty">{benefit.description}</p>
            </div>
          ))}
        </div>

        <div className="mt-20 bg-primary text-primary-foreground rounded-3xl p-12 md:p-16">
          <div className="max-w-3xl mx-auto">
            <h4 className="font-serif text-3xl md:text-4xl lg:text-5xl leading-tight tracking-tight mb-8 text-balance">
              Why healthcare providers choose Eva Clinic
            </h4>
            <div className="grid gap-4">
              {[
                "Intuitive interface designed specifically for healthcare workflows",
                "Seamless integration with existing EMR and billing systems",
                "24/7 customer support from healthcare IT specialists",
                "Regular updates with new features based on user feedback",
                "Flexible pricing plans that scale with your practice",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 flex-shrink-0 mt-0.5" />
                  <p className="text-lg leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
