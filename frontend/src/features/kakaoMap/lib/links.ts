import type { LatLng } from "../../../shared/types/geo";
import type { TravelMode } from "../../appointment/model/types";

export function buildKakaoDeeplink(origin: LatLng, dest: LatLng, mode: TravelMode) {
  const by =
    mode === "TRANSIT" ? "PUBLICTRANSIT" :
    mode === "WALK" ? "FOOT" :
    mode === "BICYCLE" ? "BICYCLE" : "CAR";

  return `kakaomap://route?sp=${origin.lat},${origin.lng}&ep=${dest.lat},${dest.lng}&by=${by}`;
}

export function buildKakaoWebLink(origin: LatLng, dest: LatLng) {
  return `https://map.kakao.com/link/from/${encodeURIComponent("출발")},${origin.lat},${origin.lng}/to/${encodeURIComponent(
    "도착"
  )},${dest.lat},${dest.lng}`;
}
