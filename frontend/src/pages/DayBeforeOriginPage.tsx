import React, { useEffect, useMemo, useState } from "react";
import { loadKakaoSdk, getKakaoJsKey } from "../features/kakaoMap/lib/kakaoSdk";
import { OriginPickerMap, LatLng } from "../features/kakaoMap/OriginPickerMap";
import { usePlaceSearch } from "../features/kakaoMap/usePlaceSearch";

type Props = {
  onNext: (origin: LatLng) => void;
};

export function DayBeforeOriginPage({ onNext }: Props) {
  const [sdkReady, setSdkReady] = useState(false);

  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<LatLng | null>(null);
  const [selectedLabel, setSelectedLabel] = useState<string>("");

  const { loading, results, search, setResults } = usePlaceSearch();

  const defaultCenter = useMemo<LatLng>(() => ({ lat: 37.5665, lng: 126.9780 }), []);

  useEffect(() => {
    const key = getKakaoJsKey();
    loadKakaoSdk(key).then(() => setSdkReady(true)).catch(() => setSdkReady(false));
  }, []);

  const reverseGeocode = (pos: LatLng) => {
    const kakao = (window as any).kakao;
    if (!kakao?.maps?.services) return;
    const geocoder = new kakao.maps.services.Geocoder();
    geocoder.coord2Address(pos.lng, pos.lat, (res: any[], status: any) => {
      if (status !== kakao.maps.services.Status.OK) return;
      const addr = res?.[0]?.address?.address_name;
      if (addr) setSelectedLabel(addr);
    });
  };

  const pick = (pos: LatLng, label?: string) => {
    setSelected(pos);
    if (label) setSelectedLabel(label);
    else {
      setSelectedLabel("");
      reverseGeocode(pos);
    }
  };

  const onSubmitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    search(query);
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => pick({ lat: p.coords.latitude, lng: p.coords.longitude }, "현재 위치"),
      () => {}
    );
  };

  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      <h2>출발 위치 지정</h2>

      {/* 검색(C) */}
      <form onSubmit={onSubmitSearch} style={{ display: "flex", gap: 8 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="출발 위치 검색 (역/카페/주소)"
          style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
        />
        <button type="submit" style={{ padding: "10px 12px" }}>
          검색
        </button>
        <button type="button" onClick={useMyLocation} style={{ padding: "10px 12px" }}>
          현재위치
        </button>
      </form>

      {/* 검색 결과 리스트 */}
      {loading && <div>검색 중…</div>}
      {!loading && results.length > 0 && (
        <div style={{ border: "1px solid #eee", borderRadius: 12, overflow: "hidden" }}>
          {results.slice(0, 6).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                pick(r.point, r.roadAddress || r.address || r.name);
                setResults([]); // 선택 후 닫기 (MVP)
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: 12,
                border: "none",
                borderBottom: "1px solid #f2f2f2",
                background: "white",
              }}
            >
              <div style={{ fontWeight: 700 }}>{r.name}</div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {r.roadAddress || r.address}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* 지도(A) */}
      {!sdkReady ? (
        <div style={{ height: 360, display: "grid", placeItems: "center", border: "1px solid #eee", borderRadius: 12 }}>
          지도 로딩 실패/대기 중…
        </div>
      ) : (
        <OriginPickerMap
          center={selected ?? defaultCenter}
          selected={selected}
          onPick={(pos) => pick(pos)}
        />
      )}

      <div style={{ fontSize: 14, opacity: 0.8 }}>
        선택됨: {selected ? (selectedLabel || `${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}`) : "아직 선택 안 함"}
      </div>

      <button
        type="button"
        disabled={!selected}
        onClick={() => selected && onNext(selected)}
        style={{
          padding: 14,
          borderRadius: 12,
          border: "none",
          opacity: selected ? 1 : 0.5,
          fontWeight: 800,
        }}
      >
        이 위치로 출발
      </button>

      {/* ✅ lat/lng 입력은 여기서 완전히 없음 */}
    </div>
  );
}
