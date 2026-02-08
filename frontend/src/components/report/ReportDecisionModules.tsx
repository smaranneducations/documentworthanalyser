import { Users, Building2, Target, Eye, Sparkles, Brain } from "lucide-react";
import SectionCard from "@/components/dashboard/SectionCard";
import WeightedDriversTable from "@/components/dashboard/WeightedDriversTable";
import ClassificationBadge from "@/components/dashboard/ClassificationBadge";
import HelpTooltip from "@/components/HelpTooltip";
import { tip } from "@/lib/tooltips";
import type { ReportSlideProps } from "./types";

const providerDriverTips: Record<string, string> = {
  "Problem Definition Clarity": tip("driver_problem_definition"),
  "Vendor Lock-in Potential": tip("driver_vendor_lockin"),
  "Implementation Autonomy": tip("driver_implementation_autonomy"),
  "Upsell Visibility": tip("driver_upsell_visibility"),
  "Risk Transfer": tip("driver_risk_transfer"),
};
const companyScaleDriverTips: Record<string, string> = {
  "Framework Proprietary Level": tip("driver_framework_proprietary"),
  "Data Scope & Depth": tip("driver_data_scope"),
  "Design Polish & Branding": tip("driver_design_polish"),
  "Service Breadth": tip("driver_service_breadth"),
  "Legal/Compliance Density": tip("driver_legal_compliance"),
};
const targetScaleDriverTips: Record<string, string> = {
  "Governance Complexity": tip("driver_governance"),
  "Cross-Functional Impact": tip("driver_cross_functional"),
  "Legacy Integration Focus": tip("driver_legacy_integration"),
  "Budget/Resource Implication": tip("driver_budget_resource"),
  "Risk & Security Standards": tip("driver_risk_security"),
};
const audienceDriverTips: Record<string, string> = {
  "Strategic vs. Tactical Ratio": tip("driver_strategic_tactical"),
  "Financial Metric Density": tip("driver_financial_metric"),
  "Technical Jargon Density": tip("driver_technical_jargon"),
  "Actionable Horizon": tip("driver_actionable_horizon"),
  "Decision Scope": tip("driver_decision_scope"),
};
const rarityDriverTips: Record<string, string> = {
  "Primary Data Source": tip("driver_primary_data"),
  "Contrarian Factor": tip("driver_contrarian_factor"),
  "Framework Novelty": tip("driver_framework_novelty"),
  "Predictive Specificity": tip("driver_predictive_specificity"),
  "Case Study Transparency": tip("driver_case_study_transparency"),
};

export default function ReportDecisionModules({ r, openDiscuss }: ReportSlideProps) {
  return (
    <section className="report-slide min-h-screen flex items-start bg-zinc-900/40 scroll-snap-align-start print-page-break">
      <div className="mx-auto max-w-7xl w-full px-6 py-16">
        <div className="rounded-2xl bg-zinc-950/70 border border-zinc-800/50 p-8">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-zinc-200">
            <Brain className="h-6 w-6 text-blue-400" />
            <HelpTooltip text={tip("header_core_modules")} position="bottom">
              <span className="cursor-help border-b border-dotted border-zinc-600">Core Decision Modules</span>
            </HelpTooltip>
          </h2>
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            <SectionCard title="Provider vs. Consumer" tooltip={tip("section_provider_consumer")} icon={Users} iconColor="text-blue-400" iconBg="bg-blue-500/10" sectionRef="provider_consumer" onDiscuss={openDiscuss}>
              <ClassificationBadge label="Suitability" value={r.provider_consumer.classification} confidence={r.provider_consumer.confidence} tooltip={tip("provider_consumer_label")} />
              <div className="mt-4 text-center mb-3">
                <span className="text-3xl font-bold text-blue-400">{r.provider_consumer.composite_score}</span>
                <span className="text-zinc-500"> / 100</span>
              </div>
              <WeightedDriversTable drivers={r.provider_consumer.drivers} driverTooltips={providerDriverTips} />
            </SectionCard>

            <SectionCard title="Originator Scale" tooltip={tip("section_company_scale")} icon={Building2} iconColor="text-purple-400" iconBg="bg-purple-500/10" sectionRef="company_scale" onDiscuss={openDiscuss}>
              <ClassificationBadge label="Originator" value={r.company_scale.classification} confidence={r.company_scale.confidence} tooltip={tip("originator_scale_label")} />
              <div className="mt-4 text-center mb-3">
                <span className="text-3xl font-bold text-purple-400">{r.company_scale.composite_score}</span>
                <span className="text-zinc-500"> / 100</span>
              </div>
              <WeightedDriversTable drivers={r.company_scale.drivers} driverTooltips={companyScaleDriverTips} />
            </SectionCard>

            <SectionCard title="Target Company Scale" tooltip={tip("section_target_scale")} icon={Target} iconColor="text-orange-400" iconBg="bg-orange-500/10" sectionRef="target_scale" onDiscuss={openDiscuss}>
              <ClassificationBadge label="Target" value={r.target_scale.classification} confidence={r.target_scale.confidence} tooltip={tip("target_company_label")} />
              <div className="mt-4 text-center mb-3">
                <span className="text-3xl font-bold text-orange-400">{r.target_scale.composite_score}</span>
                <span className="text-zinc-500"> / 100</span>
              </div>
              <WeightedDriversTable drivers={r.target_scale.drivers} driverTooltips={targetScaleDriverTips} />
            </SectionCard>

            <SectionCard title="Target Audience" tooltip={tip("section_audience_level")} icon={Eye} iconColor="text-teal-400" iconBg="bg-teal-500/10" sectionRef="audience_level" onDiscuss={openDiscuss}>
              <ClassificationBadge label="Audience" value={r.audience_level.classification} confidence={r.audience_level.confidence} tooltip={tip("audience_level_label")} />
              <div className="mt-4 text-center mb-3">
                <span className="text-3xl font-bold text-teal-400">{r.audience_level.composite_score}</span>
                <span className="text-zinc-500"> / 100</span>
              </div>
              <WeightedDriversTable drivers={r.audience_level.drivers} driverTooltips={audienceDriverTips} />
            </SectionCard>

            <SectionCard title="Rarity Index" tooltip={tip("section_rarity_index")} icon={Sparkles} iconColor="text-yellow-400" iconBg="bg-yellow-500/10" sectionRef="rarity_index" onDiscuss={openDiscuss}>
              <ClassificationBadge label="Uniqueness" value={r.rarity_index.classification} confidence={r.rarity_index.confidence} tooltip={tip("uniqueness_label")} />
              <div className="mt-4 text-center mb-3">
                <span className="text-3xl font-bold text-yellow-400">{r.rarity_index.composite_score}</span>
                <span className="text-zinc-500"> / 100</span>
              </div>
              <WeightedDriversTable drivers={r.rarity_index.drivers} driverTooltips={rarityDriverTips} />
            </SectionCard>
          </div>
        </div>
      </div>
    </section>
  );
}
