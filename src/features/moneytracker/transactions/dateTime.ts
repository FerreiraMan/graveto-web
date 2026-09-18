export interface DateTimeValue {
  date: string
  time: string
}

// "now" in the browser's local timezone, split into the date/time pair
// this field pair operates on — used to default new entries to the
// current moment rather than starting empty.
export function nowDateTime(): DateTimeValue {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
  const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`
  return { date, time }
}

// Combines the split fields back into the datetime-local shape the API
// already accepts. Empty date means no value at all (backend defaults
// occurredAt server-side); empty time with a date present defaults to
// midnight, same as a bare date always has.
export function combineDateTime({ date, time }: DateTimeValue): string | undefined {
  if (!date) return undefined
  return `${date}T${time || '00:00'}`
}
