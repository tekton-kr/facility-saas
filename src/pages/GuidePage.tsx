import { LegalFrame } from './LegalPage.tsx'

type Feature = {
  id: string
  name: string
  when: string
  need: string[]
  steps: string[]
  done: string
}

type PageDoc = {
  id: string
  name: string
  summary: string
  common: Feature[]
  advanced: Feature[]
}

const PAGES: PageDoc[] = [
  {
    id: 'enter',
    name: '들어가기',
    summary: '두 역할 모두 로그인 화면에서 시작합니다. 문은 역할마다 다릅니다.',
    common: [
      {
        id: 'enter-staff',
        name: '관리소장·시설직원으로 들어가기',
        when: '방재실에서 등록된 휴대폰으로 들어올 때',
        need: ['등록된 휴대폰 번호', '그 번호로 받은 인증번호'],
        steps: [
          '로그인 화면에서 관리소장 · 시설직원을 고릅니다.',
          '번호를 넣고 인증번호 받기를 누릅니다.',
          '여섯 자리를 넣고 인증을 누른 뒤 로그인을 누릅니다.',
        ],
        done: '배정된 현장 화면이 열립니다. 인증번호는 3분 동안 유효하고, 60초에 한 번 다시 받을 수 있습니다.',
      },
      {
        id: 'enter-owner',
        name: '관리단·건물주로 들어가기',
        when: '배정된 이메일 계정이 있을 때',
        need: ['등록된 이메일', '비밀번호'],
        steps: [
          '로그인 화면에서 관리단 · 건물주를 고릅니다.',
          '이메일과 비밀번호를 넣고 로그인을 누릅니다.',
          '임시 비밀번호로 들어왔으면 새 비밀번호를 두 번 넣고 변경을 누릅니다.',
        ],
        done: '시설관리 화면이 열립니다. 헤더 오른쪽에는 서버에 있는 이름, 이름이 없으면 이메일이 보입니다.',
      },
    ],
    advanced: [
      {
        id: 'reset-password',
        name: '비밀번호를 다시 받기',
        when: '관리단·건물주 비밀번호가 기억나지 않을 때',
        need: ['등록된 이메일'],
        steps: [
          '관리단 · 건물주 로그인에서 비밀번호 찾기를 누릅니다.',
          '이메일을 넣고 임시 비밀번호 받기를 누릅니다.',
          '메일로 온 임시 비밀번호로 로그인한 뒤 변경을 누릅니다.',
        ],
        done: '다음부터는 새로 정한 비밀번호로 들어옵니다.',
      },
    ],
  },
  {
    id: 'facility',
    name: '시설관리',
    summary: '설비자동제어, 전력, 원격검침, 제로에너지는 두 역할의 기본 화면입니다. 여러 건물을 한눈에 보는 관제는 관리단·건물주에게 더해집니다.',
    common: [
      {
        id: 'open-service',
        name: '서비스를 바꾸기',
        when: '설비, 전력, 검침, 에너지 중 다른 화면이 필요할 때',
        need: ['로그인된 시설관리 화면'],
        steps: [
          '관리소장·시설직원은 상단의 서비스 탭을 누릅니다.',
          '관리단·건물주는 기본 화면에서도 같은 네 서비스로 이동합니다. 가운데 카드는 아래 고급기능입니다.',
        ],
        done: '설비자동제어, 전력, 원격검침, 제로에너지 중 고른 화면이 열립니다. 설비자동제어가 기본입니다.',
      },
      {
        id: 'one-site',
        name: '배정된 건물 열기',
        when: '맡은 건물 하나를 볼 때',
        need: ['왼쪽 현장 목록'],
        steps: [
          '왼쪽 목록에서 건물 이름을 누릅니다.',
          '그 건물의 설비와 알람을 봅니다.',
        ],
        done: '배정된 건물만 열립니다. 목록에 없는 건물은 이 계정에 없습니다.',
      },
      {
        id: 'fullscreen',
        name: '화면을 가득 채우기',
        when: '화면을 크게 볼 때',
        need: ['헤더 오른쪽의 전체 보기 아이콘'],
        steps: [
          '네 모서리 아이콘을 누릅니다.',
          '되돌릴 때는 Esc를 누르거나 같은 아이콘을 다시 누릅니다.',
        ],
        done: '브라우저 안을 화면 전체로 씁니다.',
      },
      {
        id: 'go-back',
        name: '이전 화면으로 돌아가기',
        when: '프로필, 계약, 설정처럼 다른 화면으로 들어온 뒤',
        need: ['헤더 왼쪽'],
        steps: ['뒤로 가기 아이콘을 누릅니다.'],
        done: '바로 전에 보던 화면으로 돌아갑니다. 출발 화면에서는 이 아이콘이 없습니다.',
      },
      {
        id: 'pick-theme',
        name: '색감 고르기',
        when: '화면 색을 바꾸고 싶을 때',
        need: ['설정의 색감'],
        steps: [
          '왼쪽 관리에서 설정을 엽니다.',
          '남색, 청록, 하양, 하늘, 모래, 민트 중에서 고릅니다.',
        ],
        done: '고른 색은 이 브라우저에 남습니다. 남색이 기본입니다.',
      },
    ],
    advanced: [
      {
        id: 'read-place',
        name: '전체 현장과 건물 이름 보기',
        when: '관리단·건물주가 여러 건물 중 어디를 보는지 확인할 때',
        need: ['관리단·건물주 로그인'],
        steps: [
          '헤더 왼쪽 큰 글자를 봅니다.',
          '건물을 고르지 않았고 배정 건물이 둘 이상이면 전체 현장이라고 나옵니다.',
          '왼쪽 목록에서 건물을 누르면 그 건물 이름으로 바뀝니다.',
          '배정 건물이 하나뿐이면 고르지 않아도 그 이름이 나옵니다.',
        ],
        done: '큰 글자는 장소이고, 그 위의 작은 글자는 지금 보는 서비스입니다.',
      },
      {
        id: 'service-cards',
        name: '가운데 카드로 서비스 보기',
        when: '여러 건물의 설비, 전력, 검침, 에너지를 한 화면에서 볼 때',
        need: ['관리단·건물주 메인'],
        steps: [
          '가운데 네 장의 카드를 봅니다.',
          '보려는 카드를 누릅니다.',
        ],
        done: '헤더의 작은 글자가 그 서비스 이름으로 바뀝니다.',
      },
      {
        id: 'open-map',
        name: '지도에서 건물 열기',
        when: '건물 위치를 보고 그 현장으로 들어가고 싶을 때',
        need: ['관리단·건물주 메인의 지도'],
        steps: [
          '건물 모형 마커를 누릅니다.',
          '카드에서 이름과 상태를 확인합니다.',
          '이 건물 보기를 누릅니다.',
        ],
        done: '헤더 제목이 그 건물 이름으로 바뀝니다. 카드에 위치 예시가 있으면 좌표가 없어 주소나 이름으로 잡은 자리입니다.',
      },
      {
        id: 'read-sample',
        name: '받은 값과 예시 구분하기',
        when: '숫자가 현장 값인지 확인할 때',
        need: ['관리단·건물주 메인'],
        steps: [
          '점선으로 된 예시 표시가 있는 숫자, 건물, 위치를 찾습니다.',
          '그 표시가 없는 건물 이름, 주소, 알람, 설비 수는 서버에서 온 값입니다.',
        ],
        done: '예시는 아직 수신되지 않아 화면을 채운 값입니다. 수신되면 그 자리에 실제 값이 들어옵니다.',
      },
    ],
  },
  {
    id: 'alarm',
    name: '알람과 공지',
    summary: '오른쪽 아이콘은 두 역할이 같이 씁니다.',
    common: [
      {
        id: 'read-alarm',
        name: '알람 보기',
        when: '지금 알아야 할 이상이 있는지 볼 때',
        need: ['화면 오른쪽 아이콘'],
        steps: [
          '오른쪽의 종 아이콘을 누릅니다.',
          '목록에서 항목을 누르면 그 알람이 있는 현장으로 이동합니다.',
          '같은 종을 다시 누르면 목록이 접힙니다.',
        ],
        done: '지금 보고 있는 범위의 알람만 나옵니다. 없으면 현재 범위에 알람이 없습니다라고 나옵니다.',
      },
      {
        id: 'read-notice',
        name: '공지 보기',
        when: '운영 공지를 읽을 때',
        need: ['화면 오른쪽 아이콘'],
        steps: [
          '종 아래의 공지 아이콘을 누릅니다.',
          '제목과 내용을 읽습니다.',
          '같은 아이콘을 다시 누르면 닫힙니다.',
        ],
        done: '서버에 등록된 공지가 나옵니다. 없으면 등록된 공지가 없습니다라고 나옵니다.',
      },
    ],
    advanced: [],
  },
  {
    id: 'profile',
    name: '프로필',
    summary: '누구로 들어왔는지 확인하는 화면입니다.',
    common: [
      {
        id: 'read-name',
        name: '이름 확인하기',
        when: '화면에 나오는 사람이 누구인지 볼 때',
        need: ['로그인된 계정'],
        steps: [
          '헤더 오른쪽의 이름 또는 이메일을 누릅니다.',
          '프로필의 이름 칸과 배정 건물을 봅니다.',
        ],
        done: '서버에 이름이 있으면 그 이름이 나옵니다. 비어 있으면 서버에 등록된 이름이 없습니다라고 나옵니다. 이 화면에서 이름을 저장하지는 않습니다.',
      },
    ],
    advanced: [],
  },
  {
    id: 'contract',
    name: '계약',
    summary: '건물의 유지보수 계약을 봅니다.',
    common: [
      {
        id: 'open-contract',
        name: '건물 계약 열기',
        when: '유지보수 기간과 범위를 볼 때',
        need: ['왼쪽 관리의 계약', '고른 건물'],
        steps: [
          '왼쪽에서 건물을 고릅니다.',
          '관리에서 계약을 누릅니다.',
        ],
        done: '그 건물의 계약 화면이 열립니다. 건물을 고르지 않았으면 건물을 고르라는 안내가 나옵니다.',
      },
    ],
    advanced: [],
  },
  {
    id: 'packages',
    name: '개보수',
    summary: '개보수 후보 목록입니다.',
    common: [
      {
        id: 'open-packages',
        name: '개보수 후보 열기',
        when: '손볼 후보를 볼 때',
        need: ['왼쪽 관리의 개보수'],
        steps: ['개보수를 누릅니다.', '목록에서 항목을 눌러 내용을 봅니다.'],
        done: '개보수 후보가 열립니다.',
      },
    ],
    advanced: [],
  },
  {
    id: 'work',
    name: '작업',
    summary: '현장 작업 목록입니다. 방재실에서 주로 쓰고, 관리단·건물주도 같은 목록을 엽니다.',
    common: [
      {
        id: 'open-work',
        name: '작업 목록 열기',
        when: '현장에서 진행하는 작업을 볼 때',
        need: ['왼쪽 관리의 작업'],
        steps: [
          '건물을 고른 뒤 작업을 누릅니다.',
          '건물을 고르지 않았으면 작업 목록에서 범위를 확인합니다.',
        ],
        done: '그 범위의 작업이 열립니다.',
      },
    ],
    advanced: [],
  },
  {
    id: 'settings',
    name: '설정',
    summary: '계정 범위와 고지를 보는 화면입니다.',
    common: [
      {
        id: 'open-settings',
        name: '설정 열기',
        when: '역할 범위나 고지를 확인할 때',
        need: ['왼쪽 관리의 설정'],
        steps: ['설정을 누릅니다.', '아래의 이용방법, 이용약관, 개인정보처리방침으로 이동할 수 있습니다.'],
        done: '설정 화면이 열립니다.',
      },
    ],
    advanced: [],
  },
  {
    id: 'leave',
    name: '나가기',
    summary: '이 브라우저의 로그인을 끝냅니다.',
    common: [
      {
        id: 'sign-out',
        name: '로그아웃',
        when: '로그인을 끝낼 때',
        need: ['헤더 오른쪽 계정'],
        steps: [
          '이름 옆의 로그아웃을 누릅니다.',
          '현장에 고정된 화면이면 교대 종료를 누릅니다.',
        ],
        done: '로그인 화면으로 돌아갑니다. 다음에 들어올 때는 마지막으로 고른 역할이 먼저 열립니다.',
      },
    ],
    advanced: [],
  },
]

