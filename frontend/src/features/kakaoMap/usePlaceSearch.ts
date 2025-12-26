import { useCallback, useState } from "react";
import type { LatLng } from "./OriginPickerMap";

export type PlaceItem = {
  id: string;
  name: string;
  address: string;
  roadAddress: string;
  point: LatLng;
};

export function usePlaceSearch() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PlaceItem[]>([]);

  const search = useCallback(async (keyword: string) => {
    const kakao = (window as any).kakao;
    if (!kakao?.maps?.services) {
      setResults([]);
      return;
    }
    const trimmed = keyword.trim();
    if (!trimmed) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const ps = new kakao.maps.services.Places();
      ps.keywordSearch(trimmed, (data: any[], status: any) => {
        setLoading(false);

        if (status !== kakao.maps.services.Status.OK) {
          setResults([]);
          return;
        }

        const mapped: PlaceItem[] = data.map((d: any) => ({
          id: d.id,
          name: d.place_name,
          address: d.address_name ?? "",
          roadAddress: d.road_address_name ?? "",
          point: { lat: Number(d.y), lng: Number(d.x) },
        }));
        setResults(mapped);
      });
    } catch {
      setLoading(false);
      setResults([]);
    }
  }, []);

  return { loading, results, search, setResults };
}
