import { useEffect, useState, type CSSProperties } from 'react'
import { usePrefersReducedMotion } from '../lib/media.ts'

export type LoginDoor = 'exec' | 'staff'

const ROOMS = [
  {
    src: '/img/login-bright-swgr.jpg',
    position: 'center',
    place: '수변전실',
    name: '전력',
    accent: '#7dd3fc',
    points: ['수전 전력을 실시간으로 봅니다', '이상 현장만 골라 냅니다', '기간을 바꿔 비교합니다'],
  },
  {
    src: '/img/login-bright-pump.jpg',
    position: 'center',
    place: '기계실',
    name: '열원',
    accent: '#5eead4',
    points: ['펌프 운전을 봅니다', '출구온도 추세를 엽니다', '야간 운전을 짚습니다'],
  },
  {
    src: '/img/login-bright-air.jpg',
    position: 'center',
    place: '공조기',
    name: '공조',
    accent: '#86efac',
    points: ['급기온도 이탈을 봅니다', '알람이 난 설비를 엽니다', '운전 상태를 확인합니다'],
  },
  {
    src: '/img/login-bright-fp.jpg',
    position: 'center',
    place: '소방펌프',
    name: '이벤트',
    accent: '#fdba74',
    points: ['위험과 주의를 나눕니다', '발생한 위치를 봅니다', '같은 알람의 이력을 엽니다'],
  },
  {
    src: '/img/login-bright-eg.jpg',
    position: 'center',
    place: '비상발전기',
    name: '감시',
    accent: '#c4b5fd',
    points: ['수신이 끊기면 바로 보입니다', '대기 전원 상태를 남깁니다', '붙은 계통만 색이 납니다'],
  },
  {
    src: '/img/login-bright-park.jpg',
    position: 'center',
    place: '주차장',
    name: '현장',
    accent: '#fde68a',
    points: ['배정된 현장만 들어갑니다', '예외가 없는 곳은 무채색입니다', '현장에서 작업으로 이어갑니다'],
  },
  {
    src: '/img/login-bright-roof.jpg',
    position: 'center',
    place: '옥상설비',
    name: '리포트',
    accent: '#93c5fd',
    points: ['사용량과 발전을 한자리에 둡니다', '기간 요약을 읽습니다', '추정과 실측을 구분합니다'],
  },
] as const

const DWELL_MS = 7200

export function LoginPreview() {
  const reduce = usePrefersReducedMotion()
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (reduce) return
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % ROOMS.length)
    }, DWELL_MS)
    return () => window.clearInterval(timer)
  }, [reduce])

  return (
    <aside className="login-preview" aria-hidden="true">
      <div className="login-stage">
        <figure className="login-stage-photo">
          {ROOMS.map((room, i) => (
            <img
              key={room.src}
              src={room.src}
              alt=""
              className={i === index ? 'is-on' : undefined}
              style={{ objectPosition: room.position }}
            />
          ))}
        </figure>
        <div className="login-stage-copy" style={{ '--slide-accent': ROOMS[index].accent } as CSSProperties}>
          <p className="login-verse">
            <small key={ROOMS[index].place}>{ROOMS[index].place}</small>
            <strong key={ROOMS[index].name}>{ROOMS[index].name}</strong>
          </p>
          <ul className="login-points" key={ROOMS[index].name}>
            {ROOMS[index].points.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
          <div className="login-progress">
            {ROOMS.map((room, i) => (
              <span key={room.src} className={i === index ? 'is-on' : undefined} />
            ))}
          </div>
        </div>
      </div>
    </aside>
  )
}
