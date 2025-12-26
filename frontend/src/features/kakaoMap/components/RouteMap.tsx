import React, { useEffect, useMemo, useRef, useState } from "react";
import type { LatLng } from "../../../shared/types/geo";
import { getKakaoJsKey } from "../lib/kakaoSdk";

declare global {
  interface Window {
    kakao?: any;
  }
}

type Props = {
  origin: LatLng;
  destination: LatLng;
  path?: LatLng[];
};

function loadKakaoSdk(appKey: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.kakao && window.kakao.maps) {
      resolve();
      return;
    }

    const existing = document.querySelector<HTMLScriptElement>('script[data-kakao-sdk="true"]');
    if (existing) {
      existing.addEventListener("load", () => resolve());
      existing.addEventListener("error", () => reject(new Error("Kakao SDK script load error")));
      return;
    }

    const script = document.createElement("script");
    script.dataset.kakaoSdk = "true";
    script.async = true;
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(
      appKey
    )}&autoload=false`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Kakao SDK script load error"));
    document.head.appendChild(script);
  });
}

export function RouteMap(props: Props) {
  const { origin, destination, path } = props;

  if (!origin || !destination) {
    return <div style={{ padding: 12, opacity: 0.7 }}>지도를 불러오는 중…</div>;
  }

  const safePath = Array.isArray(path) ? path.filter(Boolean) : [];
  const appKey = getKakaoJsKey();

  const mapEl = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const oMarkerRef = useRef<any>(null);
  const dMarkerRef = useRef<any>(null);
  const lineRef = useRef<any>(null);

  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  const coordValid = useMemo(() => {
    const latOk = (v: number) => Number.isFinite(v) && v >= -90 && v <= 90;
    const lngOk = (v: number) => Number.isFinite(v) && v >= -180 && v <= 180;
    return latOk(origin.lat) && lngOk(origin.lng) && latOk(destination.lat) && lngOk(destination.lng);
  }, [origin.lat, origin.lng, destination.lat, destination.lng]);

  const center = useMemo(() => ({ lat: origin.lat, lng: origin.lng }), [origin.lat, origin.lng]);
  
  if (!center || !destination) return null;  

  // mount: sdk + map init
  useEffect(() => {
    if (!appKey) {
      setStatus("error");
      return;
    }
    if (!mapEl.current) return;

    setStatus("loading");
    loadKakaoSdk(appKey)
      .then(() => {
        if (!window.kakao?.maps) throw new Error("kakao.maps missing");
        window.kakao.maps.load(() => {
          const center = new window.kakao.maps.LatLng(props.origin.lat, props.origin.lng);
          const map = new window.kakao.maps.Map(mapEl.current, { center, level: 6 });
          mapRef.current = map;
          setStatus("ready");
        });
      })
      .catch(() => setStatus("error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appKey]);

  // update markers/line
  useEffect(() => {
    if (status !== "ready") return;
    if (!coordValid) return;

    const map = mapRef.current;
    if (!map || !window.kakao?.maps) return;

    const o = new window.kakao.maps.LatLng(origin.lat, origin.lng);
    const d = new window.kakao.maps.LatLng(destination.lat, destination.lng);
    
    if (!oMarkerRef.current) {
      oMarkerRef.current = new window.kakao.maps.Marker({ position: o });
      oMarkerRef.current.setMap(map);
    } else {
      oMarkerRef.current.setPosition(o);
    }

    if (!dMarkerRef.current) {
      dMarkerRef.current = new window.kakao.maps.Marker({ position: d });
      dMarkerRef.current.setMap(map);
    } else {
      dMarkerRef.current.setPosition(d);
    }

    // ✅ 기존 라인 제거 (중첩 방지)
    if (lineRef.current) {
      lineRef.current.setMap(null);
      lineRef.current = null;
    }

    const pathLatLng =
    safePath.length
      ? safePath.map((p) => new window.kakao.maps.LatLng(p.lat, p.lng))
      : [o, d];
  

    const line = new window.kakao.maps.Polyline({
      path: pathLatLng,
      strokeWeight: 5,
      strokeOpacity: 0.85,
    });
    line.setMap(map);
    lineRef.current = line;

    const bounds = new window.kakao.maps.LatLngBounds();
    pathLatLng.forEach((p: any) => bounds.extend(p));
    map.setBounds(bounds);
  }, [status, coordValid, props.origin, props.destination, props.path]);

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", background: "#0f172a" }}>
      <div ref={mapEl} style={{ width: "100%", height: "100%" }} />
      {status === "error" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "grid",
            placeItems: "center",
            color: "#e5e7eb",
            background: "rgba(0,0,0,0.35)",
            fontWeight: 800,
          }}
        >
          Kakao Map 로드 실패 (키/도메인 확인)
        </div>
      )}
    </div>
  );
}
