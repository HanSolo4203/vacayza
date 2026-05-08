import type { Metadata } from "next";
import ComingSoonView from "./ComingSoonView";

export const metadata: Metadata = {
  title: "Vacayza — Coming Soon",
  description:
    "Cape Town short-term rental investments. We are preparing something new—check back soon.",
  openGraph: {
    title: "Vacayza — Coming Soon",
    description: "Cape Town short-term rental investments. Opening soon.",
    type: "website",
    siteName: "Vacayza",
  },
};

export default function ComingSoonPage() {
  return <ComingSoonView />;
}
