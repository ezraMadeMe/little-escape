import type { LatLng } from "../../shared/types/geo";

export type Mode = "CAR" | "TRANSIT" | "WALK" | "BICYCLE";

export type Poi = {
  name: string;
  category: "맛집" | "카페" | "볼거리";
  desc: string;
  lat: number;
  lng: number;
};

export type Candidate = {
  id: number;
  title: string;
  area: string;
  score: number;
  estMin: number;
  dest: LatLng;
  reason: string;
  pois: Poi[];
  path?: LatLng[];
};

export type RevealDestination = {
  id: string;
  name: string;
  point: LatLng;
  subtitle: string;
};

export const REVEAL_DEMO: RevealDestination[] = [
  {
    id: "d1",
    name: "한강 산책 루트",
    point: { lat: 37.5283, lng: 126.9341 },
    subtitle: "물가 걷고, 바람 맞고, 머리 비우기",
  },
  {
    id: "d2",
    name: "동네 뒷산 뷰 포인트",
    point: { lat: 37.5665, lng: 126.978 },
    subtitle: "가벼운 등반 + 전망",
  },
  {
    id: "d3",
    name: "조용한 북카페",
    point: { lat: 37.5796, lng: 126.977 },
    subtitle: "따뜻한 음료 + 책 20쪽",
  },
];