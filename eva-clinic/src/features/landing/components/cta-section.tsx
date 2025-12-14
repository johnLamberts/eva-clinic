import { Button } from "@/components/ui/button"

export function CTASection() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-4xl text-center">
        <h3 className="font-serif text-4xl md:text-5xl lg:text-6xl leading-tight tracking-tight mb-6 text-balance">
          Ready to transform your <span className="italic">practice</span>?
        </h3>
        <p className="text-muted-foreground text-lg mb-8 text-pretty">
          Join thousands of healthcare providers who trust Eva Clinic to manage their practice operations.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center max-w-md mx-auto">
          {/* <Input type="email" placeholder="Enter your email" className="rounded-full" /> */}
          <Button
            size="lg"
            className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-8 w-full sm:w-auto whitespace-nowrap"
          >
            Get Started
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-4">
          No credit card required • 14-day free trial • Cancel anytime
        </p>
      </div>
    </section>
  )
}
