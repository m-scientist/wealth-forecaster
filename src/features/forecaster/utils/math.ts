import { ForecastParams, YearProjection, IncomeStream, ExpenseCategory, LifeEvent } from "../../../types";

/**
 * Calculates a year-by-year projection of net worth using high-fidelity monthly calculations.
 * Integrates dynamic sub-income streams, customizable expense categories, and chronological what-if life events.
 */
export function calculateProjection(
  params: ForecastParams,
  incomeStreams: IncomeStream[],
  expenseCategories: ExpenseCategory[],
  events: LifeEvent[],
  taxRate: number
): YearProjection[] {
  const {
    startAge,
    projectionYears,
    currentNetWorth,
    savingsAllocationCash,
    savingsAllocationInvestment,
    expectedCashReturn,
    expectedMarketReturn,
    inflationRate,
    annualIncomeIncrease,
    annualExpensesIncrease,
  } = params;

  const projections: YearProjection[] = [];

  // Start with 20% Cash and 80% Investment split for realistic liquid start
  let cashBalance = currentNetWorth * 0.20;
  let investmentBalance = currentNetWorth * 0.80;

  // Track totals over time
  let cumulativeSavings = 0;
  let totalCashGrowth = 0;
  let totalInvestmentGrowth = 0;

  const initialTotalIncome = incomeStreams.reduce((sum, item) => sum + item.amount, 0);
  const initialTotalExpenses = expenseCategories.reduce((sum, item) => sum + item.amount, 0);

  // Year 0 (starting point)
  projections.push({
    year: 0,
    age: startAge,
    nominalWealth: currentNetWorth,
    realWealth: currentNetWorth,
    cashContribution: Math.round(cashBalance),
    investmentContribution: Math.round(investmentBalance),
    cumulativeSavings: 0,
    cumulativeGrowth: 0,
    appliedEvents: [],
  });

  for (let year = 1; year <= projectionYears; year++) {
    const listEventsThisYear: string[] = [];

    // 1. Calculate the base salary & expense escalated for this specific year
    let baseMonthlyIncome = initialTotalIncome * Math.pow(1 + (annualIncomeIncrease / 100), year - 1);
    let baseMonthlyExpenses = initialTotalExpenses * Math.pow(1 + (annualExpensesIncrease / 100), year - 1);

    // 2. Scan and aggregate active lifecycle events that affect monthly flows
    let additionalIncomeFlow = 0;
    let additionalExpenseFlow = 0;

    events.forEach(event => {
      if (!event.active) return;
      
      // Monthly recurring bumps
      if (year >= event.yearOffset) {
        if (event.type === "monthly_income_bump") {
          additionalIncomeFlow += event.amount;
          if (year === event.yearOffset) {
            listEventsThisYear.push(`📈 ${event.name} (+${event.amount}/mo)`);
          }
        } else if (event.type === "monthly_expense_bump") {
          additionalExpenseFlow += event.amount;
          if (year === event.yearOffset) {
            listEventsThisYear.push(`💸 ${event.name} (+${event.amount}/mo)`);
          }
        }
      }

      // One-off lump events that hit specifically at yearOffset
      if (year === event.yearOffset) {
        if (event.type === "one_off_expense") {
          // Subtract from investment balance (or cash if investment is too low)
          if (investmentBalance >= event.amount) {
            investmentBalance -= event.amount;
          } else {
            const remainder = event.amount - investmentBalance;
            investmentBalance = 0;
            cashBalance = Math.max(0, cashBalance - remainder);
          }
          listEventsThisYear.push(`🛒 ${event.name} (-${event.amount.toLocaleString()})`);
        } else if (event.type === "one_off_windfall") {
          // Split according to target allocations
          const cashPart = event.amount * (savingsAllocationCash / 100);
          const investPart = event.amount * (savingsAllocationInvestment / 100);
          cashBalance += cashPart;
          investmentBalance += investPart;
          
          listEventsThisYear.push(`🎁 ${event.name} (+${event.amount.toLocaleString()})`);
        }
      }
    });

    const yearlyMonthlyIncome = baseMonthlyIncome + additionalIncomeFlow;
    const yearlyMonthlyExpenses = baseMonthlyExpenses + additionalExpenseFlow;
    const monthlySavings = Math.max(0, yearlyMonthlyIncome - yearlyMonthlyExpenses);

    // 3. Simulating 12 distinct months for high-fidelity compounding return and tax drag
    for (let month = 1; month <= 12; month++) {
      const monthlyCashRate = (expectedCashReturn / 100) / 12;
      const monthlyMarketRate = (expectedMarketReturn / 100) / 12;

      // Cash earns interest
      const cashEarnings = cashBalance * monthlyCashRate;
      cashBalance += cashEarnings;
      totalCashGrowth += cashEarnings;

      // Market investments earn return (with basic tax drag applied)
      const investmentEarningsRaw = investmentBalance * monthlyMarketRate;
      const taxDrag = investmentEarningsRaw * (taxRate / 100);
      const investmentEarningsNet = investmentEarningsRaw - taxDrag;

      investmentBalance += investmentEarningsNet;
      totalInvestmentGrowth += investmentEarningsNet;

      // Feed budget savings into cash/investment splits
      const cashContributionPart = monthlySavings * (savingsAllocationCash / 100);
      const investmentContributionPart = monthlySavings * (savingsAllocationInvestment / 100);

      cashBalance += cashContributionPart;
      investmentBalance += investmentContributionPart;

      cumulativeSavings += (cashContributionPart + investmentContributionPart);
    }

    const nominalWealth = cashBalance + investmentBalance;

    // 4. Calculate real purchasing power discounted for cumulative inflation
    const cumulativeInflationFactor = Math.pow(1 + (inflationRate / 100), year);
    const realWealth = nominalWealth / cumulativeInflationFactor;

    projections.push({
      year,
      age: startAge + year,
      nominalWealth: Math.round(nominalWealth),
      realWealth: Math.round(realWealth),
      cashContribution: Math.round(cashBalance),
      investmentContribution: Math.round(investmentBalance),
      cumulativeSavings: Math.round(cumulativeSavings),
      cumulativeGrowth: Math.round(totalCashGrowth + totalInvestmentGrowth),
      appliedEvents: listEventsThisYear,
    });
  }

  return projections;
}
