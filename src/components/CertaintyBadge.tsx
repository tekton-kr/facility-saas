import { CERTAINTY_LABEL } from '../lib/format.ts'
import type { Certainty } from '../types/domain.ts'

type Props = {
  certainty: Certainty
}

export function CertaintyBadge({ certainty }: Props) {
  return <span className={`badge is-${certainty}`}>{CERTAINTY_LABEL[certainty]}</span>
}
