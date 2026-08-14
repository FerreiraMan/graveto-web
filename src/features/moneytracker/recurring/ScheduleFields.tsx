import { DAYS_OF_WEEK, FREQUENCIES, FREQUENCY_LABELS, requiresDayOfMonth, requiresDayOfWeek, type Frequency } from './types'

// Shared frequency/day-of-month/day-of-week/business-day/date-range fields,
// used identically by both create forms (transaction, transfer) and both
// update forms — the schedule shape is the same regardless of what's being
// scheduled. idPrefix keeps element ids unique when a page renders more
// than one instance (e.g. create + update side by side).
export function ScheduleFields({
  idPrefix,
  frequency,
  onFrequencyChange,
  dayOfMonth,
  onDayOfMonthChange,
  dayOfWeek,
  onDayOfWeekChange,
  adjustToBusinessDay,
  onAdjustToBusinessDayChange,
  endDate,
  onEndDateChange,
  fieldErrors,
  showDayFields = true,
}: {
  idPrefix: string
  frequency: Frequency
  onFrequencyChange: (frequency: Frequency) => void
  dayOfMonth: string
  onDayOfMonthChange: (value: string) => void
  dayOfWeek: string
  onDayOfWeekChange: (value: string) => void
  adjustToBusinessDay: boolean
  onAdjustToBusinessDayChange: (value: boolean) => void
  endDate: string
  onEndDateChange: (value: string) => void
  fieldErrors: Record<string, string>
  // Update forms only collect a new day-of-month/day-of-week when the user
  // actually changes frequency (the API never echoes the existing value
  // back, and omitting it on update leaves it untouched server-side) — set
  // to false to hide these two inputs in that "unchanged" state.
  showDayFields?: boolean
}) {
  return (
    <>
      <div>
        <label htmlFor={`${idPrefix}-frequency`}>Frequency</label>
        <select
          id={`${idPrefix}-frequency`}
          value={frequency}
          onChange={(e) => onFrequencyChange(e.target.value as Frequency)}
        >
          {FREQUENCIES.map((f) => (
            <option key={f} value={f}>
              {FREQUENCY_LABELS[f]}
            </option>
          ))}
        </select>
        {fieldErrors.frequency && <span>{fieldErrors.frequency}</span>}
      </div>

      {showDayFields && requiresDayOfMonth(frequency) && (
        <div>
          <label htmlFor={`${idPrefix}-day-of-month`}>Day of month</label>
          <input
            id={`${idPrefix}-day-of-month`}
            type="number"
            min="1"
            max="31"
            required
            value={dayOfMonth}
            onChange={(e) => onDayOfMonthChange(e.target.value)}
          />
          {fieldErrors.dayOfMonth && <span>{fieldErrors.dayOfMonth}</span>}
        </div>
      )}

      {showDayFields && requiresDayOfWeek(frequency) && (
        <div>
          <label htmlFor={`${idPrefix}-day-of-week`}>Day of week</label>
          <select
            id={`${idPrefix}-day-of-week`}
            required
            value={dayOfWeek}
            onChange={(e) => onDayOfWeekChange(e.target.value)}
          >
            <option value="" disabled>
              Select a day
            </option>
            {DAYS_OF_WEEK.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          {fieldErrors.dayOfWeek && <span>{fieldErrors.dayOfWeek}</span>}
        </div>
      )}

      <div>
        <label htmlFor={`${idPrefix}-adjust-to-business-day`}>
          <input
            id={`${idPrefix}-adjust-to-business-day`}
            type="checkbox"
            checked={adjustToBusinessDay}
            onChange={(e) => onAdjustToBusinessDayChange(e.target.checked)}
          />
          Adjust to nearest business day
        </label>
        {fieldErrors.adjustToBusinessDay && <span>{fieldErrors.adjustToBusinessDay}</span>}
      </div>

      <div>
        <label htmlFor={`${idPrefix}-end-date`}>End date (optional)</label>
        <input
          id={`${idPrefix}-end-date`}
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
        />
        {fieldErrors.endDate && <span>{fieldErrors.endDate}</span>}
      </div>
    </>
  )
}
