export type PasswordRule = {
  length: boolean
  letter: boolean
  digit: boolean
  symbol: boolean
  ok: boolean
}

export function passwordRule(value: string): PasswordRule {
  const length = value.length >= 6
  const letter = /[A-Za-z]/.test(value)
  const digit = /[0-9]/.test(value)
  const symbol = /[^A-Za-z0-9]/.test(value)
  return { length, letter, digit, symbol, ok: length && letter && digit && symbol }
}
