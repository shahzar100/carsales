import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Shield, Mail } from "lucide-react";
import { getBusinessInfo } from "@/lib/utils/businessInfo";
import LegalPageShell, {
  type LegalSection,
} from "@/components/Legal/LegalPageShell";
import { LEGAL_LAST_UPDATED } from "@/lib/constants";

const businessName =
  process.env.NEXT_PUBLIC_BUSINESS_NAME || "Car Sales & Viewing";

// Cached per-page (no longer force-dynamic via layout). Audit #1.
export const revalidate = 86400;

export const metadata: Metadata = {
  title: `Privacy Policy — ${businessName}`,
  description:
    "Our privacy policy explains how we collect, use, store, and protect your personal information when you use our website and services.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: `Privacy Policy — ${businessName}`,
    description: "Learn how we collect, use, and protect your personal data.",
    url: "/privacy",
  },
};

/**
 * Render one body item from a section's `content` array — preserves the
 * subtitle / paragraph layout the page used pre-extraction so the
 * visual output is byte-identical.
 */
function SectionBody({
  items,
}: {
  items: { subtitle?: string; text: string }[];
}) {
  return (
    <>
      {items.map((item) => (
        <div key={item.text}>
          {item.subtitle && (
            <h3 className="mb-2 text-base font-semibold text-gray-800">
              {item.subtitle}
            </h3>
          )}
          <p className="text-sm leading-relaxed whitespace-pre-line text-gray-600">
            {item.text}
          </p>
        </div>
      ))}
    </>
  );
}

