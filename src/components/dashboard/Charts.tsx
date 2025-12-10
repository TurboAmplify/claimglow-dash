import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { AdjusterSummary, OfficeSummary, Claim } from "@/types/claims";
import { useMemo } from "react";
import { format } from "date-fns";

const COLORS = {
  primary: "hsl(172, 66%, 50%)",
  accent: "hsl(265, 89%, 70%)",
  success: "hsl(142, 76%, 45%)",
  destructive: "hsl(0, 84%, 60%)",
  muted: "hsl(222, 47%, 25%)",
};

interface AdjusterBarChartProps {
  data: AdjusterSummary[];
}

export function AdjusterBarChart({ data }: AdjusterBarChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      name: d.adjuster.split(" ")[0],
      fullName: d.adjuster,
      avgChange: Number(d.avgPercentChange.toFixed(1)),
      claims: d.totalClaims,
    }));
  }, [data]);

  return (
    <div className="chart-container animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Average % Change by Adjuster
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.muted} opacity={0.3} />
          <XAxis
            dataKey="name"
            tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
            axisLine={{ stroke: COLORS.muted }}
          />
          <YAxis
            tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
            axisLine={{ stroke: COLORS.muted }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 47%, 10%)",
              border: "1px solid hsl(222, 47%, 20%)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
            labelStyle={{ color: "hsl(210, 40%, 98%)" }}
            formatter={(value: number, name: string, props: any) => [
              `${value}%`,
              `${props.payload.fullName}`,
            ]}
          />
          <Bar
            dataKey="avgChange"
            radius={[8, 8, 0, 0]}
            fill={COLORS.primary}
          >
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.avgChange >= 0 ? COLORS.success : COLORS.destructive}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface TrendLineChartProps {
  claims: Claim[];
}

export function TrendLineChart({ claims }: TrendLineChartProps) {
  const chartData = useMemo(() => {
    const sorted = [...claims].sort(
      (a, b) =>
        new Date(a.date_signed || 0).getTime() -
        new Date(b.date_signed || 0).getTime()
    );

    const byMonth = sorted.reduce((acc, claim) => {
      if (!claim.date_signed) return acc;
      const month = format(new Date(claim.date_signed), "MMM");
      if (!acc[month]) {
        acc[month] = { original: 0, revised: 0, count: 0 };
      }
      acc[month].original += claim.estimate_of_loss;
      acc[month].revised += claim.revised_estimate_of_loss;
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, { original: number; revised: number; count: number }>);

    return Object.entries(byMonth).map(([month, data]) => ({
      month,
      original: Math.round(data.original / 1000),
      revised: Math.round(data.revised / 1000),
    }));
  }, [claims]);

  return (
    <div className="chart-container animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Estimate Trends (in $K)
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.muted} opacity={0.3} />
          <XAxis
            dataKey="month"
            tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
            axisLine={{ stroke: COLORS.muted }}
          />
          <YAxis
            tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
            axisLine={{ stroke: COLORS.muted }}
            tickFormatter={(value) => `$${value}K`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 47%, 10%)",
              border: "1px solid hsl(222, 47%, 20%)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
            labelStyle={{ color: "hsl(210, 40%, 98%)" }}
            formatter={(value: number) => [`$${value}K`]}
          />
          <Line
            type="monotone"
            dataKey="original"
            stroke={COLORS.muted}
            strokeWidth={2}
            dot={{ fill: COLORS.muted, strokeWidth: 0, r: 4 }}
            name="Original"
          />
          <Line
            type="monotone"
            dataKey="revised"
            stroke={COLORS.primary}
            strokeWidth={3}
            dot={{ fill: COLORS.primary, strokeWidth: 0, r: 5 }}
            name="Revised"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface OfficeComparisonChartProps {
  data: OfficeSummary[];
}

export function OfficeComparisonChart({ data }: OfficeComparisonChartProps) {
  const chartData = useMemo(() => {
    return data.map((d) => ({
      name: d.office,
      claims: d.totalClaims,
      adjusters: d.totalAdjusters,
    }));
  }, [data]);

  const pieData = useMemo(() => {
    return data.map((d, i) => ({
      name: d.office,
      value: d.totalClaims,
      color: [COLORS.primary, COLORS.accent, COLORS.success, COLORS.destructive][i % 4],
    }));
  }, [data]);

  return (
    <div className="chart-container animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Claims by Office
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={4}
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(222, 47%, 10%)",
              border: "1px solid hsl(222, 47%, 20%)",
              borderRadius: "12px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
            }}
            labelStyle={{ color: "hsl(210, 40%, 98%)" }}
            formatter={(value: number, name: string) => [`${value} claims`, name]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-4 mt-4">
        {pieData.map((entry) => (
          <div key={entry.name} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-muted-foreground">{entry.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
