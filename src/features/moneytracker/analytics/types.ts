export interface MonthlyCashFlow {
  month: number
  income: number
  expense: number
  netFlow: number
  balanceAtEndOfMonth: number
}

export interface CashFlowReport {
  yearsWithCashFlows: number[]
  year: number
  yearlyIncome: number
  yearlyExpense: number
  yearlyNetFlow: number
  balanceAtEndOfYear: number
  monthlyCashFlow: MonthlyCashFlow[]
}
