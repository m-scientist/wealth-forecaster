import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured in Secrets. Please define it in the AI Studio Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  try {
    const { params, country, projections, userPrompt } = req.body;
    
    if (!params || !country || !projections || !projections.length) {
      return res.status(400).json({ error: "Missing required coordinates for forecasting analysis." });
    }

    const lastProjection = projections[projections.length - 1];
    const nominalFinal = lastProjection.nominalWealth;
    const realFinal = lastProjection.realWealth;
    const initialNetWorth = params.currentNetWorth;
    
    const systemPrompt = `You are a certified professional Global Financial Planner (GFP) and wealth management consultant.
You are tasked with providing high-fidelity wealth analysis to a user in ${country.name}.
The current base currency is ${country.currency} (${country.symbol}).

Provide extremely insightful, hyper-realistic, tax-aware, and inflation-adjusted suggestions tailored exactly to their numerical parameters and national financial ecosystem.
Avoid generic high-level descriptions. Cite actual country-specific concepts, retirement plans, tax thresholds, account classifications, and investment approaches suitable for ${country.name}.
Format your advice in clean, professional Markdown with bold subtitles, bullet lists, and spacious layouts.`;

    let contents = `Detailed client financial plan dashboard data:
- **Residency Location**: ${country.name} (Base Currency: ${country.currency}, Symbol: ${country.symbol})
- **Starting Net Worth**: ${country.symbol}${initialNetWorth.toLocaleString()}
- **Current Planning Age**: Starts at ${params.startAge}, projecting ${params.projectionYears} years out (Target age: ${params.startAge + params.projectionYears}).
- **Savings Split Scheme**: ${params.savingsAllocationCash}% Cash (yielding ${params.expectedCashReturn}%), ${params.savingsAllocationInvestment}% Equity/Market Assets (yielding ${params.expectedMarketReturn}%).
- **Long-term Country Inflation**: ${params.inflationRate}% per annum.
- **Estimated Capital Gains or Wealth Tax**: ${country.taxRate}%.

Compounding Projection Output:
- **Envisioned Net Worth in ${params.projectionYears} Years (Nominal)**: ${country.symbol}${nominalFinal.toLocaleString()}
- **Purchasing Power in Today's Terms (Real Wealth adjusted for ${params.inflationRate}% inflation)**: ${country.symbol}${realFinal.toLocaleString()}
- **Accumulated Deposited Capital**: ${country.symbol}${projections[projections.length - 1].cumulativeSavings.toLocaleString()}
- **Compounded Return Earnings**: ${country.symbol}${projections[projections.length - 1].cumulativeGrowth.toLocaleString()}`;

    if (userPrompt) {
      contents += `\n\nSpecific Advisory Inquiry: "${userPrompt}"\n\nPlease answer this inquiry directly while referencing their country context and project data.`;
    } else {
      contents += `\n\nPlease construct a professional Strategic Financial Diagnosis report structured as follows:
1. **Financial Independence & FI/RE Profile**: Calculate when they achieve Financial Independence (FI/RE) based on standard living expenditures (using the 4% safe withdrawal rule, i.e., 25x annual expenses). Estimate when their net worth reaches this FI/RE number.
2. **Asset Allocation & Cash Drag Appraisal**: Review the allocation of ${params.savingsAllocationCash}% cash. Is this ratio optimal given inflation risks in ${country.name}?
3. **National Tax & Retirement Account Strategies**: Highlight how a capital gains rate of ${country.taxRate}% in ${country.name} curbs nominal returns. Detail explicit tax-advantaged accounts or structures (e.g., US: IRA/401k/HSA, UK: ISAs/SIPP, Japan: NISA/iDeCo, Canada: TFSA/RRSP, Singapore: CPF/SRS, India: PPF/Equity ELSS, South Africa: TFSA/RA, Kenya: IPP/T-Bills/Zimele, Nigeria: Pension Fund PFAs/Treasury, Egypt: high savings bank certificates) they can leverage to minimize tax drag.
4. **Advisory Wealth Building Steps**: List 3 key high-impact adjustments to secure or accelerate their forecast trajectory.`;
    }

    const client = getAiClient();
    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
      },
    });

    return res.status(200).json({ insights: response.text });
  } catch (error: any) {
    console.error("Gemini Advisor API Route Exception:", error);
    return res.status(500).json({ error: error?.message || "Internal server error connecting to advisory engine." });
  }
}
