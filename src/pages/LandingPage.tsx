import React from 'react';
import { Navbar } from './landing/sections/Navbar';
import { Hero } from './landing/sections/Hero';
import { ConsultarStrip } from './landing/sections/ConsultarStrip';
import { Sobre } from './landing/sections/Sobre';
import { Nome } from './landing/sections/Nome';
import { ComoFunciona } from './landing/sections/ComoFunciona';
import { Funcionalidades } from './landing/sections/Funcionalidades';
import { DemoMockups } from './landing/sections/DemoMockups';
import { ProvaSocial } from './landing/sections/ProvaSocial';
import { Gateway } from './landing/sections/Gateway';
import { Planos } from './landing/sections/Planos';
import { FAQ } from './landing/sections/FAQ';
import { CTAFinal } from './landing/sections/CTAFinal';
import { Footer } from './landing/sections/Footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-foreground pt-16">
      <Navbar />
      <Hero />
      <ConsultarStrip />
      <Sobre />
      <Nome />
      <ComoFunciona />
      <Funcionalidades />
      <DemoMockups />
      <ProvaSocial />
      <Gateway />
      <Planos />
      <FAQ />
      <CTAFinal />
      <Footer />
    </div>
  );
}
