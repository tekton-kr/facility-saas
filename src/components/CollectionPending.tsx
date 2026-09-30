import type { ReactNode } from 'react'

type Props = {
  title: string
  children?: ReactNode
}

export function CollectionPending({ title, children }: Props) {
  return (
    <div className="empty collection-pending">
      <h1>{title}</h1>
      <p>아직 수집하지 않습니다. 0으로 채우지 않습니다. 업체 협의 후 같은 자리에 예외가 붙습니다.</p>
      {children}
    </div>
  )
}
