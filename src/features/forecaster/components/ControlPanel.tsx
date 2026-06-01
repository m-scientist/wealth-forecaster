import { useState } from "react";
import { COUNTRY_PRESETS } from "../data/countries";
import { ForecastParams, CountryPreset, IncomeStream, ExpenseCategory, Scenario } from "../../../types";
import { Plus, Trash2, Save, FolderOpen, Coins, Receipt } from "lucide-react";

interface ControlPanelProps {
  params: ForecastParams;
  onChange: (newParams: ForecastParams) => void;
  selectedCountry: CountryPreset;
  onCountryChange: (country: CountryPreset) => void;
  incomeStreams: IncomeStream[];
  onIncomeStreamsChange: (streams: IncomeStream[]) => void;
  expenseCategories: ExpenseCategory[];
  onExpenseCategoriesChange: (categories: ExpenseCategory[]) => void;
  savedScenarios: Scenario[];
  onSaveScenario: (name: string) => void;
  onLoadScenario: (scenario: Scenario) => void;
  onDeleteScenario: (id: string) => void;
}

export default function ControlPanel({
  params,
  onChange,
  selectedCountry,
  onCountryChange,
  incomeStreams,
  onIncomeStreamsChange,
  expenseCategories,
  onExpenseCategoriesChange,
  savedScenarios,
  onSaveScenario,
  onLoadScenario,
  onDeleteScenario,
}: ControlPanelProps) {

  const [newStreamName, setNewStreamName] = useState("");
  const [newStreamAmount, setNewStreamAmount] = useState<number | "">("");
  const [newExpenseName, setNewExpenseName] = useState("");
  const [newExpenseAmount, setNewExpenseAmount] = useState<number | "">("");
  const [scenarioSnapshotName, setScenarioSnapshotName] = useState("");

  const handleParamChange = <K extends keyof ForecastParams>(key: K, value: ForecastParams[K]) => {
    onChange({
      ...params,
      [key]: value,
    });
  };

  const handleCountryPresetChange = (countryId: string) => {
    const country = COUNTRY_PRESETS.find(c => c.id === countryId);
    if (country) {
      onCountryChange(country);
      onChange({
        ...params,
        countryId: country.id,
        expectedCashReturn: country.defaultSavingsRate,
        expectedMarketReturn: country.defaultMarketReturn,
        inflationRate: country.defaultInflation,
      });
    }
  };

  // Compute calculated sums on the fly
  const totalIncomeValue = incomeStreams.reduce((sum, item) => sum + item.amount, 0);
  const totalExpensesValue = expenseCategories.reduce((sum, item) => sum + item.amount, 0);
  const netSavingsValue = Math.max(0, totalIncomeValue - totalExpensesValue);
  const savingsRate = totalIncomeValue > 0 ? (netSavingsValue / totalIncomeValue) * 105 : 0; // standard display normalization

  // Allocation Slider Handler
  const handleAllocationChange = (cashPercentage: number) => {
    onChange({
      ...params,
      savingsAllocationCash: cashPercentage,
      savingsAllocationInvestment: 100 - cashPercentage,
    });
  };

  // Inline Handlers for Active Income Streams
  const handleUpdateIncomeAmount = (id: string, amount: number) => {
    const updated = incomeStreams.map(item => item.id === id ? { ...item, amount: Math.max(0, amount) } : item);
    onIncomeStreamsChange(updated);
  };

  const handleUpdateIncomeName = (id: string, name: string) => {
    const updated = incomeStreams.map(item => item.id === id ? { ...item, name } : item);
    onIncomeStreamsChange(updated);
  };

  const handleDeleteIncome = (id: string) => {
    if (incomeStreams.length <= 1) return; // Prevent deleting the last one to avoid error
    const updated = incomeStreams.filter(item => item.id !== id);
    onIncomeStreamsChange(updated);
  };

  const handleAddIncomeStream = () => {
    if (!newStreamName.trim() || !newStreamAmount) return;
    const nStream: IncomeStream = {
      id: `inc-${Date.now()}`,
      name: newStreamName.trim(),
      amount: Number(newStreamAmount),
    };
    onIncomeStreamsChange([...incomeStreams, nStream]);
    setNewStreamName("");
    setNewStreamAmount("");
  };

  // Inline Handlers for Active Expense Categories
  const handleUpdateExpenseAmount = (id: string, amount: number) => {
    const updated = expenseCategories.map(item => item.id === id ? { ...item, amount: Math.max(0, amount) } : item);
    onExpenseCategoriesChange(updated);
  };

  const handleUpdateExpenseName = (id: string, name: string) => {
    const updated = expenseCategories.map(item => item.id === id ? { ...item, name } : item);
    onExpenseCategoriesChange(updated);
  };

  const handleDeleteExpense = (id: string) => {
    if (expenseCategories.length <= 1) return; // Guard last item
    const updated = expenseCategories.filter(item => item.id !== id);
    onExpenseCategoriesChange(updated);
  };

  const handleAddExpenseCategory = () => {
    if (!newExpenseName.trim() || !newExpenseAmount) return;
    const nExpense: ExpenseCategory = {
      id: `exp-${Date.now()}`,
      name: newExpenseName.trim(),
      amount: Number(newExpenseAmount),
    };
    onExpenseCategoriesChange([...expenseCategories, nExpense]);
    setNewExpenseName("");
    setNewExpenseAmount("");
  };

  // Scenario snapshot save trigger
  const triggerSaveScenario = () => {
    if (!scenarioSnapshotName.trim()) return;
    onSaveScenario(scenarioSnapshotName.trim());
    setScenarioSnapshotName("");
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col gap-5 text-white max-h-[880px] overflow-y-auto" id="control-panel-aside">
      
      {/* 1. Country Selection */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-2">
          Country Parameters & Tax presets
        </h3>
        <select
          id="country-selector"
          value={params.countryId}
          onChange={(e) => handleCountryPresetChange(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-indigo-505 transition-colors"
        >
          {COUNTRY_PRESETS.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name} ({country.currency})
            </option>
          ))}
        </select>

        {/* Localized details display box */}
        <div className="mt-2.5 bg-slate-950/60 rounded-lg p-3 border border-slate-800/40 text-[11px] text-slate-400">
          <div className="flex justify-between mb-1">
            <span className="text-slate-500">Official Currency:</span>
            <span className="font-mono text-slate-200">{selectedCountry.currency} ({selectedCountry.symbol})</span>
          </div>
          <div className="flex justify-between mb-1.5">
            <span className="text-slate-500">Capital Gains Tax Band:</span>
            <span className="font-mono text-slate-200">{selectedCountry.taxRate}%</span>
          </div>
          <p className="text-slate-400 leading-relaxed border-t border-slate-800/50 pt-1.5 mt-1.5 font-sans">
            {selectedCountry.description}
          </p>
        </div>
      </div>

      <hr className="border-slate-800/60" />

      {/* 2. Saved Scenarios Manager */}
      <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-1.5 mb-2.5">
          <FolderOpen className="w-4 h-4 text-indigo-400" />
          <h4 className="text-xs font-bold tracking-tight text-white uppercase tracking-wider">
            Saved Scenarios Database
          </h4>
        </div>

        {/* Quick action: Save Current Stage */}
        <div className="flex gap-2 mb-3.5" id="save-scenario-cluster">
          <input
            type="text"
            placeholder="Snapshot name, e.g. Early Out"
            value={scenarioSnapshotName}
            onChange={(e) => setScenarioSnapshotName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800/80 rounded-lg py-1 px-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={triggerSaveScenario}
            disabled={!scenarioSnapshotName.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0 flex items-center gap-1"
          >
            <Save className="w-3 h-3" /> Save
          </button>
        </div>

        {/* Saved Items List */}
        <div className="space-y-1.5 max-h-[110px] overflow-y-auto custom-scrollbar">
          {savedScenarios.length === 0 ? (
            <span className="text-[10px] text-slate-500 italic block text-center py-1">
              No custom scenarios in DB yet.
            </span>
          ) : (
            savedScenarios.map((scen) => (
              <div 
                key={scen.id}
                className="flex items-center justify-between gap-2 p-1.5 bg-slate-900/40 rounded border border-slate-800/50 text-xs hover:border-slate-700/80 transition-all font-sans"
              >
                <button
                  onClick={() => onLoadScenario(scen)}
                  className="text-left font-medium text-slate-200 hover:text-indigo-400 transition-colors flex-1 cursor-pointer truncate"
                  title={`Load scenario "${scen.name}"`}
                >
                  📁 <span className="font-mono">{scen.name}</span>
                </button>
                <button
                  onClick={() => onDeleteScenario(scen.id)}
                  className="text-slate-500 hover:text-rose-400 transition-colors shrink-0 cursor-pointer"
                  title="Delete scenario"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <hr className="border-slate-800/60" />

      {/* 3. Planning Horizon Ages */}
      <div className="grid grid-cols-2 gap-3" id="age-inputs-grid">
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1" htmlFor="start-age-input">
            Current Age
          </label>
          <input
            id="start-age-input"
            type="number"
            min={18}
            max={85}
            value={params.startAge}
            onChange={(e) => handleParamChange("startAge", Math.max(18, Number(e.target.value)))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-indigo-505 text-slate-200"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1" htmlFor="projection-years-input">
            Years Projections
          </label>
          <input
            id="projection-years-input"
            type="number"
            min={5}
            max={60}
            value={params.projectionYears}
            onChange={(e) => handleParamChange("projectionYears", Math.max(5, Number(e.target.value)))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 px-3 text-sm focus:outline-none focus:border-indigo-550 text-slate-200"
          />
        </div>
      </div>

      {/* Starting Net Worth */}
      <div id="start-worth-container">
        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1" htmlFor="current-net-worth">
          Starting Principal ({selectedCountry.symbol})
        </label>
        <div className="relative">
          <span className="absolute left-3 top-2 text-xs text-slate-500 font-mono">
            {selectedCountry.symbol}
          </span>
          <input
            id="current-net-worth"
            type="number"
            min={0}
            value={params.currentNetWorth}
            onChange={(e) => handleParamChange("currentNetWorth", Math.max(0, Number(e.target.value)))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1.5 pl-8 pr-3 text-sm focus:outline-none focus:border-indigo-550 font-mono text-slate-200"
          />
        </div>
      </div>

      <hr className="border-slate-800/60" />

      {/* 4. CUSTOM INCOME STREAMS WORKBENCH */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Coins className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Active Income Streams
            </h4>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {selectedCountry.symbol}{totalIncomeValue.toLocaleString()}/mo
          </span>
        </div>

        {/* Streams List */}
        <div className="space-y-2 mb-3 max-h-[140px] overflow-y-auto pr-0.5" id="income-streams-rows">
          {incomeStreams.map((stream) => (
            <div key={stream.id} className="flex gap-2 items-center">
              <input
                type="text"
                value={stream.name}
                onChange={(e) => handleUpdateIncomeName(stream.id, e.target.value)}
                className="flex-[4] bg-slate-950 border border-slate-800 rounded py-1 px-1.5 text-xs focus:outline-none text-slate-200 font-sans"
              />
              <div className="relative flex-[6]">
                <span className="absolute left-1.5 top-1 text-[10px] text-slate-500 font-mono">{selectedCountry.symbol}</span>
                <input
                  type="number"
                  value={stream.amount}
                  onChange={(e) => handleUpdateIncomeAmount(stream.id, Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded py-1 pl-4.5 pr-1 text-xs focus:outline-none font-mono text-slate-200 text-right"
                />
              </div>
              <button
                onClick={() => handleDeleteIncome(stream.id)}
                disabled={incomeStreams.length <= 1}
                className="text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors cursor-pointer"
                title="Remove income"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Stream Form Mini row */}
        <div className="flex gap-1.5 mt-2 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/40">
          <input
            type="text"
            placeholder="e.g. Consulting"
            value={newStreamName}
            onChange={(e) => setNewStreamName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded text-[11px] px-1.5 py-0.5 text-white"
          />
          <input
            type="number"
            placeholder="Sum"
            value={newStreamAmount}
            onChange={(e) => setNewStreamAmount(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-16 bg-slate-900 border border-[#1e293b] rounded text-[11px] px-1 font-mono text-white text-right"
          />
          <button
            onClick={handleAddIncomeStream}
            disabled={!newStreamName.trim() || !newStreamAmount}
            className="bg-emerald-600/20 hover:bg-emerald-600 border border-emerald-500/25 p-1 rounded hover:text-white text-emerald-300 transition-all font-mono text-[10px] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <hr className="border-slate-800/60" />

      {/* 5. CUSTOM EXPENSE CATEGORIES WORKBENCH */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <Receipt className="w-4 h-4 text-rose-400" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Living Expense categories
            </h4>
          </div>
          <span className="text-xs font-mono font-bold text-rose-400">
            {selectedCountry.symbol}{totalExpensesValue.toLocaleString()}/mo
          </span>
        </div>

        {/* Expenses List */}
        <div className="space-y-2 mb-3 max-h-[160px] overflow-y-auto pr-0.5" id="expense-streams-rows">
          {expenseCategories.map((expense) => (
            <div key={expense.id} className="flex gap-2 items-center">
              <input
                type="text"
                value={expense.name}
                onChange={(e) => handleUpdateExpenseName(expense.id, e.target.value)}
                className="flex-[4] bg-slate-950 border border-slate-800 rounded py-1 px-1.5 text-xs focus:outline-none text-slate-200 font-sans"
              />
              <div className="relative flex-[6]">
                <span className="absolute left-1.5 top-1 text-[10px] text-slate-500 font-mono">{selectedCountry.symbol}</span>
                <input
                  type="number"
                  value={expense.amount}
                  onChange={(e) => handleUpdateExpenseAmount(expense.id, Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded py-1 pl-4.5 pr-1 text-xs focus:outline-none font-mono text-slate-200 text-right"
                />
              </div>
              <button
                onClick={() => handleDeleteExpense(expense.id)}
                disabled={expenseCategories.length <= 1}
                className="text-slate-500 hover:text-rose-400 disabled:opacity-30 disabled:hover:text-slate-500 transition-colors cursor-pointer"
                title="Remove expense"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add Expense Form Mini row */}
        <div className="flex gap-1.5 mt-2 bg-slate-950/40 p-1.5 rounded-lg border border-slate-800/40">
          <input
            type="text"
            placeholder="e.g. Groceries"
            value={newExpenseName}
            onChange={(e) => setNewExpenseName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-800 rounded text-[11px] px-1.5 py-0.5 text-white"
          />
          <input
            type="number"
            placeholder="Cost"
            value={newExpenseAmount}
            onChange={(e) => setNewExpenseAmount(e.target.value === "" ? "" : Number(e.target.value))}
            className="w-16 bg-slate-900 border border-[#1e293b] rounded text-[11px] px-1 font-mono text-white text-right"
          />
          <button
            onClick={handleAddExpenseCategory}
            disabled={!newExpenseName.trim() || !newExpenseAmount}
            className="bg-rose-600/20 hover:bg-rose-600 border border-rose-500/25 p-1 rounded hover:text-white text-rose-300 transition-all font-mono text-[10px] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Standardized surplus indicator gauge */}
      <div className="bg-slate-950 rounded-xl p-3 border border-slate-800/80">
        <div className="flex justify-between items-center text-xs mb-1">
          <span className="text-slate-400 font-medium">Monthly Compounding Surplus</span>
          <span className="font-mono font-bold text-emerald-400">
            {selectedCountry.symbol}{netSavingsValue.toLocaleString()} ({savingsRate.toFixed(0)}%)
          </span>
        </div>
        <div className="w-full bg-slate-800 rounded-full h-1 bg-opacity-40 overflow-hidden">
          <div 
            className="bg-emerald-500 h-full rounded-full transition-all duration-300"
            style={{ width: `${Math.min(100, Math.max(5, (netSavingsValue / (totalIncomeValue || 1)) * 100))}%` }}
          />
        </div>
      </div>

      <hr className="border-slate-800/60" />

      {/* 6. Portfolios allocation splits */}
      <div>
        <div className="flex justify-between text-xs font-mono mb-2">
          <span className="text-amber-400 font-bold">{params.savingsAllocationCash}% Cash holdings</span>
          <span className="text-indigo-400 font-bold">{params.savingsAllocationInvestment}% Market Equities</span>
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={params.savingsAllocationCash}
          onChange={(e) => handleAllocationChange(Number(e.target.value))}
          className="w-full h-1.5 rounded-lg appearance-none bg-gradient-to-r from-amber-400 to-indigo-500 cursor-pointer accent-white"
        />
        <p className="text-[10px] text-slate-500 leading-relaxed mt-2">
          Split the monthly compounding surplus between low-risk bank cash assets and standard growth indexes.
        </p>
      </div>

      <hr className="border-slate-800/60" />

      {/* 7. Advanced Economics Compounding tweaking parameters */}
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold tracking-wider text-slate-400 uppercase">
          Dynamic Compound Controls
        </h3>

        {/* Expected cash yields */}
        <div>
          <div className="flex justify-between items-center text-[11px] mb-1 text-slate-400">
            <span>Cash Yield (APY)</span>
            <span className="font-mono text-amber-400 font-bold">{params.expectedCashReturn}%</span>
          </div>
          <input
            id="cash-return-vol"
            type="range"
            min={0}
            max={22}
            step={0.15}
            value={params.expectedCashReturn}
            onChange={(e) => handleParamChange("expectedCashReturn", Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-850"
          />
        </div>

        {/* Expected Market gains */}
        <div>
          <div className="flex justify-between items-center text-[11px] mb-1 text-slate-400">
            <span>Market Growth (Realized)</span>
            <span className="font-mono text-indigo-400 font-bold">{params.expectedMarketReturn}%</span>
          </div>
          <input
            id="market-return-vol"
            type="range"
            min={1}
            max={24}
            step={0.25}
            value={params.expectedMarketReturn}
            onChange={(e) => handleParamChange("expectedMarketReturn", Number(e.target.value))}
            className="w-full accent-indigo-500 cursor-pointer h-1.5 bg-slate-850"
          />
        </div>

        {/* Expected inflation */}
        <div>
          <div className="flex justify-between items-center text-[11px] mb-1 text-slate-400">
            <span>Local Inflation Index</span>
            <span className="font-mono text-rose-400 font-bold">{params.inflationRate}%</span>
          </div>
          <input
            id="inflation-rate-vol"
            type="range"
            min={0}
            max={22}
            step={0.1}
            value={params.inflationRate}
            onChange={(e) => handleParamChange("inflationRate", Number(e.target.value))}
            className="w-full accent-rose-400 cursor-pointer h-1.5 bg-slate-850"
          />
        </div>

        {/* Escalators (Salary Raises & Expenditures Raises) */}
        <div className="grid grid-cols-2 gap-3.5 mt-1" id="escalation-group">
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5" htmlFor="income-escalation-rate">
              Annual Income raise %
            </label>
            <input
              id="income-escalation-rate"
              type="number"
              step={0.1}
              min={0}
              max={25}
              value={params.annualIncomeIncrease}
              onChange={(e) => handleParamChange("annualIncomeIncrease", Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-slate-100 font-mono focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-[10px] text-slate-400 mb-0.5" htmlFor="expense-escalation-rate">
              Annual Cost escalation %
            </label>
            <input
              id="expense-escalation-rate"
              type="number"
              step={0.1}
              min={0}
              max={25}
              value={params.annualExpensesIncrease}
              onChange={(e) => handleParamChange("annualExpensesIncrease", Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg py-1 px-2.5 text-xs text-slate-100 font-mono focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
