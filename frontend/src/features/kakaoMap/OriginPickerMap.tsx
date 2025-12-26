import React, { useEffect, useRef } from "react";

export type LatLng = { lat: number; lng: number };

type Props = {
  center: LatLng;
  selected: LatLng | null;
  onPick: (pos: LatLng) => void;
};

export function OriginPickerMap({ center, selected, onPick }: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapObjRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    const kakao = (window as any).kakao;
    if (!kakao?.maps?.LatLng || !mapRef.current) return;    

    const map = new kakao.maps.Map(mapRef.current, {
      center: new kakao.maps.LatLng(center.lat, center.lng),
      level: 3,
    });
    mapObjRef.current = map;

    const marker = new kakao.maps.Marker({
      position: new kakao.maps.LatLng(center.lat, center.lng),
    });
    marker.setMap(map);
    markerRef.current = marker;

    kakao.maps.event.addListener(map, "click", (mouseEvent: any) => {
      const latlng = mouseEvent.latLng;
      const next = { lat: latlng.getLat(), lng: latlng.getLng() };
      marker.setPosition(latlng);
      onPick(next);
    });
  }, []);

  // selected가 바뀌면 지도/마커 동기화
  useEffect(() => {
    const kakao = (window as any).kakao;
    const map = mapObjRef.current;
    const marker = markerRef.current;
    if (!kakao?.maps || !map || !marker || !selected) return;

    const ll = new kakao.maps.LatLng(selected.lat, selected.lng);
    marker.setPosition(ll);
    map.panTo(ll);
  }, [selected?.lat, selected?.lng]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: "360px", borderRadius: 12, overflow: "hidden" }}
    />
  );
}
