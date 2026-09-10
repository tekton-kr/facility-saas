# T-ARCH

빌딩·유틸리티 시설 관제 프론트엔드. Vite + React, 조회 전용. 별표 1 기준 **59면**.

## 실행

```bash
cp .env.example .env
```

`.env`의 `API_ORIGIN`에 중앙 조회 서버 origin을 넣습니다. 브라우저는 `VITE_API_BASE`(`/api/v1`)로 요청하고, 개발 서버가 그 요청을 중앙 서버로 넘깁니다. 소스에 비밀번호를 두지 않습니다.

```bash
npm install
npm run dev
```

[http://localhost:5173](http://localhost:5173)

```bash
npm run build
npm run preview
```

계약 점검:

```bash
npm run check:contract
npm run check:load
```

문서: 로컬 `docs/` (git에 올리지 않음)

## 구조

- 도메인 앱: 이벤트 · 전력 · 검침 · 태양광 · 주차 · EV.
- 사이트 모델: 현장 → 계통 → 장비 → 관제점. 추가 = 카탈로그 + 조회 API.
- 이벤트 셸: 알람 → 도면 → CCTV 딥링크.
- 쓰기는 소스에 없음. 절감액은 추정.
- 화면 목록: `/screens`
