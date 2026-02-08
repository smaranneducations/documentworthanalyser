import ReportClient from "@/components/ReportClient";

// Mark as dynamic so Next.js doesn't try to statically generate this route
export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ReportClient id={id} />;
}