export default async function PrivacyPolicy() {
  const businessInfo = await getBusinessInfo();

  const name = businessInfo.businessName;
  const email = businessInfo.email;
  const address = businessInfo.address;
  const city = businessInfo.city;
  const state = businessInfo.state;
  const zip = businessInfo.zipCode;

  const fullAddress = `${address}, ${city}, ${state} ${zip}`.trim();

  const rawSections: { title: string; content: { subtitle?: string; text: string }[] }[] = [
    {
      title: "1. Information We Collect",
      content: [
        {
          subtitle: "Personal Information You Provide",
          text: "When you book a vehicle viewing, request a service, submit an enquiry, or make a purchase, we may collect your name, email address, phone number, and postal address.",
        },
        {
          subtitle: "Vehicle Information",
          text: "If you request a service or repair, we may collect details about your vehicle such as make, model, registration number, and relevant photographs.",
        },
        {
          subtitle: "Automatically Collected Information",
          text: "When you visit our website, we may automatically collect certain information including your IP address, browser type, device type, pages visited, and time spent on each page. This helps us improve our website and services.",
        },
        {
          subtitle: "Cookies",
          text: "Our website may use cookies and similar technologies to enhance your browsing experience. Essential cookies are required for the website to function correctly. You can manage your cookie preferences through your browser settings.",
        },
      ],
    },
    {
      title: "2. How We Use Your Information",
      content: [
        {
          text: "We use the personal information we collect for the following purposes:",
        },
        {
          text: "• To process and manage vehicle viewing bookings and service appointments\n• To communicate with you about your bookings, services, and enquiries\n• To send booking confirmations and service updates via email\n• To improve our website, services, and customer experience\n• To comply with legal obligations and protect our legitimate business interests\n• To respond to your enquiries and provide customer support",
        },
      ],
    },
    {
      title: "3. Legal Basis for Processing",
      content: [
        {
          text: "We process your personal data on the following legal grounds under the UK GDPR:",
        },
        {
          text: "• Contract: Processing necessary to fulfil our service agreements with you (e.g. bookings, repairs, claims management)\n• Consent: Where you have given explicit consent (e.g. marketing communications)\n• Legitimate Interests: To improve our services, prevent fraud, and ensure website security\n• Legal Obligation: Where we are required by law to hold or disclose your information",
        },
      ],
    },
    {
      title: "4. Data Sharing",
      content: [
        {
          text: "We do not sell, trade, or rent your personal information to third parties. We may share your data in the following circumstances:",
        },
        {
          text: "• Service Providers: With trusted third-party service providers who assist us in operating our website and delivering services (e.g. email delivery services), under strict data processing agreements\n• Legal Requirements: Where required by law, regulation, legal process, or governmental request\n• Business Transfers: In connection with a merger, acquisition, or sale of business assets",
        },
      ],
    },
    {
      title: "5. Data Security",
      content: [
        {
          text: "We take the security of your personal information seriously. We implement appropriate technical and organisational measures to protect your data against unauthorised access, alteration, disclosure, or destruction. These measures include encrypted data transmission, secure server infrastructure, and regular security reviews.",
        },
        {
          text: "While we strive to protect your personal data, no method of transmission over the internet or electronic storage is completely secure. We cannot guarantee absolute security but are committed to maintaining the highest practical standards.",
        },
      ],
    },
    {
      title: "6. Data Retention",
      content: [
        {
          text: "We retain your personal information only for as long as necessary to fulfil the purposes for which it was collected, including to satisfy legal, accounting, or reporting requirements.",
        },
        {
          text: "• Booking and service records: Retained for up to 6 years for legal and warranty purposes\n• Enquiry and contact information: Retained for up to 2 years from your last interaction\n• Website analytics data: Retained in anonymised form for up to 26 months",
        },
      ],
    },
    {
      title: "7. Your Rights",
      content: [
        {
          text: "Under UK data protection law, you have the following rights regarding your personal data:",
        },
        {
          text: "• Right of Access: Request a copy of the personal data we hold about you\n• Right to Rectification: Request correction of inaccurate or incomplete data\n• Right to Erasure: Request deletion of your personal data in certain circumstances\n• Right to Restrict Processing: Request that we limit how we use your data\n• Right to Data Portability: Request your data in a structured, machine-readable format\n• Right to Object: Object to processing based on legitimate interests or direct marketing\n• Right to Withdraw Consent: Where processing is based on consent, withdraw it at any time",
        },
        {
          text: `To exercise any of these rights, please contact us at ${email}. We will respond to your request within 30 days.`,
        },
      ],
    },
    {
      title: "8. Third-Party Links",
      content: [
        {
          text: "Our website may contain links to third-party websites (e.g. Google Maps, social media platforms). We are not responsible for the privacy practices or content of these external sites. We encourage you to read the privacy policies of any third-party websites you visit.",
        },
      ],
    },
    {
      title: "9. Children's Privacy",
      content: [
        {
          text: "Our services are not directed at individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have inadvertently collected data from a minor, please contact us immediately and we will take steps to delete it.",
        },
      ],
    },
    {
      title: "10. Changes to This Policy",
      content: [
        {
          text: "We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. Any changes will be posted on this page with an updated effective date. We encourage you to review this policy periodically.",
        },
      ],
    },
    {
      title: "11. Contact Us",
      content: [
        {
          text: `If you have any questions or concerns about this Privacy Policy or how we handle your personal data, please contact us:`,
        },
        {
          text: `${name}\n${fullAddress}\nEmail: ${email}\nPhone: ${businessInfo.phone}`,
        },
      ],
    },
  ];

  const sections: LegalSection[] = rawSections.map(({ title, content }) => ({
    title,
    body: <SectionBody items={content} />,
  }));

  return (
    <LegalPageShell
      titleLead="Privacy"
      titleAccent="Policy"
      eyebrow={{ icon: Shield, label: "Your Privacy Matters" }}
      intro="We're committed to protecting your privacy. This policy explains how we collect, use, and safeguard your personal information."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={sections}
      footerCta={{
        title: "Questions About Your Data?",
        body: "If you have any questions about this privacy policy or wish to exercise your data rights, get in touch.",
        actions: (
          <>
            <a
              href={`mailto:${email}`}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-8 py-3.5 font-semibold text-white transition-all duration-200 hover:bg-red-500 hover:shadow-lg hover:shadow-red-500/25"
            >
              <Mail size={18} />
              {email}
            </a>
            <Link
              href="/terms"
              className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
            >
              View Terms of Service
            </Link>
          </>
        ),
      }}
    />
  );
}
