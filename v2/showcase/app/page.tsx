import Header from '../components/Header';
import Hero from '../components/Hero';
import CapabilityStrip from '../components/CapabilityStrip';
import WhySection from '../components/WhySection';
import Playground from '../components/Playground';
import EffectGallery from '../components/EffectGallery';
import SampleProjects from '../components/SampleProjects';
import SportsConcepts from '../components/SportsConcepts';
import AutoConcepts from '../components/AutoConcepts';
import IntegrationSection from '../components/IntegrationSection';
import VersionSection from '../components/VersionSection';
import LegacySection from '../components/LegacySection';
import CtaSection from '../components/CtaSection';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#05060f] font-[family-name:var(--font-geist-sans)] text-slate-200">
      <Header />
      <main>
        <Hero />
        <CapabilityStrip />
        <WhySection />
        <Playground />
        <EffectGallery />
        <SampleProjects />
        <SportsConcepts />
        <AutoConcepts />
        <IntegrationSection />
        <VersionSection />
        <LegacySection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}