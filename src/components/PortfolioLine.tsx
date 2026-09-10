import { Link } from 'react-router-dom'
import type { PortfolioHeadline } from '../lib/roleHome.ts'

type Props = {
  headline: PortfolioHeadline
  to: string
}

export function PortfolioLine({ headline, to }: Props) {
  return (
    <Link className={`portfolio-line is-${headline.severity}`} to={to}>
      <span className="portfolio-line-text">{headline.text}</span>
      {headline.rest > 0 ? (
        <span className="portfolio-line-rest">다른 {headline.rest}곳도 예외</span>
      ) : null}
      <span className="portfolio-line-go">열기</span>
    </Link>
  )
}
