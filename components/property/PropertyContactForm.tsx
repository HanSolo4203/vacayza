"use client";

import { FormEvent, useState } from "react";

const inputClass =
  "w-full border border-[#333] bg-black p-3 text-xs uppercase tracking-[0.1em] text-vacayza-off-white outline-none focus:ring-1 focus:ring-vacayza-amber";

export default function PropertyContactForm({ propertyTitle }: { propertyTitle: string }) {
  const [submitted, setSubmitted] = useState(false);
  const defaultMessage = `I'm interested in ${propertyTitle} and would like to receive the full investment report.`;

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "");
    const email = String(formData.get("email") ?? "");
    const country = String(formData.get("country") ?? "");
    const message = String(formData.get("message") ?? defaultMessage);

    const subject = encodeURIComponent(`Investment inquiry: ${propertyTitle}`);
    const body = encodeURIComponent(
      `Name: ${name}\nEmail: ${email}\nCountry: ${country}\n\n${message}`,
    );
    window.location.href = `mailto:hello@vacayza.com?subject=${subject}&body=${body}`;
    setSubmitted(true);
  };

  return (
    <form onSubmit={onSubmit} className="mx-auto mt-10 max-w-xl space-y-4">
      <input required name="name" placeholder="Full Name" className={inputClass} />
      <input required name="email" type="email" placeholder="Email Address" className={inputClass} />
      <input required name="country" placeholder="Country of Residence" className={inputClass} />
      <textarea
        required
        name="message"
        rows={4}
        defaultValue={defaultMessage}
        className={inputClass}
      />
      <button
        type="submit"
        className="w-full border border-vacayza-amber px-4 py-3 text-center text-[12px] uppercase tracking-[0.2em] text-vacayza-amber transition hover:bg-vacayza-amber hover:text-black"
      >
        Request Full Investment Report
      </button>
      {submitted && (
        <p className="text-center text-[11px] uppercase tracking-[0.2em] text-vacayza-amber">
          Opening your email client — we&apos;ll respond within 24 hours.
        </p>
      )}
    </form>
  );
}
