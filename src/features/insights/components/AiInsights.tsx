import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { ForecastParams, CountryPreset, YearProjection, IncomeStream, ExpenseCategory, LifeEvent } from "../../../types";
import { Sparkles, MessageSquare, Send, AlertTriangle, RefreshCw, Award, AlertCircle } from "lucide-react";

interface AiInsightsProps {
  params: ForecastParams;
  country: CountryPreset;
  projections: YearProjection[];
  incomeStreams: IncomeStream[];
  expenseCategories: ExpenseCategory[];
  events: LifeEvent[];
}

interface ChatMessage {
  id: string;
  sender: "user" | "advisor";
  text: string;
}

interface AuditTweak {
  suggestion: string;
  category: string;
  estimated_annual_impact: number;
  urgency: string;
}

interface AuditResult {
  score: number;
  summary: string;
  tweaks: AuditTweak[];
}

export default function AiInsights({ 
  params, 
  country, 
  projections,
  incomeStreams,
  expenseCategories,
  events 
}: AiInsightsProps) {
  const [activeTab, setActiveTab] = useState<"advisor" | "audit">("advisor");
  
  // Conversational advisor states
  const [loading, setLoading] = useState(false);
  const [diagnosed, setDiagnosed] = useState(false);
  const [insights, setInsights] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatLog, setChatLog] = useState<ChatMessage[]>([]);

  // Structured Audit states
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [auditError, setAuditError] = useState<string | null>(null);

  // Call the conversational financial consulting advisor
  const generateFinancialDiagnosis = async (customPrompt?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          params,
          country,
          projections,
          userPrompt: customPrompt || null,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error || "Unable to reach the secure financial planning engine.");
      }

      const data = await response.json();
      
      if (customPrompt) {
        setChatLog((prev) => [
          ...prev, 
          { id: `u-${Date.now()}`, sender: "user", text: customPrompt },
          { id: `a-${Date.now() + 1}`, sender: "advisor", text: data.insights }
        ]);
      } else {
        setInsights(data.insights);
        setDiagnosed(true);
      }
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Verify your GEMINI_API_KEY environment configuration.");
    } finally {
      setLoading(false);
    }
  };

  // Call the highly structured and typed AI Financial Audit (generateObject replica)
  const triggerAiFinancialAudit = async () => {
    setAuditLoading(true);
    setAuditError(null);

    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          params,
          incomeStreams,
          expenseCategories,
          events,
          country,
          projections,
        }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData?.error || "Internal server error triggering the financial actuary model.");
      }

      const data = await response.json();
      setAuditResult(data);
    } catch (err: any) {
      console.error(err);
      setAuditError(err?.message || "Failed to compile the structured wealth audit parameters.");
    } finally {
      setAuditLoading(false);
    }
  };

  // Auto run advisor report if not yet computed
  useEffect(() => {
    if (!diagnosed && !loading) {
      generateFinancialDiagnosis();
    }
  }, [country.id]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;
    const prompt = chatInput.trim();
    setChatInput("");
    generateFinancialDiagnosis(prompt);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl flex flex-col h-[750px] lg:h-full justify-between text-white" id="ai-insights-panel">
      
      {/* 1. Header block */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          <h3 className="text-md font-semibold tracking-tight text-white">
            Global AI Wealth Architect
          </h3>
        </div>
        <p className="text-[11px] text-slate-400 leading-normal">
          Adapts compound modeling, tax exemptions, and customized tweaks to accelerate your localized net worth coordinates.
        </p>

        {/* Dynamic Segment Tabs */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 mt-3.5 gap-1 select-none">
          <button
            onClick={() => setActiveTab("advisor")}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "advisor"
                ? "bg-slate-900 text-indigo-300 border border-slate-800/80 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Conversational Advisor
          </button>
          <button
            onClick={() => {
              setActiveTab("audit");
              if (!auditResult && !auditLoading) {
                triggerAiFinancialAudit();
              }
            }}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === "audit"
                ? "bg-slate-900 text-emerald-400 border border-slate-800/80 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Award className="w-3.5 h-3.5" /> AI Financial Audit
          </button>
        </div>
      </div>

      {/* 2. Primary Scrollable Interactive Canvas */}
      <div className="flex-1 overflow-y-auto mb-4 bg-slate-950/60 rounded-xl border border-slate-800/50 p-4 custom-scrollbar">
        
        {/* TAB A: Conversational Consultant */}
        {activeTab === "advisor" && (
          <div className="h-full flex flex-col justify-between">
            {error && (
              <div className="bg-rose-950/30 border border-rose-800/40 rounded-lg p-3 text-[11px] text-rose-300 flex gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {loading && !diagnosed && chatLog.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400">
                <RefreshCw className="w-7 h-7 text-indigo-400 animate-spin mb-3" />
                <p className="text-xs animate-pulse font-mono">Simulating country cash pools...</p>
              </div>
            ) : diagnosed ? (
              <div className="space-y-4 text-xs font-sans">
                <div className="bg-indigo-950/25 border border-indigo-900/45 rounded-lg p-2.5 flex items-center justify-between text-[11px] font-mono text-indigo-300">
                  <span>🗺️ Strategy context: {country.name} ({country.currency})</span>
                  <button 
                    onClick={() => generateFinancialDiagnosis()}
                    disabled={loading}
                    className="bg-indigo-500/10 hover:bg-indigo-500/35 border border-indigo-500/20 text-[9px] py-0.5 px-2 rounded flex items-center gap-1.5 cursor-pointer text-indigo-200 uppercase"
                  >
                    <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                <div className="markdown-body text-slate-300 leading-relaxed max-w-none text-[11px] space-y-3 prose prose-invert">
                  <ReactMarkdown>{insights}</ReactMarkdown>
                </div>

                {/* Sub chat loops */}
                {chatLog.length > 0 && (
                  <div className="border-t border-slate-800/60 pt-4 mt-4 space-y-4" id="chat-thread-box">
                    <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 font-bold">
                      Dynamic Chat Record
                    </h4>
                    {chatLog.map((msg) => (
                      <div 
                        key={msg.id}
                        className={`rounded-lg p-3 text-[11px] leading-relaxed border ${
                          msg.sender === "user" 
                            ? "bg-slate-900 border-slate-800 ml-5 text-slate-200" 
                            : "bg-indigo-950/15 border-indigo-900/30 mr-5 text-slate-300"
                        }`}
                      >
                        <span className="text-[9px] font-mono font-bold text-slate-500 uppercase tracking-widest block mb-1">
                          {msg.sender === "user" ? "Client Coordinate Inquiry" : `${country.name} Wealth Planner`}
                        </span>
                        <div className="markdown-body">
                          <ReactMarkdown>{msg.text}</ReactMarkdown>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full py-16 px-4">
                <RefreshCw className="w-8 h-8 text-indigo-400 mb-3 animate-pulse" />
                <h4 className="text-xs font-bold mb-1.5 text-slate-200">Advisory Diagnostics Idle</h4>
                <p className="text-[11px] text-slate-400 max-w-xs mb-4">
                  Let the consulting planner digest your dynamic multi-stream cash allocation parameters.
                </p>
                <button
                  onClick={() => generateFinancialDiagnosis()}
                  className="bg-indigo-600 hover:bg-indigo-505 px-4.5 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-all shadow shadow-indigo-900"
                >
                  Synthesize Strategy Report
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB B: Structured Financial Audit (Tweak Engine) */}
        {activeTab === "audit" && (
          <div className="h-full flex flex-col justify-between" id="financial-audit-sandbox">
            {auditError && (
              <div className="bg-rose-950/30 border border-rose-800/40 rounded-lg p-3 text-[11px] text-rose-300 flex gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{auditError}</span>
              </div>
            )}

            {auditLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-16 text-slate-400" id="audit-loading-sphere">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin mb-3.5" />
                <p className="text-xs animate-pulse font-mono text-center max-w-[200px]">
                  Analyzing income allocations & compound drags against inflation...
                </p>
              </div>
            ) : auditResult ? (
              <div className="space-y-5" id="audit-report-canvas shadow">
                
                {/* Visual Circle Gauge Score */}
                <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800/65 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="relative w-16 h-16 shrink-0 flex items-center justify-center bg-slate-950 border-2 border-slate-800 rounded-full shadow shadow-indigo-950">
                    <div className="absolute text-sm font-black font-mono text-emerald-400">
                      {auditResult.score}%
                    </div>
                    {/* SVG Progress Circle Background loop */}
                    <svg className="w-full h-full transform -rotate-95 absolute inset-0">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#1e293b"
                        strokeWidth="3.5"
                        fill="transparent"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="#10b981"
                        strokeWidth="3.5"
                        fill="transparent"
                        strokeDasharray={175}
                        strokeDashoffset={175 - (175 * auditResult.score) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Financial Efficiency Index
                    </h4>
                    <p className="text-[11px] text-slate-400 leading-normal mt-1 italic">
                      {auditResult.summary}
                    </p>
                  </div>
                </div>

                {/* Audit Custom Actions (Tweaks Matrix) */}
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between border-b border-slate-800/50 pb-1.5">
                    <h4 className="text-[10px] font-mono uppercase font-bold tracking-widest text-emerald-400">
                      Personal Audit Tweak recommendations
                    </h4>
                    <button
                      onClick={triggerAiFinancialAudit}
                      className="text-[10px] text-indigo-400 font-mono hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" /> Recalculate
                    </button>
                  </div>

                  <div className="space-y-3" id="audit-tweaks-list">
                    {auditResult.tweaks.map((tweak, idx) => (
                      <div 
                        key={idx}
                        className="bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-3 flex flex-col justify-between gap-2.5 shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-[11px] leading-relaxed text-slate-200 font-medium">
                            {tweak.suggestion}
                          </p>
                          <span className={`text-[9px] font-mono py-0.5 px-1.5 rounded-full uppercase shrink-0 font-bold ${
                            tweak.urgency.toLowerCase() === "high" 
                              ? "bg-rose-500/15 text-rose-400 border border-rose-500/20" 
                              : tweak.urgency.toLowerCase() === "medium"
                              ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                              : "bg-indigo-500/15 text-indigo-300 border border-indigo-500/20"
                          }`}>
                            {tweak.urgency} Action
                          </span>
                        </div>

                        {/* Badges footer */}
                        <div className="flex items-center justify-between bg-slate-950/40 border border-slate-800/40 rounded px-2.5 py-1 text-[10px]">
                          <span className="text-slate-500 font-medium">area: <span className="text-slate-300 font-semibold">{tweak.category}</span></span>
                          <span className="font-mono text-emerald-400 font-bold">
                            Est Gain: + {country.symbol}{tweak.estimated_annual_impact.toLocaleString()}/yr
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center h-full py-16 px-4">
                <Award className="w-10 h-10 text-emerald-400 mb-3 animate-bounce" />
                <h4 className="text-xs font-bold mb-1.5 text-slate-200">Structured Advisor Audit Sheet</h4>
                <p className="text-[11px] text-slate-400 max-w-xs mb-5">
                  Produce structured tweaks, expense trims, and yield multipliers customized to {country.name}'s fiscal instruments.
                </p>
                <button
                  onClick={triggerAiFinancialAudit}
                  className="bg-emerald-600 hover:bg-emerald-505 px-4.5 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition-all shadow shadow-emerald-900/40"
                >
                  🚀 Compile Secure Financial Audit
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 3. Bottom user inputs chat prompt row */}
      {activeTab === "advisor" && (
        <form onSubmit={handleSendMessage} className="relative mt-2" id="chat-input-row">
          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder={`Ask about deductions in ${country.name}, pension plans...`}
            disabled={loading || !diagnosed}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-505 transition-all font-sans"
            id="chat-message-field"
          />
          <button
            type="submit"
            disabled={loading || !chatInput.trim() || !diagnosed}
            className={`absolute right-2.5 top-2.5 p-1.5 rounded-lg transition-colors ${
              chatInput.trim() && !loading && diagnosed
                ? "bg-indigo-600 text-white cursor-pointer hover:bg-indigo-500"
                : "text-slate-600 cursor-not-allowed"
            }`}
            id="submit-chat-btn"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      )}

      {activeTab === "audit" && auditResult && (
        <p className="text-[9px] font-mono text-center text-slate-500 leading-normal border-t border-slate-800/40 pt-2 shrink-0">
          *Structured tweaks are derived via real-time LLM audit evaluation of user parameters.
        </p>
      )}
      
    </div>
  );
}
