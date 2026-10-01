export {}

type KakaoLatLng = {
  getLat: () => number
  getLng: () => number
}

type KakaoMap = {
  setCenter: (position: KakaoLatLng) => void
  setLevel: (level: number) => void
  setBounds: (bounds: KakaoLatLngBounds) => void
  relayout: () => void
}

type KakaoLatLngBounds = {
  extend: (position: KakaoLatLng) => void
}

type KakaoOverlay = {
  setMap: (map: KakaoMap | null) => void
}

type KakaoSearchResult = Array<{ x: string; y: string }>

interface KakaoMaps {
  load: (callback: () => void) => void
  LatLng: new (lat: number, lng: number) => KakaoLatLng
  LatLngBounds: new () => KakaoLatLngBounds
  Map: new (container: HTMLElement, options: { center: KakaoLatLng; level: number }) => KakaoMap
  CustomOverlay: new (options: { position: KakaoLatLng; content: HTMLElement; yAnchor?: number; xAnchor?: number }) => KakaoOverlay
  services: {
    Status: { OK: string }
    Geocoder: new () => {
      addressSearch: (address: string, callback: (result: KakaoSearchResult, status: string) => void) => void
    }
    Places: new () => {
      keywordSearch: (keyword: string, callback: (result: KakaoSearchResult, status: string) => void) => void
    }
  }
}

declare global {
  interface Window {
    kakao?: { maps: KakaoMaps }
  }
}
