import { useState } from "react";
import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

const GROWTH_PLAN_CONTENT = `
# Matt Aldrich — 2026 Sales Approach & Growth Plan

## 1. Purpose of This Plan

My intention for 2026 is to approach the year with organization, clarity, and a structured path for growth. This plan outlines the types of opportunities I aim to pursue, the relationships I want to strengthen, and the activities that help me stay consistent.

## 2. Opportunity Areas I Will Focus On

### Residential Opportunities
Residential losses have kept my pipeline active.

- **Typical Opportunity Value:** $350,000 – $500,000
- **General Goal:** Aim for 2–3 per month, understanding this will vary depending on conditions and availability.
- **Expected Contribution:** Flexible range: ~$10M–$15M annually (not a commitment — just an estimate based on historical patterns)

### Large Loss Opportunities (Commercial + Industrial Combined)
Commercial and industrial work represents an area of significant potential.

- **Typical Opportunity Ranges:**
  - Standard large loss: $750k – $2.5M
  - Higher-end or industrial: $3M – $10M+
- **General Goal:** Pursue 8–12 large-loss opportunities over the course of the year, knowing this depends on market conditions and availability.
- **Expected Contribution:** Flexible range: ~$20M–$30M annually (with the possibility of a larger loss if timing aligns)

### Mid-Size Commercial Opportunities
- **Range:** $1M–$1.5M
- **Contribution Estimate:** ~$2M–$4M annually

## 3. Total Estimated Range for 2026

Given the natural variability in claims, the year could reasonably fall into a broad production range.

A realistic outlook for 2026 based on my activity and opportunity flow would be:

**Expected Range: $45M – $60M**

This range accounts for:
- Seasonal changes
- Market factors
- Opportunity timing
- Variability in claim sizes
- Natural fluctuations in residential and commercial activity

This is intentionally wide so it reflects a realistic, responsible outlook.

## 4. How I Plan to Pursue Growth in 2026

### Key Areas of Focus
- Strengthening relationships with contractors, adjusters, and referral partners
- Increasing visibility with commercial and industrial contacts
- Maintaining consistent follow-up and communication
- Staying disciplined with activity even during slow periods
- Being present and available when unexpected opportunities arise

## 5. Quarterly Themes (Not Commitments)

### Q1 — Foundation & Pipeline Building
Focus on reestablishing relationships and identifying early opportunities.

### Q2 — Commercial Development
Increase outreach to commercial contacts and expand mid-size opportunities.

### Q3 — Seasonal Momentum
Leverage natural increases in residential and adjuster-driven referrals.

### Q4 — Closing Strong & Positioning for Next Year

---

## 6. Final Perspective

This plan reflects my intentions, focus areas, and strategic approach for 2026.

My goal is simple: Continue growing, deepen relationships, stay consistent, and be ready when opportunity shows up.

---

# Core Opportunity Targets (Detailed)

| Opportunity Type | Typical Value | Quarterly Target | Annual Target | Notes |
|-----------------|---------------|------------------|---------------|-------|
| Residential | $350k–$500k | 6–9 per quarter | 24–36 | Focus on high-value residential losses; adjust for seasonal trends |
| Mid-Size Commercial | $1M–$1.5M | 3 per quarter | 12 | Focus on local commercial businesses |
| Large Commercial/Industrial | $750k–$10M | 2–3 per quarter | 8–12 | Target high-value large loss opportunities |
| Religious Organizations | $1M+ | 2–5 per quarter | 8–20 | Large churches, temples, mosques, synagogues, ministries, retreat centers |

**Estimated Annual Contribution: $45M–$60M** (flexible range based on seasonal and market variability)

---

# Core Activities to Execute Each Quarter

### Opportunity Execution
- Residential, mid-size, large/industrial, and religious organization pursuits according to targets
- Pre-qualify and follow up consistently
- Track all opportunities in CRM; assign status (Hot, Warm, Cold)

### Networking & Relationship-Building
- **Life Styles Organization:** Attend starting March; engage and follow up with 2–3 contacts/month
- **Allen Chamber:** Attend events; aim for 2–3 meaningful conversations per month
- **Schools:** Attempt to schedule 1 large + 1 small school district quality meeting per month
- **Church Fires:** Attend all fires that meet strategic criteria (size, potential, alignment with target opportunity)
- **Target School-Industry Organization:** Gather info, attend events, and engage strategically with members
- **IIAD:** Join and participate to generate high-value referrals

### Pipeline & Pre-Loss Actions
- Maintain CRM tracking and follow-ups
- Conduct pre-loss preparation for residential, commercial, and religious targets
- Evaluate seasonal trends and adjust strategy
- Prioritize high-value opportunities

### Metrics & Accountability
- Track number of opportunities, meetings, and pipeline value monthly
- Conduct quarterly reviews: pipeline health, closed opportunities, networking effectiveness
- Adjust quarterly tactics as needed to ensure targets are met

---

# Monthly Expectations (Every Month)

### Opportunity Generation
- Residential: 2–3 new qualified leads
- Commercial: 1–2 solid opportunities
- Industrial: 1 potential large-loss contact
- Religious: 2–4 researched targets + 1–2 meetings/calls

### Networking & Relationships
- Life Styles Organization: 2 meaningful connections
- Allen Chamber: 2–3 high-value conversations
- IIAD or target org: 1 event/activity
- Schools: 2 district touches (meeting, email, call)
- Contractor/adjuster partners: 4–6 touches

### Fire Response
- Attend 100% of target-aligned church fires
- Attend select high-value commercial fires
- Attend residential fires in high-value ZIPs (case-by-case)

### CRM & Pipeline
- Add minimum 10 new contacts monthly
- Update all active opportunities weekly
- Monthly pipeline review & adjustments
- Monthly reporting on metrics and KPIs

---

# Weekly Cadence (Every Week)

### Prospecting & Outreach
- 15–20 outreach actions (calls, emails, texts, messages)
- 3–5 meetings (in-person or virtual)
- 3 follow-up sequences
- 1–2 pre-loss walkthroughs or site visits

### Relationship Maintenance
- 2 contractor touches
- 1 adjuster touch
- 1 school district follow-up
- 1 religious organization outreach sequence

### On-Site Opportunities
- Attend qualifying fires
- Conduct 1–2 route-building days weekly

### CRM Discipline
- 100% of opportunities updated
- Move opportunities through Hot/Warm/Cold

---

# Key Principles

1. **Consistency** — Every week, every month, every quarter — same disciplined actions.
2. **Quality Over Quantity** — Be selective about meetings, organizations, and opportunities.
3. **Metrics Drive Everything** — No guessing. All decisions come from pipeline, priority, and performance data.
4. **Seasonal Adjustment** — Push residential in summer, commercial year-round, religious whenever opportunities arise.
5. **Professional Compassion** — Especially for religious organizations and fire scenes.
`;

