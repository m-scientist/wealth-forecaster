import type { NextApiRequest, NextApiResponse } from "next";
import { GoogleGenAI, Type } from "@google/genai";

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
    const { params, incomeStreams, expenseCategories, events, country, projections } = req.body;

    if (!params || !country || !incomeStreams || !expenseCategories) {
      return res.status(400).json({ error: "Missing required financial state schemas for strategic audit." });
    }

    const client = getAiClient();

    const totalIncome = incomeStreams.reduce((sum: number, item: any) => sum + item.amount, 0);
    const totalExpenses = expenseCategories.reduce((sum: number, item: any) => sum + item.amount, 0);

    const auditSchema = {
      type: Type.OBJECT,
      properties: {
        score: {
          type: Type.INTEGER,
          description: "Financial quality optimization score from 0 to 100 based on cashflow, saving weight, and asset allocation strategy."
        },
        summary: {
          type: Type.STRING,
          description: "A short, professional 2-3 sentence overview assessing their state relative to local macroeconomic conditions in their country."
        },
        tweaks: {
          type: Type.ARRAY,
          description: "A list of 3 to 5 realistic, actionable and concrete suggestions tailored precisely to their country budget and currency environment.",
          items: {
            type: Type.OBJECT,
            properties: {
              suggestion: {
                type: Type.STRING,
                description: "Strongly worded, specific advice. E.g. 'Redirect 15% of your cash allocation into diversified stock index funds to hedge against Egypt's inflation' or 'Utilize South Africa's Section 12T Tax-Free Savings Account options.'"
              },
              category: {
                type: Type.STRING,
                description: "Area of tweak: 'Expense reduction', 'Tax sheltering', 'Inflation hedge', 'Yield capture', 'Liability risk'."
              },
              estimated_annual_impact: {
                type: Type.INTEGER,
                description: "The approximate annual wealth boost or cost savings in local currency units (implied currency scale)."
              },
              urgency: {
                type: Type.STRING,
                description: "High, Medium, or Low"
              }
            },
            required: ["suggestion", "category", "estimated_annual_impact", "urgency"]
          }
        }
      },
      required: ["score", "summary", "tweaks"]
    };

    const systemPrompt = `You are a certified professional wealth advisor and senior actuary specializing in global tax strategies and household financial audits.
Review the client and country profiles to compute a concrete, tailored optimization score and return a structured array of actionable advice items (Tweaks) in JSON format.
Ensure suggestions refer specifically to their country's localized options (IRS/401k/HSA/IRA in US, ISA/SIPP in UK, NISA in Japan, TFSA/RRSP in Canada, CPF/SRS in SG, ELSS/PPF in India, TFSA/RA in South Africa, IPP/M-Akiba/Sacco in Kenya, PFAs in Nigeria, Savings Certificate classes in Egypt).`;

    const contents = `Client wealth portfolio diagnostics:
- **Residency Location & Base Currency**: ${country.name} (${country.currency}, Symbol: ${country.symbol})
- **Starting Net Worth**: ${country.symbol}${params.currentNetWorth.toLocaleString()}
- **Monthly Primary Incomes**: ${incomeStreams.map((is: any) => `${is.name}: ${country.symbol}${is.amount}`).join("; ")} (Combined: ${country.symbol}${totalIncome.toLocaleString()}/mo)
- **Monthly Essential Expenditures**: ${expenseCategories.map((ec: any) => `${ec.name}: ${country.symbol}${ec.amount}`).join("; ")} (Combined: ${country.symbol}${totalExpenses.toLocaleString()}/mo)
- **Monthly Compound Surplus**: ${country.symbol}${Math.max(0, totalIncome - totalExpenses).toLocaleString()}/mo
- **Savings Allocation**: ${params.savingsAllocationCash}% Cash (yield: ${params.expectedCashReturn}%), ${params.savingsAllocationInvestment}% Market Equities (yield: ${params.expectedMarketReturn}%)
- **Macro Factors**: Inflation index rate: ${params.inflationRate}%, Local investment tax rate: ${country.taxRate}%
- **Dynamic Scenario Events**: ${events.map((e: any) => `Event [${e.name}] at Year ${e.yearOffset} (Type: ${e.type}, Amount: ${country.symbol}${e.amount}, Active: ${e.active})`).join("; ")}

Provide a precise performance score and structured tweak recommendations conforming strictly to the responseSchema description.`;

    const response = await client.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: auditSchema,
        temperature: 0.6,
      },
    });

    const parsedAudit = JSON.parse(response.text.trim());
    return res.status(200).json(parsedAudit);
  } catch (error: any) {
    console.error("Gemini Audit API Route Exception:", error);
    return res.status(500).json({ error: error?.message || "Internal server error connecting to the financial audit engine." });
  }
}
