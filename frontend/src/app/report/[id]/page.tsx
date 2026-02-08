import { Suspense } from "react";
import ReportClient from "@/components/ReportClient";

// Generate a placeholder page for static export — ReportClient reads the real ID from the URL
export function generateStaticParams() {
  return [{ id: "placeholder" }];
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-700 border-t-blue-500" />
          <p className="text-zinc-500 text-sm">Loading report...</p>
        </div>
      </div>
    }>
      <ReportClient id={id} />
    </Suspense>
  );
}
