"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Search, BookOpen, Filter,
  ChevronDown, ChevronUp, Info, Sparkles,
  Calculator, AlertCircle,
} from "lucide-react";
import { GLOSSARY, GLOSSARY_CATEGORIES } from "@/lib/glossary";
import type { GlossaryEntry } from "@/lib/glossary";
import { seedGlossary, isGlossarySeeded } from "@/lib/firebase";

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  "Overall":               { bg: "bg-blue-500/5",    text: "text-blue-400",    border: "border-blue-500/20",    badge: "bg-blue-500/10" },
  "Core Decision Modules": { bg: "bg-purple-500/5",  text: "text-purple-400",  border: "border-purple-500/20",  badge: "bg-purple-500/10" },
  "Content Forensics":     { bg: "bg-red-500/5",     text: "text-red-400",     border: "border-red-500/20",     badge: "bg-red-500/10" },
  "Advanced Assessment":   { bg: "bg-amber-500/5",   text: "text-amber-400",   border: "border-amber-500/20",   badge: "bg-amber-500/10" },
  "Composition":           { bg: "bg-green-500/5",   text: "text-green-400",   border: "border-green-500/20",   badge: "bg-green-500/10" },
  "Bias Detection":        { bg: "bg-orange-500/5",  text: "text-orange-400",  border: "border-orange-500/20",  badge: "bg-orange-500/10" },
  "Key Findings":          { bg: "bg-yellow-500/5",  text: "text-yellow-400",  border: "border-yellow-500/20",  badge: "bg-yellow-500/10" },
  "Methodology":           { bg: "bg-cyan-500/5",    text: "text-cyan-400",    border: "border-cyan-500/20",    badge: "bg-cyan-500/10" },
};

function CategoryBadge({ category }: { category: string }) {
  const c = CATEGORY_COLORS[category] ?? CATEGORY_COLORS["Overall"];
  return (
    <span className={`inline-flex items-center rounded-full ${c.badge} ${c.text} border ${c.border} px-2.5 py-0.5 text-xs font-medium`}>
      {category}
    </span>
  );
}

