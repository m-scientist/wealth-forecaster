export interface CountryPreset {
  id: string;
  name: string;
  currency: string;
  symbol: string;
  defaultInflation: number; // e.g. 2.5 for 2.5%
  defaultSavingsRate: number; // typical interest rate for cash, e.g. 3.5
  defaultMarketReturn: number; // typical investment return, e.g. 8.0
  taxRate: number; // capital gains tax or wealth tax preset, e.g. 15.0
  retirementAge: number; // typical national retirement age, e.g. 67
  description: string; // Brief visual summary
}

export interface IncomeStream {
  id: string;
  name: string;
  amount: number; // monthly amount
}

export interface ExpenseCategory {
  id: string;
  name: string;
  amount: number; // monthly amount
}

export interface LifeEvent {
  id: string;
  name: string;
  type: "one_off_expense" | "one_off_windfall" | "monthly_income_bump" | "monthly_expense_bump";
  amount: number; // value of the event
  yearOffset: number; // year of occurance (1-indexed relative to projection start)
  active: boolean;
}

export interface Scenario {
  id: string;
  name: string;
  incomeStreams: IncomeStream[];
  expenseCategories: ExpenseCategory[];
  events: LifeEvent[];
  description: string;
}

export interface ForecastParams {
  countryId: string;
  startAge: number;
  projectionYears: number;
  currentNetWorth: number;
  savingsAllocationCash: number; // % allocated to cash (bank savings account)
  savingsAllocationInvestment: number; // % allocated to market investments
  expectedCashReturn: number; // % annual interest
  expectedMarketReturn: number; // % annual market gains
  inflationRate: number; // % annual inflation
  annualIncomeIncrease: number; // % annual increase in income
  annualExpensesIncrease: number; // % annual increase in expenses
  adjustForInflation: boolean; // nominal vs real view
}

export interface YearProjection {
  year: number;
  age: number;
  nominalWealth: number;
  realWealth: number;
  cashContribution: number;
  investmentContribution: number;
  cumulativeSavings: number;
  cumulativeGrowth: number;
  appliedEvents: string[]; // Names of active life events that hit in this specific year
}

export interface Milestone {
  id: string;
  name: string;
  targetValue: number;
  achievedAge: number | null;
  achievedYear: number | null;
  description: string;
}

