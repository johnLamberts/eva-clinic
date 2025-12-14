import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="mx-auto max-w-7xl">
        <div className="text-center max-w-4xl mx-auto">
          <h2 className="font-serif text-5xl md:text-7xl lg:text-8xl leading-tight tracking-tight text-balance mb-8">
            Providing <span className="italic">excellence</span> to healthcare practices and patients for better{" "}
            <span className="italic">outcomes</span>.
          </h2>

          <Button
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-8 text-base mt-4"
          >
            Schedule a Demo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          <div className="aspect-[4/5] rounded-2xl overflow-hidden">
            <img
              src="/images/healthcare-professional-looking-at-tablet-in-moder.jpg"
              alt="Healthcare professional"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="aspect-[4/5] rounded-2xl overflow-hidden">
            <img src="/images/public/images/doctor-consulting-with-patient-in-bright-office.jpg" alt="Doctor consultation" className="w-full h-full object-cover" />
          </div>
          <div className="aspect-[4/5] rounded-2xl overflow-hidden">
            <img src="/images/smiling-healthcare-worker-in-white-coat.jpg" alt="Healthcare worker" className="w-full h-full object-cover" />
          </div>
        </div>

        <div className="mt-16 bg-secondary/50 rounded-2xl p-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">Trusted by leading healthcare providers</p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            <span className="font-semibold text-lg tracking-tight">Mayo Clinic</span>
            <span className="font-semibold text-lg tracking-tight">Cleveland Clinic</span>
            <span className="font-semibold text-lg tracking-tight">Kaiser Permanente</span>
            <span className="font-semibold text-lg tracking-tight">Johns Hopkins</span>
          </div>
        </div>
      </div>
    </section>
  )
}
