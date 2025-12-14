import { Button } from "@/components/ui/button"

export function AboutSection() {
  return (
    <section id="about" className="py-20 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div>
            <p className="text-sm text-muted-foreground mb-4 uppercase tracking-wider">What we do</p>
            <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight mb-6 text-balance">
              Comprehensive <span className="italic">management</span> and support for modern healthcare practices.
            </h3>
            <p className="text-muted-foreground leading-relaxed mb-6 text-pretty">
              Eva Clinic offers an integrated suite of management and operational tools for healthcare practices of all
              sizes. Our platform and certified staff are ready to assist with patient scheduling, medical records
              management, billing operations, and compliance tracking.
            </p>
            <Button variant="outline" className="rounded-full px-6 bg-transparent">
              Learn more
            </Button>
          </div>

          <div className="aspect-square rounded-2xl overflow-hidden">
            <img src="/medical-professional-hands-holding-stethoscope-wit.jpg" alt="Healthcare excellence" className="w-full h-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  )
}
