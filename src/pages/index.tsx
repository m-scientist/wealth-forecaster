import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { COUNTRY_PRESETS } from "../features/forecaster/data/countries";
import { ForecastParams, CountryPreset, IncomeStream, ExpenseCategory, LifeEvent, Scenario } from "../types";
import { calculateProjection } from "../features/forecaster/utils/math";
import ControlPanel from "../features/forecaster/components/ControlPanel";
import MilestonesCard from "../features/forecaster/components/MilestonesCard";
import TimelineSandbox from "../features/sandbox/components/TimelineSandbox";
import AiInsights from "../features/insights/components/AiInsights";
import { useAuth } from "../lib/FirebaseProvider";
import { 
  saveUserConfig, 
  getUserConfig, 
  saveScenarioDb, 
  getScenariosDb, 
  deleteScenarioDb 
} from "../lib/firebase";
import { Landmark, BadgePercent, LogIn, LogOut, Cloud, RefreshCw } from "lucide-react";

// Dynamically import ChartArea with SSR disabled to prevent Recharts client-side/Server-side hydration mismatches or window resize crashes.
const ChartArea = dynamic(() => import("../features/forecaster/components/ChartArea"), { ssr: false });

export default function App() {
  const [selectedCountry, setSelectedCountry] = useState<CountryPreset>(COUNTRY_PRESETS[0]); // Default to US

  // Firebase auth state hook
  const { user, login, logout, loadingAuth } = useAuth();
  const [isSyncLoading, setIsSyncLoading] = useState(false);

  // Base compounding variables model (excluding monthlyIncome/Expenses is handled granularly below)
  const [params, setParams] = useState<ForecastParams>({
    countryId: COUNTRY_PRESETS[0].id,
    startAge: 28,
    projectionYears: 30,
    currentNetWorth: 35000,
    savingsAllocationCash: 20,
    savingsAllocationInvestment: 80,
    expectedCashReturn: COUNTRY_PRESETS[0].defaultSavingsRate,
    expectedMarketReturn: COUNTRY_PRESETS[0].defaultMarketReturn,
    inflationRate: COUNTRY_PRESETS[0].defaultInflation,
    annualIncomeIncrease: 3.5,
    annualExpensesIncrease: 2.5,
    adjustForInflation: true,
  });

  // Client relational sub-streams state
  const [incomeStreams, setIncomeStreams] = useState<IncomeStream[]>([
    { id: "inc-1", name: "Primary Salary", amount: 5400 },
    { id: "inc-2", name: "Side Consulting", amount: 1200 },
  ]);

  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([
    { id: "exp-1", name: "Rent & Housing", amount: 2000 },
    { id: "exp-2", name: "Groceries & Food", amount: 600 },
    { id: "exp-3", name: "Leisure & Travel", amount: 800 },
    { id: "exp-4", name: "Utilities & Subs", amount: 800 },
  ]);

  // Timelined What-If Chronological events state
  const [events, setEvents] = useState<LifeEvent[]>([
    { id: "evt-1", name: "Obtain Career Promotion", type: "monthly_income_bump", amount: 750, yearOffset: 3, active: true },
    { id: "evt-2", name: "Acquire Family Vehicle", type: "one_off_expense", amount: 18000, yearOffset: 2, active: true },
  ]);

  // Local Scenario Database snapshot state
  const [savedScenarios, setSavedScenarios] = useState<Scenario[]>([]);

  // 1. Initial State Restoration on Login state transition
  useEffect(() => {
    const fetchAndSyncData = async () => {
      if (user) {
        setIsSyncLoading(true);
        try {
          const cloudConfig = await getUserConfig(user.uid);
          if (cloudConfig) {
            // Restore exact config and streams from Firestore cloud storage
            setParams(cloudConfig.params);
            setIncomeStreams(cloudConfig.incomeStreams || []);
            setExpenseCategories(cloudConfig.expenseCategories || []);
            setEvents(cloudConfig.events || []);

            // Align selected country matching our params
            const matchingCountry = COUNTRY_PRESETS.find(c => c.id === cloudConfig.params.countryId);
            if (matchingCountry) {
              setSelectedCountry(matchingCountry);
            }
          } else {
            // Cloud config is empty, write initial baseline template records based on current parameters
            await saveUserConfig(
              user.uid,
              user.email || "",
              params,
              incomeStreams,
              expenseCategories,
              events
            );
          }

          // Restore cloud scenarios
          const cloudScenarios = await getScenariosDb(user.uid);
          if (cloudScenarios && cloudScenarios.length > 0) {
            setSavedScenarios(cloudScenarios);
          } else {
            // No custom configurations in cloud yet, write the default scenarios to cloud-indexed tables
            const raw = localStorage.getItem("wealth_forecast_scenarios");
            const seedScenarios = raw ? JSON.parse(raw) : savedScenarios;
            if (seedScenarios && seedScenarios.length > 0) {
              for (const scen of seedScenarios) {
                await saveScenarioDb(user.uid, scen);
              }
              setSavedScenarios(seedScenarios);
            }
          }
        } catch (e) {
          console.error("Firestore sync restoration failed during auth activation:", e);
        } finally {
          setIsSyncLoading(false);
        }
      } else {
        // Logged out: fallback gracefully loading local JSON parameters
        const raw = localStorage.getItem("wealth_forecast_scenarios");
        if (raw) {
          try {
            setSavedScenarios(JSON.parse(raw));
          } catch (e) {
            console.error("Local scenarios parsing failure:", e);
          }
        }
      }
    };

    fetchAndSyncData();
  }, [user]);

  // 2. Local State hydrator on first guest browser loading
  useEffect(() => {
    if (!user) {
      const raw = localStorage.getItem("wealth_forecast_scenarios");
      if (!raw) {
        const defaultScenarios: Scenario[] = [
          {
            id: "scen-baseline",
            name: "Baseline Career Route",
            incomeStreams: [
              { id: "binc-1", name: "Standard Salary", amount: 4800 },
            ],
            expenseCategories: [
              { id: "bexp-1", name: "Rent & Lodging", amount: 2100 },
              { id: "bexp-2", name: "Food & Household", amount: 700 },
              { id: "bexp-3", name: "Transport & Fun", amount: 1000 },
            ],
            events: [
              { id: "bevt-1", name: "Incremental Raise", type: "monthly_income_bump", amount: 450, yearOffset: 3, active: true }
            ],
            description: "Standard single active stream pacing with minimal interruption benchmarks."
          },
          {
            id: "scen-fastfire",
            name: "Aggressive Savings Path",
            incomeStreams: [
              { id: "finc-1", name: "Tech Active Salary", amount: 6500 },
              { id: "finc-2", name: "Part-time Consultation", amount: 1800 },
            ],
            expenseCategories: [
              { id: "fexp-1", name: "Rent (Co-Living Shared)", amount: 1600 },
              { id: "fexp-2", name: "Traded Meal preps", amount: 450 },
              { id: "fexp-3", name: "Other basic services", amount: 550 },
            ],
            events: [
              { id: "fevt-1", name: "Promoted to Senior Team Lead", type: "monthly_income_bump", amount: 1500, yearOffset: 2, active: true },
              { id: "fevt-2", name: "Real Estate Dividends", type: "one_off_windfall", amount: 35000, yearOffset: 5, active: true }
            ],
            description: "Optimized living cost thresholds paired with immediate side-gig and promotion compound boosts."
          },
          {
            id: "scen-family",
            name: "Family Sandbox Timings",
            incomeStreams: [
              { id: "faminc-1", name: "Core Joint Wages", amount: 5500 },
            ],
            expenseCategories: [
              { id: "famexp-1", name: "Home Lease Mortgage", amount: 2200 },
              { id: "famexp-2", name: "Living essentials", amount: 800 },
              { id: "famexp-3", name: "Leisures", amount: 900 },
            ],
            events: [
              { id: "famevt-1", name: "Preowned Sedan Vehicle", type: "one_off_expense", amount: 15000, yearOffset: 2, active: true },
              { id: "famevt-2", name: "Adversity Nursing Needs", type: "monthly_expense_bump", amount: 500, yearOffset: 3, active: true },
              { id: "famevt-3", name: "Inheritance Windfall", type: "one_off_windfall", amount: 40000, yearOffset: 6, active: true }
            ],
            description: "Tracks dynamic expenditures relating to growing families (vehicles, childcare) countered with cash windfalls."
          }
        ];
        setSavedScenarios(defaultScenarios);
        localStorage.setItem("wealth_forecast_scenarios", JSON.stringify(defaultScenarios));
      }
    }
  }, [user]);

  // 3. Real-time Reactive Cloud Synchronization whenever parameters are updated
  useEffect(() => {
    if (user && !isSyncLoading) {
      saveUserConfig(user.uid, user.email || "", params, incomeStreams, expenseCategories, events)
        .catch(err => console.error("Realtime Cloud Database Sync failed:", err));
    }
  }, [params, incomeStreams, expenseCategories, events, user, isSyncLoading]);

  const handleSaveScenario = async (name: string) => {
    const newScen: Scenario = {
      id: `scen-custom-${Date.now()}`,
      name,
      incomeStreams: [...incomeStreams],
      expenseCategories: [...expenseCategories],
      events: [...events],
      description: "Custom user relational sandbox snapshot."
    };
    
    const updated = [...savedScenarios, newScen];
    setSavedScenarios(updated);
    localStorage.setItem("wealth_forecast_scenarios", JSON.stringify(updated));

    if (user) {
      try {
        await saveScenarioDb(user.uid, newScen);
      } catch (err) {
        console.error("Failed to persist custom scenario to secure cloud document:", err);
      }
    }
  };

  const handleLoadScenario = (scen: Scenario) => {
    setIncomeStreams(scen.incomeStreams);
    setExpenseCategories(scen.expenseCategories);
    setEvents(scen.events);
  };

  const handleDeleteScenario = async (id: string) => {
    const updated = savedScenarios.filter(s => s.id !== id);
    setSavedScenarios(updated);
    localStorage.setItem("wealth_forecast_scenarios", JSON.stringify(updated));

    if (user) {
      try {
        await deleteScenarioDb(user.uid, id);
      } catch (err) {
        console.error("Failed to delete custom scenario from remote document:", err);
      }
    }
  };

  const handleCountryPresetChange = (newCountry: CountryPreset) => {
    setSelectedCountry(newCountry);
  };

  // Re-run compounding projection loop dynamically on any input slider movement
  const projections = useMemo(() => {
    return calculateProjection(params, incomeStreams, expenseCategories, events, selectedCountry.taxRate);
  }, [params, incomeStreams, expenseCategories, events, selectedCountry.taxRate]);

  // Track standard aggregated monthly flows
  const totalMonthlyIncome = useMemo(() => {
    return incomeStreams.reduce((sum, item) => sum + item.amount, 0);
  }, [incomeStreams]);

  const totalMonthlyExpenses = useMemo(() => {
    return expenseCategories.reduce((sum, item) => sum + item.amount, 0);
  }, [expenseCategories]);

  // Determine active FI/RE indices
  const fireTarget = useMemo(() => {
    const annualExpenses = totalMonthlyExpenses * 12;
    return annualExpenses * 25;
  }, [totalMonthlyExpenses]);

  const fireAchievedYearIndex = useMemo(() => {
    const index = projections.findIndex((p) => p.nominalWealth >= fireTarget);
    return index !== -1 ? index : null;
  }, [projections, fireTarget]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200" id="global-wealth-forecaster-app">
      {/* Background radial atmosphere glow filters */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-550/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-[35vh] right-1/4 w-[600px] h-[600px] bg-emerald-550/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        
        {/* Simple elegant Display Typography Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800 pb-5 mb-6 gap-4" id="app-header-container">
          <div>
            <div className="flex items-center gap-2 mb-1" id="brand-box">
              <span className="bg-indigo-650 px-2 py-1.5 rounded-lg text-white font-mono font-bold text-sm tracking-wider shadow-lg shadow-indigo-650/15">
                FI/RE
              </span>
              <h1 className="text-xl font-bold tracking-tight text-white font-sans" id="app-name-title">
                Global Wealth Forecaster <span className="text-indigo-400 font-light font-mono text-sm ml-1">v3.5</span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Interactive Next.js financial timeline adapting compounding rules, tax rates, and scenario "What-if" triggers in real-time.
            </p>
          </div>

          {/* Secure Firebase Synchronization Indicator / Control Block */}
          <div className="flex flex-wrap items-center gap-3.5 text-xs text-white" id="auth-sync-bar">
            
            {/* 1. Auth Sync Controls */}
            {loadingAuth ? (
              <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2 text-slate-400 font-mono text-[11px]" id="auth-connecting-status">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                <span>Checking Credentials...</span>
              </div>
            ) : user ? (
              <div className="bg-indigo-950/40 border border-indigo-900/50 rounded-lg px-3 py-1.5 flex items-center gap-3 text-[11px] shadow shadow-indigo-950/20" id="auth-logged-in-profile">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <div className="font-mono text-indigo-200">
                    <span className="text-slate-400 font-sans mr-1">Cloud Sync:</span>
                    <span className="font-bold max-w-[120px] truncate inline-block align-bottom">{user.displayName || user.email}</span>
                  </div>
                  {isSyncLoading && (
                    <RefreshCw className="w-3 h-3 animate-spin text-emerald-400 ml-1" />
                  )}
                </div>
                
                <button 
                  onClick={() => logout().catch(e => console.error("Logout trigger failed:", e))}
                  className="text-slate-400 hover:text-white transition-all pl-2 border-l border-indigo-900/60 flex items-center gap-1 cursor-pointer font-semibold"
                  id="auth-logout-btn"
                >
                  <LogOut className="w-3 h-3 text-rose-400" />
                  Sign Out
                </button>
              </div>
            ) : (
              <button 
                onClick={() => login().catch(e => console.error("Login trigger failed:", e))}
                className="bg-indigo-650 hover:bg-indigo-500 text-white border border-indigo-600 rounded-lg px-4.5 py-1.5 flex items-center gap-2 cursor-pointer font-bold transition-all shadow shadow-indigo-900/30 font-mono text-[11px]"
                id="auth-login-btn"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign in with Google
              </button>
            )}

            {/* 2. Static Highlights */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <Landmark className="w-3.5 h-3.5 text-amber-400" />
              <div className="font-mono text-[11px]">
                <span className="text-slate-400 mr-1">Taxes drag:</span>
                <span className="text-slate-200 font-bold">{selectedCountry.taxRate}%</span>
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 flex items-center gap-2">
              <BadgePercent className="w-3.5 h-3.5 text-rose-400" />
              <div className="font-mono text-[11px]">
                <span className="text-slate-400 mr-1">Inflation preset:</span>
                <span className="text-slate-200 font-bold">{params.inflationRate}%</span>
              </div>
            </div>

          </div>
        </header>

        {/* 3-Column Bento Grid Workspace */}
        <div className="grid grid-cols-12 gap-6" id="app-grid-columns">
          
          {/* Column 1: Relational Control Panel */}
          <div className="col-span-12 lg:col-span-5 xl:col-span-4" id="control-panel-wrapper">
            <ControlPanel
              params={params}
              onChange={setParams}
              selectedCountry={selectedCountry}
              onCountryChange={handleCountryPresetChange}
              incomeStreams={incomeStreams}
              onIncomeStreamsChange={setIncomeStreams}
              expenseCategories={expenseCategories}
              onExpenseCategoriesChange={setExpenseCategories}
              savedScenarios={savedScenarios}
              onSaveScenario={handleSaveScenario}
              onLoadScenario={handleLoadScenario}
              onDeleteScenario={handleDeleteScenario}
            />
          </div>

          {/* Column 2: Compounding Chart Visualizer & Chronological Sandbox */}
          <div className="col-span-12 lg:col-span-7 xl:col-span-5 flex flex-col gap-6" id="visualization-column-wrapper">
            
            {/* Net worth saturation Curve */}
            <ChartArea
              projections={projections}
              currencySymbol={selectedCountry.symbol}
              fireTarget={fireTarget}
              fireAchievedYear={fireAchievedYearIndex}
              adjustForInflation={params.adjustForInflation}
            />

            {/* Timelined What-If Sandbox */}
            <TimelineSandbox
              events={events}
              onChange={setEvents}
              country={selectedCountry}
              projectionYears={params.projectionYears}
            />

            {/* Adaptive Milestones progress cards */}
            <MilestonesCard
              projections={projections}
              country={selectedCountry}
              startAge={params.startAge}
              monthlyExpenses={totalMonthlyExpenses}
              expectedMarketReturn={params.expectedMarketReturn}
              inflationRate={params.inflationRate}
              currentNetWorth={params.currentNetWorth}
            />
          </div>

          {/* Column 3: AI Insights & Actuary Audit Suite */}
          <div className="col-span-12 xl:col-span-3 lg:col-span-12" id="ai-insights-column-wrapper">
            <AiInsights
              params={params}
              country={selectedCountry}
              projections={projections}
              incomeStreams={incomeStreams}
              expenseCategories={expenseCategories}
              events={events}
            />
          </div>

        </div>

        {/* Footers block */}
        <footer className="mt-12 pt-6 border-t border-slate-800/80 text-center text-[10px] text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div>
            &copy; 2026 Global Wealth Forecaster &bull; Designed in feature-based Next.js & Tailwind V4
          </div>
          <div className="flex gap-4 border-l border-slate-800 pl-3 md:border-none md:pl-0">
            {user ? (
              <span className="text-emerald-400 font-mono flex items-center gap-1.5">
                <Cloud className="w-3 h-3 animate-pulse" />
                Cloud syncing active. Live database connected.
              </span>
            ) : (
              <span className="text-slate-400 font-mono">
                Running in offline guest mode. Sign in to sync.
              </span>
            )}
            <span>Standard 4% Safe Withdrawal formulas are evaluated dynamically.</span>
            <span>Calculators are hypothetical asset-growth representations.</span>
          </div>
        </footer>

      </div>
    </div>
  );
}
