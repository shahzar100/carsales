import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Scale, Mail } from "lucide-react";
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
  title: `Terms of Service — ${businessName}`,
  description:
    "Terms and conditions governing the use of our website, vehicle sales, automotive services, and bookings.",
  alternates: { canonical: "/terms" },
  openGraph: {
    title: `Terms of Service — ${businessName}`,
    description:
      "Read our terms of service covering vehicle sales, services, bookings, and website usage.",
    url: "/terms",
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

export default async function TermsOfService() {
  const businessInfo = await getBusinessInfo();

  const name = businessInfo.businessName;
  const email = businessInfo.email;
  const phone = businessInfo.phone;
  const address = businessInfo.address;
  const city = businessInfo.city;
  const state = businessInfo.state;
  const zip = businessInfo.zipCode;

  const fullAddress = `${address}, ${city}, ${state} ${zip}`.trim();

  const rawSections: { title: string; content: { subtitle?: string; text: string }[] }[] = [
    {
      title: "1. Introduction",
      content: [
        {
          text: `These Terms of Service ("Terms") govern your use of the ${name} website and the services we provide, including vehicle sales, car servicing, detailing, window tinting, repairs, and breakdown recovery.`,
        },
        {
          text: `By accessing our website or using our services, you agree to be bound by these Terms. If you do not agree with any part of these Terms, please do not use our website or services.`,
        },
        {
          text: `${name} is located at ${fullAddress}. For questions about these Terms, contact us at ${email} or call ${phone}.`,
        },
      ],
    },
    {
      title: "2. Vehicle Sales",
      content: [
        {
          subtitle: "Vehicle Descriptions",
          text: "We make every effort to ensure vehicle descriptions, specifications, and photographs on our website are accurate. However, minor discrepancies may occur. All vehicles are sold as seen following a physical viewing. We recommend inspecting any vehicle in person before purchasing.",
        },
        {
          subtitle: "Pricing",
          text: "All vehicle prices displayed on our website are in GBP (£) and include VAT where applicable. Prices are subject to change without notice. The price at the time of sale confirmation is the binding price.",
        },
        {
          subtitle: "Vehicle Viewings",
          text: "Vehicle viewings can be booked through our website or by contacting us directly. Bookings are subject to availability. We reserve the right to cancel or reschedule viewings if necessary, in which case we will notify you promptly.",
        },
        {
          subtitle: "Ownership Transfer",
          text: "Ownership of a vehicle passes to the buyer only upon receipt of full payment. The buyer is responsible for all costs associated with registration, insurance, and road tax from the point of collection.",
        },
        {
          subtitle: "Vehicle Condition",
          text: "All vehicles undergo a pre-sale inspection and are sold in good faith. We provide full transparency about the vehicle's history and condition. Your statutory consumer rights are not affected by these Terms.",
        },
      ],
    },
    {
      title: "3. Service Bookings",
      content: [
        {
          subtitle: "Booking Confirmation",
          text: "Service bookings (detailing, tinting, repairs, etc.) are confirmed via email. A booking is not guaranteed until you receive a confirmation from us. We endeavour to accommodate your preferred date and time but reserve the right to suggest alternatives.",
        },
        {
          subtitle: "Cancellations & Rescheduling",
          text: "You may cancel or reschedule a service booking through our website or by contacting us. We appreciate at least 24 hours' notice for cancellations. Repeated no-shows may affect future booking availability.",
        },
        {
          subtitle: "Service Pricing",
          text: "Service prices are as advertised on our website at the time of booking. If additional work is identified during a service, we will contact you for approval before proceeding. You are not obliged to accept additional work.",
        },
        {
          subtitle: "Completion Times",
          text: "Estimated service times are provided in good faith but may vary depending on vehicle condition and workload. We will keep you informed of any significant delays.",
        },
        {
          subtitle: "Quality Guarantee",
          text: "All service work is carried out by trained professionals and is covered by our quality guarantee. If you are not satisfied with the work, please contact us within 14 days and we will make it right.",
        },
      ],
    },
    {
      title: "4. Breakdown Recovery",
      content: [
        {
          text: "Our breakdown recovery service is available 24 hours a day, 7 days a week. Pricing is based on distance and is quoted at the time of your call. We aim to attend as quickly as possible, but response times may vary based on location, traffic, and demand.",
        },
        {
          text: "Recovery charges are payable at the time of service. We accept the payment methods listed on our website. We are not liable for any consequential losses resulting from vehicle breakdown or recovery delays beyond our control.",
        },
      ],
    },
    {
      title: "5. Website Usage",
      content: [
        {
          subtitle: "Acceptable Use",
          text: "You agree to use our website lawfully and not to engage in any activity that could damage, disable, overburden, or impair the site. You must not attempt to gain unauthorised access to any part of the website, server, or database.",
        },
        {
          subtitle: "Intellectual Property",
          text: `All content on this website — including text, images, graphics, logos, and design — is the property of ${name} or its content suppliers and is protected by UK and international intellectual property laws. You may not reproduce, distribute, or create derivative works without our written permission.`,
        },
        {
          subtitle: "Accuracy of Information",
          text: "We aim to keep all information on our website accurate and up to date. However, we do not warrant that all content is complete, accurate, or current. Information is provided for general guidance only.",
        },
      ],
    },
    {
      title: "6. Payments",
      content: [
        {
          text: "We accept the payment methods specified on our website and at our premises. All payments for vehicle purchases should ideally be made via bank transfer for security purposes. Payment terms for services may vary and will be confirmed at the time of booking.",
        },
        {
          text: "Any deposit paid toward a vehicle purchase or service booking may be non-refundable in certain circumstances, which will be clearly communicated at the time of payment.",
        },
      ],
    },
    {
      title: "7. Limitation of Liability",
      content: [
        {
          text: `To the fullest extent permitted by law, ${name} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or in connection with your use of our website or services.`,
        },
        {
          text: "Nothing in these Terms excludes or limits our liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, or any other liability that cannot be excluded or limited under applicable law.",
        },
      ],
    },
    {
      title: "8. Privacy",
      content: [
        {
          text: "Your privacy is important to us. Our collection and use of personal data is governed by our Privacy Policy, which forms part of these Terms. By using our services, you consent to the data practices described in our Privacy Policy.",
        },
      ],
    },
    {
      title: "9. Dispute Resolution",
      content: [
        {
          text: "If you have a complaint or dispute regarding our services, we encourage you to contact us first so we can attempt to resolve the matter informally. You can reach us at the contact details provided below.",
        },
        {
          text: "If we are unable to resolve a dispute informally, it shall be governed by and construed in accordance with the laws of England and Wales. The courts of England and Wales shall have exclusive jurisdiction.",
        },
      ],
    },
    {
      title: "10. Changes to These Terms",
      content: [
        {
          text: "We reserve the right to update or modify these Terms at any time. Changes will be posted on this page with an updated effective date. Continued use of our website or services after changes are posted constitutes acceptance of the revised Terms.",
        },
      ],
    },
    {
      title: "11. Contact Information",
      content: [
        {
          text: `If you have any questions about these Terms of Service, please contact us:`,
        },
        {
          text: `${name}\n${fullAddress}\nEmail: ${email}\nPhone: ${phone}`,
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
      titleLead="Terms of"
      titleAccent="Service"
      eyebrow={{ icon: Scale, label: "Legal" }}
      intro="Please read these terms carefully before using our website or services. They outline your rights and responsibilities."
      lastUpdated={LEGAL_LAST_UPDATED}
      sections={sections}
      footerCta={{
        title: "Questions About Our Terms?",
        body: "If you need clarification on any of our terms or policies, don't hesitate to reach out.",
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
              href="/privacy"
              className="inline-flex items-center rounded-xl border border-white/20 bg-white/5 px-8 py-3.5 font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/10"
            >
              View Privacy Policy
            </Link>
          </>
        ),
      }}
    />
  );
}
