import { Navbar } from './landing/sections/Navbar';
import { Hero } from './landing/sections/Hero';
import { ConsultarStrip } from './landing/sections/ConsultarStrip';
import { AntesDoTovia } from './landing/sections/AntesDoTovia';
import { MarqueeStrip } from './landing/sections/MarqueeStrip';
import { ComoFunciona } from './landing/sections/ComoFunciona';
import { Funcionalidades } from './landing/sections/Funcionalidades';
import { DemoMockups } from './landing/sections/DemoMockups';
import { Planos } from './landing/sections/Planos';
import { Gateway } from './landing/sections/Gateway';
import { CTALeadForm } from './landing/sections/CTALeadForm';
import { FAQ } from './landing/sections/FAQ';
import { CTAFinal } from './landing/sections/CTAFinal';
import { Footer } from './landing/sections/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-foreground pt-16">
      <Navbar />
      <Hero />
      <ConsultarStrip />
      <AntesDoTovia />
      <MarqueeStrip />
      <ComoFunciona />
      <Funcionalidades />
      <DemoMockups />
      <Planos />
      <Gateway />
      <CTALeadForm />
      <FAQ />
      <CTAFinal />
      <Footer />
    </div>
  );
}
