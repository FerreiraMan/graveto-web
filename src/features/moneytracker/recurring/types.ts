export type Frequency = 'DAILY' | 'WEEKLY' | 'BI_WEEKLY' | 'MONTHLY' | 'ANNUALLY'

export const FREQUENCIES: Frequency[] = ['DAILY', 'WEEKLY', 'BI_WEEKLY', 'MONTHLY', 'ANNUALLY']

export const FREQUENCY_LABELS: Record<Frequency, string> = {
  DAILY: 'Daily',
  WEEKLY: 'Weekly',
  BI_WEEKLY: 'Every 2 weeks',
  MONTHLY: 'Monthly',
  ANNUALLY: 'Annually',
}

// MONTHLY needs dayOfMonth, WEEKLY/BI_WEEKLY need dayOfWeek — backend
// rejects create/update otherwise (IllegalStateException). DAILY/ANNUALLY
// need neither (ANNUALLY anchors off startDate).
export function requiresDayOfMonth(frequency: Frequency): boolean {
  return frequency === 'MONTHLY'
}

export function requiresDayOfWeek(frequency: Frequency): boolean {
  return frequency === 'WEEKLY' || frequency === 'BI_WEEKLY'
}

export const DAYS_OF_WEEK: { value: number; label: string }[] = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
]

export type RecurringOperationStatus = 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELED'

export const RECURRING_STATUS_LABELS: Record<RecurringOperationStatus, string> = {
  ACTIVE: 'Active',
  PAUSED: 'Paused',
  COMPLETED: 'Completed',
  CANCELED: 'Canceled',
}

// COMPLETED and CANCELED are terminal server-side (RecurringOperationStatus
// .isTerminal()) — once in either, update/cancel are both rejected. Used to
// hide the update/pause/cancel actions rather than let the user hit a 409.
export function isTerminalStatus(status: RecurringOperationStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELED'
}

// Only these are valid manual status targets — COMPLETED is scheduler-only
// (set automatically once nextExecutionDate passes endDate).
export const EDITABLE_RECURRING_STATUSES: RecurringOperationStatus[] = ['ACTIVE', 'PAUSED']

export interface RecurringEntityRef {
  sid: string
  name: string
}