export function GrowthPlanDialog() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full hover:bg-primary/10"
          title="View 2026 Growth Plan"
        >
          <FileText className="h-4 w-4 text-primary" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-5 w-5 text-primary" />
            2026 Sales Approach & Growth Plan
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[70vh] px-6 pb-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {GROWTH_PLAN_CONTENT.split('\n').map((line, index) => {
              // Headers
              if (line.startsWith('# ') && !line.startsWith('## ') && !line.startsWith('### ')) {
                return (
                  <h1 key={index} className="text-2xl font-bold text-foreground mt-8 mb-4 first:mt-0">
                    {line.replace('# ', '')}
                  </h1>
                );
              }
              if (line.startsWith('## ')) {
                return (
                  <h2 key={index} className="text-xl font-semibold text-foreground mt-6 mb-3 border-b border-border pb-2">
                    {line.replace('## ', '')}
                  </h2>
                );
              }
              if (line.startsWith('### ')) {
                return (
                  <h3 key={index} className="text-lg font-medium text-foreground mt-4 mb-2">
                    {line.replace('### ', '')}
                  </h3>
                );
              }
              // Horizontal rule
              if (line.trim() === '---') {
                return <hr key={index} className="my-6 border-border" />;
              }
              // Bold text with **
              if (line.includes('**')) {
                const parts = line.split(/\*\*(.*?)\*\*/g);
                return (
                  <p key={index} className="text-muted-foreground mb-2">
                    {parts.map((part, i) => 
                      i % 2 === 1 ? <strong key={i} className="text-foreground">{part}</strong> : part
                    )}
                  </p>
                );
              }
              // List items
              if (line.startsWith('- ')) {
                return (
                  <li key={index} className="text-muted-foreground ml-4 mb-1 list-disc">
                    {line.replace('- ', '')}
                  </li>
                );
              }
              // Table rows (simplified)
              if (line.startsWith('|') && !line.includes('---')) {
                const cells = line.split('|').filter(c => c.trim());
                if (cells.length > 0) {
                  return (
                    <div key={index} className="grid grid-cols-5 gap-2 py-1 text-xs border-b border-border/50">
                      {cells.map((cell, i) => (
                        <span key={i} className={i === 0 ? "font-medium text-foreground" : "text-muted-foreground"}>
                          {cell.trim()}
                        </span>
                      ))}
                    </div>
                  );
                }
              }
              // Empty lines
              if (line.trim() === '') {
                return null;
              }
              // Regular paragraphs
              return (
                <p key={index} className="text-muted-foreground mb-2">
                  {line}
                </p>
              );
            })}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}