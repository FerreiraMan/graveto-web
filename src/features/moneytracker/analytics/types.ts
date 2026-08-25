export interface MonthlyCashFlow {
  month: number
  income: number
  expense: number
  transfersIn: number
  transfersOut: number
  monthlyNetIncomeExpense: number
  balanceAtEndOfMonth: number
}

export interface CashFlowReport {
  yearsWithCashFlows: number[]
  year: number
  yearlyIncome: number
  yearlyExpense: number
  yearlyTransfersIn: number
  yearlyTransfersOut: number
  yearlyNetIncomeExpense: number
  balanceAtEndOfYear: number
  monthlyCashFlow: MonthlyCashFlow[]
}

export interface CategoryAggregate {
  categorySid: string
  categoryName: string
  yearlyTotal: number
  // Backend sends a Map<Integer, BigDecimal> keyed by month (1-12), always
  // zero-padded for every month regardless of whether it had any spend.
  monthlyTotals: Record<string, number>
  childCategories: CategoryAggregate[]
}

export interface CategorySpendingReport {
  year: number
  categories: CategoryAggregate[]
}

