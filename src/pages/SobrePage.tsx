import { Navbar } from './landing/sections/Navbar';
import { Nome } from './landing/sections/Nome';
import { Sobre } from './landing/sections/Sobre';
import { Footer } from './landing/sections/Footer';

export default function SobrePage() {
  return (
    <div className="min-h-screen bg-white font-sans text-foreground pt-16">
      <Navbar />
      <Nome />
      <Sobre />
      <Footer />
    </div>
  );
}
