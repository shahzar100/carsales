import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/utils/auth";
import { getCarPartsCollection, serializeDocument } from "@/lib/models";
import type { CarPartInterface } from "@/lib/interfaces";
import CarPartsClient from "@/components/Admin/CarPartsClient";

/**
 * Car-parts admin page — Server Component.
 *
 * (Day 12.6 / Finding #29) Initial inventory is fetched server-side and
 * handed to a client island for create/edit/delete interactivity.
 * Previously this page was all-client and had to render a loading
 * spinner, then round-trip `/api/admin/carparts`, then render.
 */
export default async function CarPartsManagementPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect("/admin/login");

  const collection = await getCarPartsCollection();
  const docs = await collection
    .find({})
    .sort({ createdAt: -1 })
    .toArray();
  const initialParts = docs.map(
    (d) => serializeDocument(d) as CarPartInterface
  );

  return <CarPartsClient initialParts={initialParts} />;
}
