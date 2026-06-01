import { YearProjection, CountryPreset } from "../../../types";
import { CheckCircle2, Award, Target, Trophy } from "lucide-react";

interface MilestonesCardProps {
  projections: YearProjection[];
  country: CountryPreset;
  startAge: number;
  monthlyExpenses: number;
  expectedMarketReturn: number;
  inflationRate: number;
  currentNetWorth: number;
}

export default function MilestonesCard({
  projections,
  country,
  startAge,
  monthlyExpenses,
  expectedMarketReturn,
  inflationRate,
  currentNetWorth,
}: MilestonesCardProps) {
  const currencySymbol = country.symbol;
  const annualExpenses = monthlyExpenses * 12;

  // 1. Calculate Targets
  const fireTarget = annualExpenses * 25; // Standard 25x Rule (4% SWR)
  const leanFireTarget = fireTarget * 0.75;
  const millionaireTarget = 1_000_000;

  // Coast FIRE target: What nest egg do you need TODAY to grow to FIRE Target by retirement age?
  const yearsToRetire = Math.max(0, country.retirementAge - startAge);
  const realReturnRate = Math.max(0.1, expectedMarketReturn - inflationRate) / 100;
  const coastFireTarget = fireTarget / Math.pow(1 + realReturnRate, yearsToRetire);

  // 2. Discover attainment coordinates in projection timeline
  const findFirstYearReached = (target: number) => {
    const record = projections.find((p) => p.nominalWealth >= target);
    return record ? { age: record.age, year: record.year } : null;
  };

  const millionaireAchieved = findFirstYearReached(millionaireTarget);
  const fireAchieved = findFirstYearReached(fireTarget);
  const leanFireAchieved = findFirstYearReached(leanFireTarget);
  
  // Coast FIRE check is based on current starting net worth!
  const isCoastFireToday = currentNetWorth >= coastFireTarget;

  // Let's find progression percentage for visual bars
  const calculateProgress = (curr: number, target: number) => {
    return Math.min(100, Math.max(0, (curr / target) * 100));
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-white" id="milestones-card-block">
      <div className="flex items-center gap-2.5 mb-5" id="milestones-title">
        <Target className="w-5 h-5 text-indigo-400" />
        <h3 className="text-md font-semibold tracking-tight">Financial Independence (FI/RE) Benchmarks</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="milestones-grid-container">
        
        {/* Coast FIRE */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/60 relative overflow-hidden flex flex-col justify-between" id="coast-fire-card">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block">
                  Coast FI/RE Target
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  {currencySymbol}{Math.round(coastFireTarget).toLocaleString()}
                </span>
              </div>
              {isCoastFireToday ? (
                <span className="bg-emerald-500/15 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-semibold">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Active
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-700 font-semibold">
                  Accumulating
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              If you hold {currencySymbol}{Math.round(coastFireTarget).toLocaleString()} today at age {startAge}, your existing assets can compound on autopilot to let you retire at {country.retirementAge} without depositing another coin.
            </p>
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-500">Current Nest Egg Progress</span>
              <span className="font-mono text-amber-400 font-semibold">
                {calculateProgress(currentNetWorth, coastFireTarget).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 bg-opacity-45">
              <div 
                className="bg-amber-500 h-full rounded-full" 
                style={{ width: `${calculateProgress(currentNetWorth, coastFireTarget)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Lean FIRE */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/60 relative overflow-hidden flex flex-col justify-between" id="lean-fire-card">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-sky-400 uppercase tracking-widest block">
                  Lean FI/RE Target
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  {currencySymbol}{Math.round(leanFireTarget).toLocaleString()}
                </span>
              </div>
              {leanFireAchieved ? (
                <span className="bg-indigo-500/15 text-indigo-300 text-[10px] px-2 py-0.5 rounded-full border border-indigo-500/30 flex items-center gap-1 font-semibold">
                  <Trophy className="w-3 h-3 text-indigo-400" /> Age {leanFireAchieved.age}
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-700 font-semibold">
                  Out of Reach
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Represents a minimalist retirement covering basic subsistence expenses ({currencySymbol}{Math.round(annualExpenses * 0.75).toLocaleString()}/year) requiring 25x of reduced living budget.
            </p>
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-500">Wealth Progression</span>
              <span className="font-mono text-sky-400 font-semibold">
                {calculateProgress(currentNetWorth, leanFireTarget).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 bg-opacity-45">
              <div 
                className="bg-sky-400 h-full rounded-full" 
                style={{ width: `${calculateProgress(currentNetWorth, leanFireTarget)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Full FIRE */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/60 relative overflow-hidden flex flex-col justify-between" id="full-fire-card">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-rose-400 uppercase tracking-widest block">
                  Full FI/RE Target (4% SWR)
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  {currencySymbol}{Math.round(fireTarget).toLocaleString()}
                </span>
              </div>
              {fireAchieved ? (
                <span className="bg-rose-500/15 text-rose-300 text-[10px] px-2 py-0.5 rounded-full border border-rose-500/30 flex items-center gap-1 font-semibold">
                  <Award className="w-3 h-3 text-rose-400" /> Age {fireAchieved.age}
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-700 font-semibold">
                  Projecting...
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Your capital triggers absolute financial freedom! Ditch active labour entirely; 4% safe annual withdrawals support your living cost of {currencySymbol}{annualExpenses.toLocaleString()}/yr indefinitely.
            </p>
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-500">Independence Progress</span>
              <span className="font-mono text-rose-400 font-semibold">
                {calculateProgress(currentNetWorth, fireTarget).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 bg-opacity-45">
              <div 
                className="bg-rose-405 h-full rounded-full" 
                style={{ width: `${calculateProgress(currentNetWorth, fireTarget)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Millionaire status */}
        <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800/60 relative overflow-hidden flex flex-col justify-between" id="millionaire-card">
          <div>
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest block">
                  Club 1,000,000 Target
                </span>
                <span className="text-sm font-semibold text-slate-200">
                  {currencySymbol}{millionaireTarget.toLocaleString()}
                </span>
              </div>
              {millionaireAchieved ? (
                <span className="bg-emerald-500/15 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1 font-semibold">
                  <Trophy className="w-3 h-3 text-emerald-400" /> Age {millionaireAchieved.age}
                </span>
              ) : (
                <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full border border-slate-700 font-semibold">
                  Projecting...
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Crossing {currencySymbol}1,000,000 in nominal liquid value in {country.name}. Heavy compound acceleration typically occurs after this threshold is satisfied.
            </p>
          </div>
          <div>
            <div className="flex justify-between text-[11px] mb-1">
              <span className="text-slate-500">Millionaire Progress</span>
              <span className="font-mono text-emerald-400 font-semibold">
                {calculateProgress(currentNetWorth, millionaireTarget).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 bg-opacity-45">
              <div 
                className="bg-emerald-450 h-full rounded-full" 
                style={{ width: `${calculateProgress(currentNetWorth, millionaireTarget)}%` }}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
