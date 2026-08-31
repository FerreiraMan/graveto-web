// Deliberately permissive — this only catches the "clearly not an email"
// case (missing @, missing domain) so the user gets an immediate, styled
// in-app message instead of relying on the browser's own unstyled native
// validation bubble (easy to miss, inconsistent across browsers, and not
// visually integrated with the app's design). The backend remains the
// source of truth for what's actually a valid, deliverable email.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_PATTERN.test(email)
}
