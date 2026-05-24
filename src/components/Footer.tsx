"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useBusinessInfo } from "@/contexts/BusinessInfoContext";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
} from "lucide-react";

const columnVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const socialHover = { scale: 1.18, rotate: -6 };
const socialTap = { scale: 0.9 };
const socialSpring = { type: "spring" as const, stiffness: 420, damping: 18 };

export default function Footer() {
  const { businessInfo } = useBusinessInfo();

  if (!businessInfo) return null;

  const name = businessInfo.businessName;
  const address = businessInfo.address;
  const city = businessInfo.city;
  const state = businessInfo.state;
  const zip = businessInfo.zipCode;
  const phone = businessInfo.phone;
  const email = businessInfo.email;
  const bookingsEmail = businessInfo.bookingsEmail;
  const description = businessInfo.description;
  const social = businessInfo.socialMedia;
  const googleMapsUrl = businessInfo.googleMapsUrl;

  const fullAddress = `${address}, ${city}, ${state} ${zip}`.trim();
  const mapsHref =
    googleMapsUrl ||
    `https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`;

  return (
    <footer className="w-full border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 text-gray-700 sm:px-6 sm:py-12">
        {/* Main Footer Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4"
        >
          {/* Company Info */}
          <motion.div variants={columnVariants}>
            <h3 className="heading-3 mb-4">{name}</h3>
            <p className="mb-4 text-sm text-gray-700">{description}</p>
            <div className="space-y-2 text-sm text-gray-700">
              <p className="flex items-center gap-1.5">
                <MapPin size={14} className="shrink-0 text-gray-400" />
                <Link
                  href={mapsHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-red-600"
                >
                  {address}, {city}
                </Link>
              </p>
              <p className="flex items-center gap-1.5">
                <Phone size={14} className="shrink-0 text-gray-400" />
                <a
                  href={`tel:${phone}`}
                  className="transition-colors hover:text-red-600"
                >
                  {phone}
                </a>
              </p>
              <p className="flex items-center gap-1.5">
                <Mail size={14} className="shrink-0 text-gray-400" />
                <a
                  href={`mailto:${email}`}
                  className="transition-colors hover:text-red-600"
                >
                  {email}
                </a>
              </p>
              {bookingsEmail && bookingsEmail !== email && (
                <p className="flex items-center gap-1.5">
                  <Mail size={14} className="shrink-0 text-gray-400" />
                  <a
                    href={`mailto:${bookingsEmail}`}
                    className="transition-colors hover:text-red-600"
                  >
                    {bookingsEmail}
                  </a>
                </p>
              )}
            </div>
          </motion.div>

          {/* Browse & Services */}
          <motion.div variants={columnVariants}>
            <h4 className="heading-4 mb-4">Browse & Services</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/BrowseFleet"
                  className="text-gray-700 transition-colors hover:text-red-600"
                >
                  Browse Fleet
                </Link>
              </li>
              <li>
                <Link
                  href="/Services"
                  className="text-gray-700 transition-colors hover:text-red-600"
                >
                  Services
                </Link>
              </li>
              <li>
                <Link
                  href="/Services/Repairs"
                  className="text-gray-700 transition-colors hover:text-red-600"
                >
                  Repairs
                </Link>
              </li>
              <li>
                <Link
                  href="/Recoveries"
                  className="text-gray-700 transition-colors hover:text-red-600"
                >
                  Recoveries
                </Link>
              </li>
              <li>
                <Link
                  href="/CarParts"
                  className="text-gray-700 transition-colors hover:text-red-600"
                >
                  Car Parts
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Support & Info */}
          <motion.div variants={columnVariants}>
            <h4 className="heading-4 mb-4">Support & Info</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/FAQ"
                  className="text-gray-700 transition-colors hover:text-red-600"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/AboutUs"
                  className="text-gray-700 transition-colors hover:text-red-600"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-700 transition-colors hover:text-red-600"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </motion.div>

          {/* Legal */}
          <motion.div variants={columnVariants}>
            <h4 className="heading-4 mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/privacy"
                  className="text-gray-700 transition-colors hover:text-red-600"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-gray-700 transition-colors hover:text-red-600"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </motion.div>
        </motion.div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex flex-col items-center justify-between md:flex-row">
            <p className="text-sm text-gray-700">
              &copy; {new Date().getFullYear()} {name}. All rights reserved.
            </p>
            <div className="mt-4 flex space-x-4 md:mt-0">
              {social?.facebook && (
                <motion.a
                  href={social.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={socialHover}
                  whileTap={socialTap}
                  transition={socialSpring}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-red-600"
                >
                  <span className="sr-only">Facebook</span>
                  <Facebook size={20} />
                </motion.a>
              )}
              {social?.twitter && (
                <motion.a
                  href={social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={socialHover}
                  whileTap={socialTap}
                  transition={socialSpring}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-red-600"
                >
                  <span className="sr-only">Twitter</span>
                  <Twitter size={20} />
                </motion.a>
              )}
              {social?.instagram && (
                <motion.a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={socialHover}
                  whileTap={socialTap}
                  transition={socialSpring}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full text-gray-600 hover:bg-gray-100 hover:text-red-600"
                >
                  <span className="sr-only">Instagram</span>
                  <Instagram size={20} />
                </motion.a>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