function FeatureList({ items }: { items: Feature[] }) {
  if (items.length === 0) {
    return <p className="band-empty">이 페이지에 더해지는 고급기능은 없습니다.</p>
  }
  return (
    <>
      {items.map((feature) => (
        <article key={feature.id} id={feature.id} className="recipe">
          <h3>{feature.name}</h3>
          <p className="recipe-when">{feature.when}</p>
          <h4>준비</h4>
          <ul>
            {feature.need.map((item) => <li key={item}>{item}</li>)}
          </ul>
          <h4>순서</h4>
          <ol>
            {feature.steps.map((step) => <li key={step}>{step}</li>)}
          </ol>
          <p className="recipe-yield"><strong>되면</strong> {feature.done}</p>
        </article>
      ))}
    </>
  )
}

export function GuidePage() {
  const toc = PAGES.flatMap((page) => [
    { id: page.id, label: page.name, kind: 'page' as const },
    ...page.advanced.map((feature) => ({ id: feature.id, label: feature.name, kind: 'advanced' as const })),
  ])

  return (
    <LegalFrame title="이용방법" lede="공통기능은 두 역할, 고급기능은 관리단·건물주" wide>
      <p>
        관리소장·시설직원과 관리단·건물주는 기본 페이지를 같이 씁니다. 관리단·건물주 화면에는 여러 건물을 보는 고급기능이 더해집니다.
      </p>
      <div className="guide-layout">
        <nav className="guide-toc" aria-label="페이지">
          <p>페이지</p>
          <ol>
            {toc.map((item) => (
              <li key={item.id} className={item.kind === 'advanced' ? 'is-advanced' : ''}>
                <a href={`#${item.id}`}>
                  <span>{item.kind === 'page' ? String(PAGES.findIndex((page) => page.id === item.id) + 1).padStart(2, '0') : ''}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div>
          {PAGES.map((page, index) => (
            <section key={page.id} id={page.id} className="guide-page">
              <p className="recipe-no">{String(index + 1).padStart(2, '0')}</p>
              <h2>{page.name}</h2>
              <p>{page.summary}</p>
              <div className="band is-common">
                <h3><span className="band-mark">공통기능</span> 관리소장·시설직원, 관리단·건물주</h3>
                <FeatureList items={page.common} />
              </div>
              <div className="band is-advanced">
                <h3><span className="band-mark">고급기능</span> 관리단·건물주</h3>
                <FeatureList items={page.advanced} />
              </div>
            </section>
          ))}
        </div>
      </div>
    </LegalFrame>
  )
}
