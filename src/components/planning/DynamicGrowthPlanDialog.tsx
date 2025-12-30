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

// Opportunity profiles based on role/focus
const OPPORTUNITY_PROFILES = {
  commercial_heavy: {
    residential: { min: 0.15, max: 0.20, typical: "$350k–$500k" },
    midCommercial: { min: 0.15, max: 0.20, typical: "$1M–$1.5M" },
    largeCommercial: { min: 0.35, max: 0.40, typical: "$750k–$10M" },
    religious: { min: 0.25, max: 0.30, typical: "$1M+" },
  },
  residential_heavy: {
    residential: { min: 0.50, max: 0.60, typical: "$200k–$400k" },
    midCommercial: { min: 0.20, max: 0.25, typical: "$500k–$1M" },
    largeCommercial: { min: 0.10, max: 0.15, typical: "$500k–$2M" },
    religious: { min: 0.05, max: 0.10, typical: "$500k–$1M" },
  },
  team_blended: {
    residential: { min: 0.30, max: 0.40, typical: "$250k–$450k" },
    midCommercial: { min: 0.20, max: 0.25, typical: "$750k–$1.25M" },
    largeCommercial: { min: 0.20, max: 0.25, typical: "$750k–$5M" },
    religious: { min: 0.15, max: 0.20, typical: "$750k–$1.5M" },
  },
};

export interface TeamMemberPlanData {
  id: string;
  name: string;
  targetRevenue: number;
  targetDeals: number;
  commissionPercent: number;
  selectedScenario: string;
}

interface DynamicGrowthPlanDialogProps {
  salespersonName: string;
  salespersonId?: string;
  targetRevenue: number;
  targetDeals: number;
  selectedScenarioId: string;
  avgFeePercent: number;
  commissionPercent: number;
  isTeamView?: boolean;
  teamMemberCount?: number;
  teamMemberPlans?: TeamMemberPlanData[];
}

