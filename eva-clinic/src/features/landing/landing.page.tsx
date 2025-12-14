import { AboutSection } from "./components/about-section"
import { BenefitsSection } from "./components/benefits-section"
import { CTASection } from "./components/cta-section"
import { FeaturesSection } from "./components/features-section"
import { Footer } from "./components/footer"
import { Header } from "./components/header"
import { HeroSection } from "./components/hero-section"

const LandingPage = () => {
  return (
    <>
      <Header />
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <BenefitsSection />
      <CTASection />
      <Footer />
    </>
  )
}

export default LandingPage
