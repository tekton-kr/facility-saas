import { useEffect, useState } from 'react'
import { getField, subscribeField } from './field.ts'

export function useField() {
  const [field, setField] = useState(getField)

  useEffect(() => subscribeField(() => setField(getField())), [])

  return field
}
