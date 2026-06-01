import { useState } from "react";
import { LifeEvent, CountryPreset } from "../../../types";
import { Plus, Trash2, Calendar, Sparkles, ToggleLeft, ToggleRight } from "lucide-react";

interface TimelineSandboxProps {
  events: LifeEvent[];
  onChange: (updatedEvents: LifeEvent[]) => void;
  country: CountryPreset;
  projectionYears: number;
}

export default function TimelineSandbox({
  events,
  onChange,
  country,
  projectionYears,
}: TimelineSandboxProps) {
  const [newEventName, setNewEventName] = useState("");
  const [newEventType, setNewEventType] = useState<LifeEvent["type"]>("one_off_expense");
  const [newEventAmount, setNewEventAmount] = useState<number>(10000);
  const [newEventYear, setNewEventYear] = useState<number>(3);

  const handleToggleActive = (id: string) => {
    const updated = events.map(e => e.id === id ? { ...e, active: !e.active } : e);
    onChange(updated);
  };

  const handleUpdateAmount = (id: string, amount: number) => {
    const updated = events.map(e => e.id === id ? { ...e, amount: Math.max(0, amount) } : e);
    onChange(updated);
  };

  const handleDeleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id);
    onChange(updated);
  };

  const handleCreateEvent = () => {
    if (!newEventName.trim()) return;

    const nEvent: LifeEvent = {
      id: `evt-${Date.now()}`,
      name: newEventName.trim(),
      type: newEventType,
      amount: newEventAmount,
      yearOffset: newEventYear,
      active: true,
    };

    onChange([...events, nEvent]);
    setNewEventName("");
    // Defaults
    setNewEventAmount(15000);
  };

  // Quick preset loaders
  const loadPresetEvent = (preset: { name: string; type: LifeEvent["type"]; amount: number; year: number }) => {
    const nEvent: LifeEvent = {
      id: `evt-preset-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: preset.name,
      type: preset.type,
      amount: preset.amount,
      yearOffset: preset.year,
      active: true,
    };
    onChange([...events, nEvent]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-white" id="timeline-sandbox-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="w-5 h-5 text-indigo-400" />
            <h3 className="text-md font-semibold tracking-tight">Chronological "What-If" Life Events</h3>
          </div>
          <p className="text-xs text-slate-400">
            Configure future life twists to instantly re-compound and view their cascading effects.
          </p>
        </div>
        
        {/* Helper info badge */}
        <div className="bg-slate-950/40 rounded px-2.5 py-1 text-[10px] text-slate-400 border border-slate-800/80 font-mono self-start sm:self-center">
          Active events: <span className="text-indigo-400 font-bold">{events.filter(e => e.active).length}</span>
        </div>
      </div>

      {/* Preset Action pills container */}
      <div className="mb-6 p-3 bg-slate-950/40 rounded-xl border border-slate-800/55">
        <span className="text-[10px] font-mono font-semibold uppercase text-slate-500 tracking-wider block mb-2">
          ⚡ Quick Sandbox Templates:
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => loadPresetEvent({ name: "Buy Premium SUV", type: "one_off_expense", amount: 22000, year: 2 })}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 py-1 px-2.5 rounded-lg text-xs text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
          >
            🚗 SUV (-22K)
          </button>
          <button
            onClick={() => loadPresetEvent({ name: "15% Promotional Bump", type: "monthly_income_bump", amount: 650, year: 3 })}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-emerald-500/50 py-1 px-2.5 rounded-lg text-xs text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
          >
            📈 Promotion (+650/mo)
          </button>
          <button
            onClick={() => loadPresetEvent({ name: "Real Estate Down Payment", type: "one_off_expense", amount: 45000, year: 5 })}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-indigo-500/50 py-1 px-2.5 rounded-lg text-xs text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
          >
            🏡 House Down (-45K)
          </button>
          <button
            onClick={() => loadPresetEvent({ name: "Family Expenses", type: "monthly_expense_bump", amount: 480, year: 4 })}
            className="bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-rose-500/50 py-1 px-2.5 rounded-lg text-xs text-slate-300 transition-all cursor-pointer flex items-center gap-1.5"
          >
            👶 Family Spend (+480/mo)
          </button>
        </div>
      </div>

      {/* Grid: Left - Events Feed, Right - Addition Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="sandbox-workspace-grid">
        
        {/* Events Feed (List of configured Events) */}
        <div className="lg:col-span-7 space-y-3.5 max-h-[380px] overflow-y-auto pr-1" id="events-feed-pane">
          {events.length === 0 ? (
            <div className="bg-slate-950/50 rounded-xl p-8 border border-slate-800/40 text-center flex flex-col items-center justify-center h-full min-h-[160px]">
              <Sparkles className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs text-slate-500 max-w-xs">
                No events currently configured on this timeline. Add a custom promotion, purchase, or windfall using the form.
              </p>
            </div>
          ) : (
            [...events].sort((a,b) => a.yearOffset - b.yearOffset).map((evt) => (
              <div
                key={evt.id}
                className={`transition-all border rounded-xl p-3.5 relative flex flex-col justify-between ${
                  evt.active
                    ? "bg-slate-900 border-slate-700/80 shadow-md shadow-indigo-950/10"
                    : "bg-slate-950/60 border-slate-850 opacity-60 text-slate-400"
                }`}
                id={`event-row-${evt.id}`}
              >
                {/* Event Core Header Row */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      evt.type === "one_off_expense" ? "bg-rose-500" :
                      evt.type === "monthly_expense_bump" ? "bg-amber-500" :
                      "bg-emerald-500"
                    }`} />
                    <div>
                      <h4 className="text-xs font-semibold text-white tracking-wide block">
                        {evt.name}
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {evt.type === "one_off_expense" ? "Lump Purchase" :
                         evt.type === "one_off_windfall" ? "Lump Windfall" :
                         evt.type === "monthly_income_bump" ? "Recurring Raise" : "Recurring Cost"}
                        &nbsp;&bull;&nbsp; Year {evt.yearOffset} (Expected Age {evt.yearOffset})
                      </span>
                    </div>
                  </div>

                  {/* Top Right Controls: Toggle Active & Delete */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleToggleActive(evt.id)}
                      className="text-slate-400 hover:text-white transition-colors cursor-pointer"
                      title={evt.active ? "Deactivate" : "Activate"}
                    >
                      {evt.active ? (
                        <ToggleRight className="w-6 h-6 text-indigo-400" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-slate-600" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(evt.id)}
                      className="text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      title="Delete event"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Event Slider for amount tweak */}
                <div className="mt-1 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/40">
                  <div className="flex justify-between items-center text-[11px] mb-1.5">
                    <span className="text-slate-500">Value magnitude:</span>
                    <span className={`font-mono font-bold ${
                      (evt.type === "one_off_expense" || evt.type === "monthly_expense_bump") 
                        ? "text-rose-400" 
                        : "text-emerald-400"
                    }`}>
                      {(evt.type === "one_off_expense" || evt.type === "monthly_expense_bump") ? "-" : "+"}
                      {country.symbol}{evt.amount.toLocaleString()}{evt.type.startsWith("monthly") ? "/mo" : ""}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={evt.type.startsWith("monthly") ? 50 : 500}
                    max={evt.type.startsWith("monthly") ? 5000 : 250000}
                    step={evt.type.startsWith("monthly") ? 25 : 1000}
                    value={evt.amount}
                    onChange={(e) => handleUpdateAmount(evt.id, Number(e.target.value))}
                    className="w-full accent-indigo-500 cursor-pointer h-1 bg-slate-800"
                  />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Custom Event Form */}
        <div className="lg:col-span-5 bg-slate-950/70 rounded-xl p-4.5 border border-slate-800/60 flex flex-col gap-3.5 justify-between" id="add-event-form-pane">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-3 block">
              🔧 Craft "What-If" Trigger
            </h4>

            {/* Event Name */}
            <div className="mb-3">
              <label className="block text-[10px] text-slate-400 mb-1" htmlFor="evt-name">
                Label / Name
              </label>
              <input
                id="evt-name"
                type="text"
                placeholder="e.g., Get raise, Buy laptop"
                value={newEventName}
                onChange={(e) => setNewEventName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Event Type selection */}
            <div className="mb-3">
              <label className="block text-[10px] text-slate-400 mb-1" htmlFor="evt-type">
                Adjustment Type
              </label>
              <select
                id="evt-type"
                value={newEventType}
                onChange={(e) => {
                  const val = e.target.value as LifeEvent["type"];
                  setNewEventType(val);
                  setNewEventAmount(val.startsWith("monthly") ? 400 : 15000);
                }}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1.5 px-2 text-xs focus:outline-none focus:border-indigo-500 text-slate-200"
              >
                <option value="one_off_expense">🛒 One-off Expense (lump sum)</option>
                <option value="one_off_windfall">🎁 One-off Windfall (lump sum)</option>
                <option value="monthly_income_bump">📈 Recurring Monthly Income bump</option>
                <option value="monthly_expense_bump">💸 Recurring Monthly Expense bump</option>
              </select>
            </div>

            {/* Timings: yearOffset */}
            <div className="mb-3">
              <div className="flex justify-between items-center text-[10px] text-slate-400 mb-1">
                <span>Occurrence Timing:</span>
                <span className="font-semibold text-slate-200">Year {newEventYear} of simulation</span>
              </div>
              <input
                type="range"
                min={1}
                max={projectionYears}
                step={1}
                value={newEventYear}
                onChange={(e) => setNewEventYear(Number(e.target.value))}
                className="w-full h-1 accent-indigo-500 bg-slate-900"
              />
            </div>

            {/* Initial Amount */}
            <div>
              <label className="block text-[10px] text-slate-400 mb-1" htmlFor="evt-amount">
                Initial Amount ({country.symbol})
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-xs text-slate-500 font-mono">
                  {country.symbol}
                </span>
                <input
                  id="evt-amount"
                  type="number"
                  min={1}
                  value={newEventAmount}
                  onChange={(e) => setNewEventAmount(Math.max(1, Number(e.target.value)))}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg py-1 pl-7 pr-3 text-xs focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleCreateEvent}
            disabled={!newEventName.trim()}
            className={`w-full py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5 ${
              newEventName.trim()
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30"
                : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-850"
            }`}
          >
            <Plus className="w-3.5 h-3.5" /> Inject Trigger Event
          </button>
        </div>

      </div>
    </div>
  );
}
