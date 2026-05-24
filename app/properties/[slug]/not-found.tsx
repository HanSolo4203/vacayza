import Link from "next/link";
import Footer from "../../../components/Footer";
import Navbar from "../../../components/Navbar";

export default function PropertyNotFound() {
  return (
    <main className="bg-vacayza-black">
      <Navbar />
      <section className="flex min-h-[60vh] flex-col items-center justify-center px-6">
        <p className="mb-4 text-[11px] uppercase tracking-[0.25em] text-vacayza-amber">— Not Found</p>
        <h1 className="text-4xl text-vacayza-off-white">Property not found.</h1>
        <Link
          href="/properties"
          className="mt-8 text-xs uppercase tracking-[0.2em] text-vacayza-amber hover:underline"
        >
          View all properties →
        </Link>
      </section>
      <Footer />
    </main>
  );
}
