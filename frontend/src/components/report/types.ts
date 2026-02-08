import type { AnalysisDoc, AnalysisResult } from "@/lib/types";

export interface ReportSlideProps {
  analysis: AnalysisDoc;
  r: AnalysisResult;
  openDiscuss: (ref: string, name: string) => void;
}
