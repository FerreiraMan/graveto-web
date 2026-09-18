import styles from '../MoneyTracker.module.css'

// Splits datetime-local into separate date + time inputs. Three reasons:
// 1. type="datetime-local" renders one combined calendar+clock widget
//    whose time segment is fussy to operate (small hit targets, easy to
//    fat-finger the wrong minute) — separate inputs let the browser use
//    its plain two-segment time stepper instead, which is easier to type
//    into directly (e.g. "930A") as well as click through.
// 2. Defaulting the time to "now" (see nowDateTime in dateTime.ts)
//    removes the interaction entirely for the common case (logging
//    something that just happened) — most transactions don't need a
//    deliberately-picked time at all, only a deliberately-picked date.
// 3. Native type="time" displays 12h/24h purely based on OS/browser
//    locale, with no attribute able to override it — hour is a plain
//    <select> (0-23) instead, so the clock always reads 24h regardless
//    of the visitor's locale. Minute stays a free-typed number rather
//    than a dropdown, since stepping it to e.g. 15-minute increments
//    would make exact minutes (14:37) impossible to enter.
//
// Combines back into the same "YYYY-MM-DDTHH:mm" shape the API expects
// (see combineDateTime in dateTime.ts), so the caller's submit logic
// doesn't need to change.
const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

export function DateTimeField({
  idPrefix,
  label,
  date,
  time,
  onDateChange,
  onTimeChange,
  error,
}: {
  idPrefix: string
  label: string
  date: string
  time: string
  onDateChange: (value: string) => void
  onTimeChange: (value: string) => void
  error?: string
}) {
  const [hour = '00', minute = '00'] = time ? time.split(':') : []

  function handleHourChange(newHour: string) {
    onTimeChange(`${newHour}:${minute}`)
  }

  function handleMinuteChange(newMinute: string) {
    const digitsOnly = newMinute.replace(/\D/g, '').slice(0, 2)
    const clamped = digitsOnly === '' ? '' : String(Math.min(59, Number(digitsOnly))).padStart(2, '0')
    onTimeChange(`${hour}:${clamped || '00'}`)
  }

  return (
    <div className={styles.field}>
      <label htmlFor={`${idPrefix}-date`}>{label}</label>
      <div className={styles.dateTimeRow}>
        <input id={`${idPrefix}-date`} type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
        <div className={styles.timeOfDay}>
          <select
            id={`${idPrefix}-hour`}
            aria-label={`${label} — hour (24h)`}
            value={hour}
            onChange={(e) => handleHourChange(e.target.value)}
          >
            {HOURS.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <span aria-hidden="true">:</span>
          <input
            id={`${idPrefix}-minute`}
            type="text"
            inputMode="numeric"
            maxLength={2}
            aria-label={`${label} — minute`}
            value={minute}
            onChange={(e) => handleMinuteChange(e.target.value)}
          />
        </div>
      </div>
      {error && <span className={styles.fieldError}>{error}</span>}
    </div>
  )
}
