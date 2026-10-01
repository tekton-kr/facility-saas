import { useEffect, useState } from 'react'
import { getDiary, subscribeDiary } from './diary.ts'

export function useDiary() {
  const [diary, setDiary] = useState(getDiary)

  useEffect(() => subscribeDiary(() => setDiary(getDiary())), [])

  return diary
}
