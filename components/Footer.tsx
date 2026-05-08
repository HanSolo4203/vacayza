export default function Footer() {
  return (
    <footer className="bg-vacayza-black px-6 py-10 md:px-12">
      <div className="mx-auto max-w-7xl border-t border-[#333] pt-8">
        <div className="grid gap-8 text-[11px] uppercase tracking-[0.15em] text-vacayza-muted md:grid-cols-4">
          <div className="text-vacayza-off-white">VACAYZA</div>
          <div className="space-y-2">
            <a href="#how" className="block hover:text-vacayza-off-white">
              How It Works
            </a>
            <a href="#calculator" className="block hover:text-vacayza-off-white">
              Returns Calculator
            </a>
            <a href="#why-ct" className="block hover:text-vacayza-off-white">
              Why Cape Town
            </a>
          </div>
          <div className="space-y-2">
            <a href="#" className="block hover:text-vacayza-off-white">
              Privacy Policy
            </a>
            <a href="#" className="block hover:text-vacayza-off-white">
              Terms of Service
            </a>
          </div>
          <p>Short-term rental management by Right Stay Africa, Cape Town</p>
        </div>
        <div className="mt-8 flex flex-col justify-between gap-2 border-t border-[#222] pt-5 text-[11px] uppercase tracking-[0.15em] text-vacayza-muted md:flex-row">
          <p>© 2025 VACAYZA</p>
          <p>CAPE TOWN, SOUTH AFRICA</p>
        </div>
      </div>
    </footer>
  );
}
