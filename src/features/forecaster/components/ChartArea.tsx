import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  ReferenceLine 
} from "recharts";
import { YearProjection } from "../../../types";

interface ChartAreaProps {
  projections: YearProjection[];
  currencySymbol: string;
  fireTarget: number;
  fireAchievedYear: number | null;
  adjustForInflation: boolean;
}

export default function ChartArea({
  projections,
  currencySymbol,
  fireTarget,
  fireAchievedYear,
  adjustForInflation,
}: ChartAreaProps) {
  
  // Format long numbers into readable abbreviations (e.g. $1.2M, $500K)
  const formatCurrencyAbbrev = (value: number) => {
    if (value >= 1_000_000_000) {
      return `${currencySymbol}${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (value >= 1_000_000) {
      return `${currencySymbol}${(value / 1_000_000).toFixed(1)}M`;
    }
    if (value >= 1_000) {
      return `${currencySymbol}${(value / 1_000).toFixed(0)}K`;
    }
    return `${currencySymbol}${value}`;
  };

  const formatCurrencyFull = (value: number) => {
    return `${currencySymbol}${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl" id="wealth-chart-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium tracking-tight text-white mb-1" id="chart-heading">
            Wealth Saturation Curve
          </h3>
          <p className="text-xs text-slate-400">
            Comparing nominal capital vs. real purchasing power adjusted for local inflation.
          </p>
        </div>
        <div className="mt-3 sm:mt-0 flex gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-indigo-500 inline-block" />
            Nominal Net Worth
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            Inflation Adjusted (Real)
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            Cumulative Principal
          </div>
        </div>
      </div>

      <div className="h-[380px] w-full" id="recharts-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={projections}
            margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
          >
            <defs>
              <linearGradient id="colorNominal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15}/>
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="age" 
              stroke="#64748b" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={(age) => `Age ${age}`}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
              tickFormatter={formatCurrencyAbbrev}
              width={65}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#334155",
                borderRadius: "8px",
                color: "#f8fafc",
                fontSize: "12px",
                fontFamily: "monospace",
              }}
              formatter={(value: any, name: string) => {
                const num = Number(value);
                if (name === "nominalWealth") return [formatCurrencyFull(num), "Nominal Wealth"];
                if (name === "realWealth") return [formatCurrencyFull(num), "Real Purchasing Power"];
                if (name === "cumulativeSavings") return [formatCurrencyFull(num), "Accumulated Principal"];
                return [formatCurrencyFull(num), name];
              }}
              labelFormatter={(label) => `Age ${label}`}
            />
            <Area 
              type="monotone" 
              dataKey="nominalWealth" 
              stroke="#6366f1" 
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorNominal)" 
              name="nominalWealth"
            />
            <Area 
              type="monotone" 
              dataKey="realWealth" 
              stroke="#10b981" 
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorReal)" 
              name="realWealth"
            />
            <Area 
              type="monotone" 
              dataKey="cumulativeSavings" 
              stroke="#f59e0b" 
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#colorSavings)" 
              name="cumulativeSavings"
            />

            {/* Render a line for National FIRE Target */}
            {fireTarget > 0 && (
              <ReferenceLine 
                y={fireTarget} 
                stroke="#ec4899" 
                strokeDasharray="3 3" 
                strokeWidth={1.5}
                label={{ 
                  value: `FI/RE Multiplier (${formatCurrencyAbbrev(fireTarget)})`, 
                  fill: "#f472b6", 
                  position: "top", 
                  fontSize: 10,
                  fontWeight: "bold"
                }} 
              />
            )}

            {/* Render a vertical line if they reach FI/RE within simulation */}
            {fireAchievedYear !== null && (
              <ReferenceLine 
                x={projections[fireAchievedYear].age} 
                stroke="#ec4899" 
                strokeWidth={1.5}
                label={{ 
                  value: "FI/RE Age!", 
                  fill: "#f472b6", 
                  position: "insideBottomLeft", 
                  fontSize: 10,
                  fontWeight: "bold"
                }} 
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-4 bg-slate-950 rounded-lg p-3 text-[11px] text-slate-400 flex flex-wrap gap-x-6 gap-y-2 justify-between border border-slate-800/50">
        <div>
          <span className="font-semibold text-slate-300">💡 Compounding Tip:</span> The gap between <span className="text-amber-400 font-semibold">Accumulated Principal</span> and <span className="text-indigo-400 font-semibold">Nominal Wealth</span> represents your investment returns compounding.
        </div>
        <div>
          <span className="text-emerald-400 font-semibold">Real Wealth</span> tells you the relative purchase value of your future capital today.
        </div>
      </div>
    </div>
  );
}