function GlossaryRow({ entry, isExpanded, onToggle }: { entry: GlossaryEntry; isExpanded: boolean; onToggle: () => void }) {
  return (
    <div className={`border border-zinc-800 rounded-xl overflow-hidden transition-colors ${isExpanded ? "bg-zinc-900/80" : "bg-zinc-900/40 hover:bg-zinc-900/60"}`}>
      {/* Clickable header row */}
      <button
        onClick={onToggle}
        className="w-full px-5 py-4 flex items-center gap-4 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-sm font-semibold text-zinc-100">{entry.term}</h3>
            <CategoryBadge category={entry.category} />
          </div>
          {!isExpanded && (
            <p className="mt-1 text-xs text-zinc-500 line-clamp-1">{entry.meaning}</p>
          )}
        </div>
        <div className="shrink-0 text-zinc-600">
          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            {/* What it means */}
            <div className="rounded-lg bg-zinc-800/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-blue-400" />
                <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider">What It Means</h4>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{entry.meaning}</p>
            </div>

            {/* Why it's important */}
            <div className="rounded-lg bg-zinc-800/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-400" />
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Why It&apos;s Important</h4>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{entry.importance}</p>
            </div>

            {/* How it's calculated */}
            <div className="rounded-lg bg-zinc-800/50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4 text-emerald-400" />
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">How It&apos;s Calculated</h4>
              </div>
              <p className="text-sm text-zinc-300 leading-relaxed">{entry.calculation}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GlossaryPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedTerms, setExpandedTerms] = useState<Set<string>>(new Set());

  // Seed glossary to Firestore in background (idempotent)
  useEffect(() => {
    (async () => {
      try {
        const seeded = await isGlossarySeeded();
        if (!seeded) {
          await seedGlossary(GLOSSARY);
          console.log("Glossary seeded to Firestore");
        }
      } catch (err) {
        console.warn("Glossary seed skipped:", err);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    let items = GLOSSARY;
    if (activeCategory) {
      items = items.filter((e) => e.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(
        (e) =>
          e.term.toLowerCase().includes(q) ||
          e.meaning.toLowerCase().includes(q) ||
          e.importance.toLowerCase().includes(q) ||
          e.calculation.toLowerCase().includes(q) ||
          e.category.toLowerCase().includes(q)
      );
    }
    return items;
  }, [search, activeCategory]);

  const toggleTerm = (term: string) => {
    setExpandedTerms((prev) => {
      const next = new Set(prev);
      if (next.has(term)) next.delete(term);
      else next.add(term);
      return next;
    });
  };

  const expandAll = () => setExpandedTerms(new Set(filtered.map((e) => e.term)));
  const collapseAll = () => setExpandedTerms(new Set());

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of GLOSSARY) {
      counts[e.category] = (counts[e.category] ?? 0) + 1;
    }
    return counts;
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* ── Header ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-200 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-2 text-sm text-zinc-500">
            <BookOpen className="h-4 w-4" />
            <span>{GLOSSARY.length} terms</span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        {/* ── Title ─────────────────────────────────────────────── */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 mb-4">
            <BookOpen className="h-4 w-4 text-blue-400" />
            <span className="text-sm text-blue-400 font-medium">Assessment Rules</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3">
            Assessment Rules & Methodology
          </h1>
          <p className="text-zinc-400 max-w-2xl mx-auto">
            A comprehensive catalogue of every metric, score, and label used in our analysis.
            Learn what each one means, why it matters, and exactly how it&apos;s calculated.
          </p>
        </div>

        {/* ── Search & Filters ──────────────────────────────────── */}
        <div className="mb-8 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search terms, metrics, labels..."
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900/60 pl-11 pr-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/30 transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-zinc-600 shrink-0" />
            <button
              onClick={() => setActiveCategory(null)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                activeCategory === null
                  ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
                  : "bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:text-zinc-300"
              }`}
            >
              All ({GLOSSARY.length})
            </button>
            {GLOSSARY_CATEGORIES.map((cat) => {
              const c = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS["Overall"];
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(isActive ? null : cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors border ${
                    isActive
                      ? `${c.badge} ${c.text} ${c.border}`
                      : "bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:text-zinc-300"
                  }`}
                >
                  {cat} ({categoryCounts[cat] ?? 0})
                </button>
              );
            })}
          </div>

          {/* Expand/Collapse controls */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-zinc-500">
              Showing <span className="text-zinc-300 font-medium">{filtered.length}</span> of {GLOSSARY.length} terms
              {search && <span className="ml-1">matching &ldquo;{search}&rdquo;</span>}
            </p>
            <div className="flex items-center gap-2">
              <button onClick={expandAll} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
                <ChevronDown className="h-3 w-3" /> Expand All
              </button>
              <span className="text-zinc-700">|</span>
              <button onClick={collapseAll} className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center gap-1">
                <ChevronUp className="h-3 w-3" /> Collapse All
              </button>
            </div>
          </div>
        </div>

        {/* ── Glossary Table ────────────────────────────────────── */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <Sparkles className="mx-auto h-10 w-10 text-zinc-700 mb-4" />
            <p className="text-zinc-500">No matching terms found.</p>
            <button
              onClick={() => { setSearch(""); setActiveCategory(null); }}
              className="mt-3 text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((entry) => (
              <GlossaryRow
                key={entry.term}
                entry={entry}
                isExpanded={expandedTerms.has(entry.term)}
                onToggle={() => toggleTerm(entry.term)}
              />
            ))}
          </div>
        )}

        {/* ── Footer note ───────────────────────────────────────── */}
        <div className="mt-12 rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 text-center">
          <p className="text-sm text-zinc-500">
            All scores use the <span className="text-zinc-300 font-medium">Weighted Composite Formula</span>:
            Score = Σ(rating × weight) / n. Each module&apos;s drivers are scored 1-10 by AI analysis
            and combined using predefined weights that sum to 1.0.
          </p>
          <p className="mt-3 text-xs text-zinc-500">
            Want to build such an agentic app? Contact{" "}
            <a href="mailto:contactbhasker7483@gmail.com" className="text-blue-400 hover:text-blue-300 underline">contactbhasker7483@gmail.com</a>
          </p>
        </div>
      </main>
    </div>
  );
}
