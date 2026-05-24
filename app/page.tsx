import Calculator from "../components/Calculator";
import Contact from "../components/Contact";
import CustomCursor from "../components/CustomCursor";
import Footer from "../components/Footer";
import Hero from "../components/Hero";
import HowItWorks from "../components/HowItWorks";
import Navbar from "../components/Navbar";
import FeaturedProperties from "../components/property/FeaturedProperties";
import StatStrip from "../components/StatStrip";
import Testimonials from "../components/Testimonials";
import WhyCT from "../components/WhyCT";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <main className="bg-vacayza-black">
      <CustomCursor />
      <Navbar />
      <Hero />
      <StatStrip />
      <FeaturedProperties />
      <HowItWorks />
      <Calculator />
      <WhyCT />
      <Testimonials />
      <Contact />
      <Footer />
    </main>
  );
}
