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
