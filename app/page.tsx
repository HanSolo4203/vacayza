import Calculator from "../components/Calculator";
import Contact from "../components/Contact";
import CustomCursor from "../components/CustomCursor";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import Navbar from "../components/Navbar";
import StatStrip from "../components/StatStrip";
import Testimonials from "../components/Testimonials";
import WhyCT from "../components/WhyCT";

export default function Home() {
  return (
    <main className="bg-vacayza-black">
      <CustomCursor />
      <Navbar />
      <Hero />
      <StatStrip />
      <HowItWorks />
      <Calculator />
      <WhyCT />
      <Testimonials />
      <Contact />
      <Footer />
    </main>
  );
}