export function DynamicGrowthPlanDialog({
  salespersonName,
  salespersonId,
  targetRevenue,
  targetDeals,
  selectedScenarioId,
  avgFeePercent,
  commissionPercent,
  isTeamView = false,
  teamMemberCount = 1,
  teamMemberPlans = [],
}: DynamicGrowthPlanDialogProps) {
  const [open, setOpen] = useState(false);

  // Determine profile based on name/role
  const getProfile = () => {
    if (isTeamView) return OPPORTUNITY_PROFILES.team_blended;
    if (salespersonName.toLowerCase().includes("matt")) {
      return OPPORTUNITY_PROFILES.commercial_heavy;
    }
    return OPPORTUNITY_PROFILES.residential_heavy;
  };

  const profile = getProfile();
  const isCommercialHeavy = salespersonName.toLowerCase().includes("matt");

  // Calculate opportunity contributions based on profile and target
  const getOpportunityBreakdown = () => {
    const residential = {
      min: Math.round(targetRevenue * profile.residential.min),
      max: Math.round(targetRevenue * profile.residential.max),
      dealsMin: Math.round(targetDeals * profile.residential.min),
      dealsMax: Math.round(targetDeals * profile.residential.max),
      typical: profile.residential.typical,
    };
    const midCommercial = {
      min: Math.round(targetRevenue * profile.midCommercial.min),
      max: Math.round(targetRevenue * profile.midCommercial.max),
      dealsMin: Math.round(targetDeals * profile.midCommercial.min),
      dealsMax: Math.round(targetDeals * profile.midCommercial.max),
      typical: profile.midCommercial.typical,
    };
    const largeCommercial = {
      min: Math.round(targetRevenue * profile.largeCommercial.min),
      max: Math.round(targetRevenue * profile.largeCommercial.max),
      dealsMin: Math.round(targetDeals * profile.largeCommercial.min),
      dealsMax: Math.round(targetDeals * profile.largeCommercial.max),
      typical: profile.largeCommercial.typical,
    };
    const religious = {
      min: Math.round(targetRevenue * profile.religious.min),
      max: Math.round(targetRevenue * profile.religious.max),
      dealsMin: Math.round(targetDeals * profile.religious.min),
      dealsMax: Math.round(targetDeals * profile.religious.max),
      typical: profile.religious.typical,
    };
    return { residential, midCommercial, largeCommercial, religious };
  };

  const breakdown = getOpportunityBreakdown();

  const formatCurrency = (value: number) => {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value}`;
  };

  // Analyze team member path distribution for team view
  const getTeamPathAnalysis = () => {
    if (!isTeamView || teamMemberPlans.length === 0) return null;
    
    const pathCounts: Record<string, number> = {};
    const pathMembers: Record<string, string[]> = {};
    
    teamMemberPlans.forEach(member => {
      const scenario = member.selectedScenario || 'balanced';
      pathCounts[scenario] = (pathCounts[scenario] || 0) + 1;
      if (!pathMembers[scenario]) pathMembers[scenario] = [];
      pathMembers[scenario].push(member.name);
    });
    
    return { pathCounts, pathMembers };
  };
  
  const teamPathAnalysis = getTeamPathAnalysis();
  
  // Get combined team approach description
  const getTeamApproachDescription = () => {
    if (!teamPathAnalysis) return null;
    
    const { pathCounts, pathMembers } = teamPathAnalysis;
    const paths = Object.keys(pathCounts);
    
    if (paths.length === 1) {
      // All members on same path
      const path = paths[0];
      const pathName = path === 'conservative' ? 'Conservative/Volume' : 
                       path === 'commercial-heavy' ? 'Commercial Heavy/Value' : 'Balanced';
      return {
        summary: `All ${teamMemberPlans.length} team members are aligned on the ${pathName} approach`,
        description: `The team has unified around a single strategic direction, enabling coordinated execution and shared priorities across all opportunity types.`
      };
    }
    
    // Multiple paths - describe the blend
    const pathDescriptions = paths.map(path => {
      const members = pathMembers[path];
      const isDirectorPath = members.some(name => 
        name.toLowerCase().includes('matt') || name.toLowerCase().includes('aldrich')
      );
      
      let pathName: string;
      if (path === 'conservative') {
        pathName = isDirectorPath ? 'Conservative' : 'Volume';
      } else if (path === 'commercial-heavy') {
        pathName = isDirectorPath ? 'Commercial Heavy' : 'Value';
      } else {
        pathName = isDirectorPath ? 'Balanced' : 'Volume Balanced';
      }
      
      return { path, pathName, members, count: pathCounts[path] };
    });
    
    const summaryParts = pathDescriptions.map(p => `${p.members.join(' & ')} (${p.pathName})`);
    
    return {
      summary: `Blended approach: ${summaryParts.join(', ')}`,
      description: `Our team combines complementary strategies to maximize coverage and opportunity capture. This diversified approach balances risk while allowing each member to leverage their strengths and market focus.`
    };
  };
  
  const teamApproach = getTeamApproachDescription();

  // Get scenario-specific focus based on role
  const getScenarioFocus = () => {
    if (isTeamView && teamApproach) {
      return teamApproach.description;
    }
    if (isCommercialHeavy) {
      switch (selectedScenarioId) {
        case "conservative":
          return "steady deal flow with consistent weekly rhythm";
        case "commercial-heavy":
          return "fewer, larger commercial opportunities";
        case "balanced":
        default:
          return "balanced mix across all opportunity types";
      }
    } else {
      // Rep-specific scenario focus
      switch (selectedScenarioId) {
        case "conservative":
          return "high-activity approach with consistent residential volume";
        case "commercial-heavy":
          return "quality over quantity, focusing on higher-value opportunities";
        case "balanced":
        default:
          return "steady residential growth with selective commercial pursuit";
      }
    }
  };

  // Get scenario display name based on role
  const getScenarioDisplayName = () => {
    if (isTeamView && teamApproach) {
      return teamApproach.summary;
    }
    if (isCommercialHeavy) {
      switch (selectedScenarioId) {
        case "conservative":
          return "Conservative";
        case "commercial-heavy":
          return "Commercial & Industrial Heavy";
        case "balanced":
        default:
          return "Balanced";
      }
    } else {
      // Rep-specific scenario names
      switch (selectedScenarioId) {
        case "conservative":
          return "Volume";
        case "commercial-heavy":
          return "Value";
        case "balanced":
        default:
          return "Volume Balanced";
      }
    }
  };

  // Get quarterly themes based on profile
  const getQuarterlyThemes = () => {
    if (isCommercialHeavy || isTeamView) {
      return {
        q1: { name: "Foundation & Pipeline Building", focus: "Reestablish relationships and identify early opportunities" },
        q2: { name: "Commercial Development", focus: "Increase outreach to commercial contacts and expand mid-size opportunities" },
        q3: { name: "Seasonal Momentum", focus: "Leverage natural increases in residential and adjuster-driven referrals" },
        q4: { name: "Closing Strong", focus: "Close open opportunities and position for next year" },
      };
    }
    return {
      q1: { name: "Relationship Renewal", focus: "Reconnect with existing referral sources and close Q4 carryovers" },
      q2: { name: "Volume Building", focus: "Focus on consistent residential deal flow and introducements to commercial" },
      q3: { name: "Peak Season", focus: "Maximize summer storm season and high-activity periods" },
      q4: { name: "Year-End Push", focus: "Close strong and set up pipeline for next year" },
    };
  };
  
  // Get member profile type for team view display
  const getMemberProfileType = (memberName: string) => {
    if (memberName.toLowerCase().includes('matt') || memberName.toLowerCase().includes('aldrich')) {
      return 'Commercial & Industrial Focus';
    }
    return 'Residential Focus';
  };
  
  // Get member scenario display name
  const getMemberScenarioName = (memberName: string, scenarioId: string) => {
    const isDirectorMember = memberName.toLowerCase().includes('matt') || memberName.toLowerCase().includes('aldrich');
    if (isDirectorMember) {
      switch (scenarioId) {
        case 'conservative': return 'Conservative';
        case 'commercial-heavy': return 'Commercial Heavy';
        case 'balanced':
        default: return 'Balanced';
      }
    } else {
      switch (scenarioId) {
        case 'conservative': return 'Volume';
        case 'commercial-heavy': return 'Value';
        case 'balanced':
        default: return 'Volume Balanced';
      }
    }
  };

  const quarterlyThemes = getQuarterlyThemes();

  // Calculate quarterly deal targets
  const quarterlyDeals = Math.round(targetDeals / 4);
  const quarterlyRevenue = targetRevenue / 4;

  const documentTitle = isTeamView 
    ? `Sales Team — 2026 Combined Growth Plan` 
    : `${salespersonName} — 2026 Sales Approach & Growth Plan`;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="gap-2 border-primary/30 hover:bg-primary/10"
        >
          <FileText className="h-4 w-4 text-primary" />
          View Growth Plan
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
            {/* Document Title */}
            <h1 className="text-2xl font-bold text-foreground mt-4 mb-6">{documentTitle}</h1>

            {/* Purpose Section */}
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3 border-b border-border pb-2">
              1. Purpose of This Plan
            </h2>
            <p className="text-muted-foreground mb-4">
              {isTeamView 
                ? `This document outlines the combined 2026 growth strategy for our ${teamMemberCount}-member sales team. The team's collective target of ${formatCurrency(targetRevenue)} reflects our commitment to structured growth with clear opportunity distribution across all team members.`
                : `My intention for 2026 is to approach the year with organization, clarity, and a structured path for growth. This plan outlines the types of opportunities I aim to pursue, the relationships I want to strengthen, and the activities that help me stay consistent.`
              }
            </p>
            {isTeamView && teamApproach ? (
              <div className="mb-4">
                <p className="text-muted-foreground mb-2">
                  <strong className="text-foreground">Team Approach:</strong> {getScenarioDisplayName()}
                </p>
                <p className="text-muted-foreground">
                  {getScenarioFocus()}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground mb-4">
                <strong className="text-foreground">Selected Approach:</strong> This plan follows the <strong className="text-foreground">{getScenarioDisplayName()}</strong> path, focusing on {getScenarioFocus()}.
              </p>
            )}

            {/* Opportunity Areas */}
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3 border-b border-border pb-2">
              2. Opportunity Areas {isTeamView ? "We" : "I"} Will Focus On
            </h2>

            {/* Residential */}
            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Residential Opportunities</h3>
            <p className="text-muted-foreground mb-2">
              {isCommercialHeavy 
                ? "Residential losses help maintain pipeline activity while pursuing larger opportunities."
                : "Residential losses form the foundation of our deal flow and provide consistent activity throughout the year."
              }
            </p>
            <ul className="list-disc ml-4 space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Typical Opportunity Value:</strong> {breakdown.residential.typical}</li>
              <li><strong className="text-foreground">Deal Target:</strong> {breakdown.residential.dealsMin}–{breakdown.residential.dealsMax} annually ({Math.round(breakdown.residential.dealsMin / 4)}–{Math.round(breakdown.residential.dealsMax / 4)} per quarter)</li>
              <li><strong className="text-foreground">Expected Contribution:</strong> {formatCurrency(breakdown.residential.min)}–{formatCurrency(breakdown.residential.max)}</li>
            </ul>

            {/* Mid-Size Commercial */}
            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Mid-Size Commercial Opportunities</h3>
            <p className="text-muted-foreground mb-2">
              {isCommercialHeavy 
                ? "Focus on local commercial businesses including schools, offices, restaurants, retail, and multi-tenant properties."
                : "Mid-size commercial opportunities provide growth beyond residential with moderate complexity."
              }
            </p>
            <ul className="list-disc ml-4 space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Typical Range:</strong> {breakdown.midCommercial.typical}</li>
              <li><strong className="text-foreground">Deal Target:</strong> {breakdown.midCommercial.dealsMin}–{breakdown.midCommercial.dealsMax} annually</li>
              <li><strong className="text-foreground">Expected Contribution:</strong> {formatCurrency(breakdown.midCommercial.min)}–{formatCurrency(breakdown.midCommercial.max)}</li>
            </ul>

            {/* Large Commercial/Industrial */}
            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Large Commercial & Industrial Opportunities</h3>
            <p className="text-muted-foreground mb-2">
              {isCommercialHeavy 
                ? "Commercial and industrial work represents an area of significant potential. Target manufacturing, warehouses, automotive, distribution, and regional chains."
                : "Large commercial opportunities offer significant upside when available and aligned with expertise."
              }
            </p>
            <ul className="list-disc ml-4 space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Typical Range:</strong> {breakdown.largeCommercial.typical}</li>
              <li><strong className="text-foreground">Deal Target:</strong> {breakdown.largeCommercial.dealsMin}–{breakdown.largeCommercial.dealsMax} annually</li>
              <li><strong className="text-foreground">Expected Contribution:</strong> {formatCurrency(breakdown.largeCommercial.min)}–{formatCurrency(breakdown.largeCommercial.max)}</li>
            </ul>

            {/* Religious Organizations */}
            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Religious Organizations</h3>
            <p className="text-muted-foreground mb-2">
              {isCommercialHeavy 
                ? "Large churches, temples, mosques, synagogues, ministries, and retreat centers represent a significant opportunity category requiring professional compassion."
                : "Religious organizations can provide meaningful opportunities when aligned with our approach."
              }
            </p>
            <ul className="list-disc ml-4 space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Typical Value:</strong> {breakdown.religious.typical}</li>
              <li><strong className="text-foreground">Deal Target:</strong> {breakdown.religious.dealsMin}–{breakdown.religious.dealsMax} annually</li>
              <li><strong className="text-foreground">Expected Contribution:</strong> {formatCurrency(breakdown.religious.min)}–{formatCurrency(breakdown.religious.max)}</li>
            </ul>

            <hr className="my-6 border-border" />

            {/* Total Estimated Range */}
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3 border-b border-border pb-2">
              3. Total Estimated Range for 2026
            </h2>
            <p className="text-muted-foreground mb-4">
              Given the natural variability in claims, the year could reasonably fall into a broad production range.
            </p>
            <p className="text-lg mb-4">
              <strong className="text-foreground">Expected Range: {formatCurrency(targetRevenue * 0.85)} – {formatCurrency(targetRevenue * 1.15)}</strong>
            </p>
            <p className="text-muted-foreground mb-4">
              <strong className="text-foreground">Target: {formatCurrency(targetRevenue)}</strong> with <strong className="text-foreground">{targetDeals} deals</strong> at approximately <strong className="text-foreground">{avgFeePercent}% average fee</strong>.
            </p>
            <p className="text-muted-foreground mb-4">
              Projected Commission: <strong className="text-foreground">{formatCurrency(targetRevenue * (avgFeePercent / 100) * (commissionPercent / 100))}</strong> at {commissionPercent}% commission rate.
            </p>

            <hr className="my-6 border-border" />

            {/* Team Member Overview - Only shown in team view */}
            {isTeamView && teamMemberPlans.length > 0 && (
              <>
                <h2 className="text-xl font-semibold text-foreground mt-6 mb-3 border-b border-border pb-2">
                  4. Team Member Contributions
                </h2>
                <p className="text-muted-foreground mb-4">
                  Our team's collective target is achieved through the combined contributions of each member, with strategies tailored to their individual strengths and market focus.
                </p>
                
                <div className="space-y-4 mb-6">
                  {teamMemberPlans.map((member, index) => {
                    const memberProfileType = getMemberProfileType(member.name);
                    const memberScenarioName = getMemberScenarioName(member.name, member.selectedScenario);
                    const memberQuarterlyRevenue = member.targetRevenue / 4;
                    const memberQuarterlyDeals = Math.round(member.targetDeals / 4);
                    const memberCommission = member.targetRevenue * (avgFeePercent / 100) * (member.commissionPercent / 100);
                    const contributionPercent = targetRevenue > 0 ? Math.round((member.targetRevenue / targetRevenue) * 100) : 0;
                    
                    return (
                      <div key={member.id} className="p-4 rounded-lg border border-border bg-secondary/20">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{member.name}</h3>
                          <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                            {contributionPercent}% of Team Target
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          <strong className="text-foreground">{memberProfileType}</strong> • {memberScenarioName} Path
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">Target Revenue</p>
                            <p className="font-semibold text-foreground">{formatCurrency(member.targetRevenue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Target Deals</p>
                            <p className="font-semibold text-foreground">{member.targetDeals}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Quarterly Pace</p>
                            <p className="font-semibold text-foreground">{memberQuarterlyDeals} deals / {formatCurrency(memberQuarterlyRevenue)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Est. Commission</p>
                            <p className="font-semibold text-foreground">{formatCurrency(memberCommission)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                <hr className="my-6 border-border" />
              </>
            )}

            {/* Quarterly Themes */}
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3 border-b border-border pb-2">
              {isTeamView && teamMemberPlans.length > 0 ? '5' : '4'}. Quarterly Themes
            </h2>

            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Q1 — {quarterlyThemes.q1.name}</h3>
            <p className="text-muted-foreground mb-2">{quarterlyThemes.q1.focus}</p>
            <p className="text-sm text-muted-foreground mb-4">Target: ~{quarterlyDeals} deals | ~{formatCurrency(quarterlyRevenue)}</p>

            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Q2 — {quarterlyThemes.q2.name}</h3>
            <p className="text-muted-foreground mb-2">{quarterlyThemes.q2.focus}</p>
            <p className="text-sm text-muted-foreground mb-4">Target: ~{quarterlyDeals} deals | ~{formatCurrency(quarterlyRevenue)}</p>

            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Q3 — {quarterlyThemes.q3.name}</h3>
            <p className="text-muted-foreground mb-2">{quarterlyThemes.q3.focus}</p>
            <p className="text-sm text-muted-foreground mb-4">Target: ~{quarterlyDeals} deals | ~{formatCurrency(quarterlyRevenue)}</p>

            <h3 className="text-lg font-medium text-foreground mt-4 mb-2">Q4 — {quarterlyThemes.q4.name}</h3>
            <p className="text-muted-foreground mb-2">{quarterlyThemes.q4.focus}</p>
            <p className="text-sm text-muted-foreground mb-4">Target: ~{quarterlyDeals} deals | ~{formatCurrency(quarterlyRevenue)}</p>

            <hr className="my-6 border-border" />

            {/* Core Targets Table */}
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3 border-b border-border pb-2">
              {isTeamView && teamMemberPlans.length > 0 ? '6' : '5'}. Core Opportunity Targets
            </h2>
            <div className="overflow-x-auto">
              <div className="grid grid-cols-5 gap-2 py-2 text-xs border-b border-border font-medium text-foreground">
                <span>Opportunity Type</span>
                <span>Typical Value</span>
                <span>Quarterly</span>
                <span>Annual</span>
                <span>Contribution</span>
              </div>
              <div className="grid grid-cols-5 gap-2 py-2 text-xs border-b border-border/50">
                <span className="font-medium text-foreground">Residential</span>
                <span className="text-muted-foreground">{breakdown.residential.typical}</span>
                <span className="text-muted-foreground">{Math.round(breakdown.residential.dealsMin / 4)}–{Math.round(breakdown.residential.dealsMax / 4)}</span>
                <span className="text-muted-foreground">{breakdown.residential.dealsMin}–{breakdown.residential.dealsMax}</span>
                <span className="text-muted-foreground">{formatCurrency(breakdown.residential.min)}–{formatCurrency(breakdown.residential.max)}</span>
              </div>
              <div className="grid grid-cols-5 gap-2 py-2 text-xs border-b border-border/50">
                <span className="font-medium text-foreground">Mid-Size Commercial</span>
                <span className="text-muted-foreground">{breakdown.midCommercial.typical}</span>
                <span className="text-muted-foreground">{Math.round(breakdown.midCommercial.dealsMin / 4)}–{Math.round(breakdown.midCommercial.dealsMax / 4)}</span>
                <span className="text-muted-foreground">{breakdown.midCommercial.dealsMin}–{breakdown.midCommercial.dealsMax}</span>
                <span className="text-muted-foreground">{formatCurrency(breakdown.midCommercial.min)}–{formatCurrency(breakdown.midCommercial.max)}</span>
              </div>
              <div className="grid grid-cols-5 gap-2 py-2 text-xs border-b border-border/50">
                <span className="font-medium text-foreground">Large Commercial/Industrial</span>
                <span className="text-muted-foreground">{breakdown.largeCommercial.typical}</span>
                <span className="text-muted-foreground">{Math.round(breakdown.largeCommercial.dealsMin / 4)}–{Math.round(breakdown.largeCommercial.dealsMax / 4)}</span>
                <span className="text-muted-foreground">{breakdown.largeCommercial.dealsMin}–{breakdown.largeCommercial.dealsMax}</span>
                <span className="text-muted-foreground">{formatCurrency(breakdown.largeCommercial.min)}–{formatCurrency(breakdown.largeCommercial.max)}</span>
              </div>
              <div className="grid grid-cols-5 gap-2 py-2 text-xs border-b border-border/50">
                <span className="font-medium text-foreground">Religious Organizations</span>
                <span className="text-muted-foreground">{breakdown.religious.typical}</span>
                <span className="text-muted-foreground">{Math.round(breakdown.religious.dealsMin / 4)}–{Math.round(breakdown.religious.dealsMax / 4)}</span>
                <span className="text-muted-foreground">{breakdown.religious.dealsMin}–{breakdown.religious.dealsMax}</span>
                <span className="text-muted-foreground">{formatCurrency(breakdown.religious.min)}–{formatCurrency(breakdown.religious.max)}</span>
              </div>
            </div>

            <hr className="my-6 border-border" />

            {/* Key Principles */}
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3 border-b border-border pb-2">
              {isTeamView && teamMemberPlans.length > 0 ? '7' : '6'}. Key Principles
            </h2>
            <ul className="list-disc ml-4 space-y-2 text-muted-foreground">
              <li><strong className="text-foreground">Consistency</strong> — Every week, every month, every quarter — same disciplined actions.</li>
              <li><strong className="text-foreground">Quality Over Quantity</strong> — Be selective about meetings, organizations, and opportunities.</li>
              <li><strong className="text-foreground">Metrics Drive Everything</strong> — No guessing. All decisions come from pipeline, priority, and performance data.</li>
              <li><strong className="text-foreground">Seasonal Adjustment</strong> — Push residential in summer, commercial year-round, religious whenever opportunities arise.</li>
              <li><strong className="text-foreground">Professional Compassion</strong> — Especially for religious organizations and fire scenes.</li>
            </ul>

            <hr className="my-6 border-border" />

            {/* Final Perspective */}
            <h2 className="text-xl font-semibold text-foreground mt-6 mb-3 border-b border-border pb-2">
              {isTeamView && teamMemberPlans.length > 0 ? '8' : '7'}. Final Perspective
            </h2>
            <p className="text-muted-foreground mb-4">
              {isTeamView 
                ? `This plan reflects our team's combined intentions, focus areas, and strategic approach for 2026. Our collective goal is to continue growing, deepen relationships, stay consistent, and be ready when opportunity shows up.`
                : `This plan reflects my intentions, focus areas, and strategic approach for 2026. My goal is simple: Continue growing, deepen relationships, stay consistent, and be ready when opportunity shows up.`
              }
            </p>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
