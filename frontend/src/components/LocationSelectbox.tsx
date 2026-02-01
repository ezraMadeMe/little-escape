import { useState, useEffect } from 'react';
import { SEOUL_DISTRICTS } from '../data/seoulDistricts';
import type { Hotspot } from '../data/seoulDistricts';

export interface LocationSelection {
  district: string;
  name: string;
  lat: number;
  lng: number;
}

interface LocationSelectboxProps {
  /** hotspot 선택 완료 시 콜백 */
  onSelect: (selection: LocationSelection) => void;
  /** 초기 선택된 구 이름 */
  selectedDistrict?: string;
  /** 초기 선택된 hotspot 이름 */
  selectedHotspot?: string;
  /** 테마: dark (온보딩/약속), light (DevConsole) */
  variant?: 'dark' | 'light';
  /** 추가 CSS 클래스 */
  className?: string;
}

const LocationSelectbox = ({
  onSelect,
  selectedDistrict: initialDistrict = '',
  selectedHotspot: initialHotspot = '',
  variant = 'dark',
  className = '',
}: LocationSelectboxProps) => {
  const [districtName, setDistrictName] = useState(initialDistrict);
  const [hotspotName, setHotspotName] = useState(initialHotspot);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);

  // 구 변경 시 hotspot 목록 업데이트
  useEffect(() => {
    if (districtName) {
      const district = SEOUL_DISTRICTS.find((d) => d.name === districtName);
      setHotspots(district?.hotspots ?? []);
    } else {
      setHotspots([]);
    }
  }, [districtName]);

  // 외부에서 초기값 변경 시 동기화
  useEffect(() => {
    if (initialDistrict) setDistrictName(initialDistrict);
  }, [initialDistrict]);

  useEffect(() => {
    if (initialHotspot) setHotspotName(initialHotspot);
  }, [initialHotspot]);

  const handleDistrictChange = (value: string) => {
    setDistrictName(value);
    setHotspotName(''); // 구 변경 시 hotspot 초기화
  };

  const handleHotspotChange = (value: string) => {
    setHotspotName(value);
    const hotspot = hotspots.find((h) => h.name === value);
    if (hotspot) {
      onSelect({
        district: districtName,
        name: hotspot.name,
        lat: hotspot.lat,
        lng: hotspot.lng,
      });
    }
  };

  // 테마별 스타일
  const isDark = variant === 'dark';

  const selectBase = isDark
    ? 'bg-charcoal-lighter text-off-white border border-charcoal-lighter rounded-xl px-4 py-3 focus:border-electric-lime focus:outline-none appearance-none cursor-pointer'
    : 'bg-white text-gray-900 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer';

  const selectDisabled = isDark
    ? 'opacity-40 cursor-not-allowed'
    : 'opacity-40 cursor-not-allowed';

  const labelStyle = isDark
    ? 'text-text-gray text-xs mb-1'
    : 'text-gray-500 text-xs mb-1';

  // 커스텀 드롭다운 화살표 (SVG 배경)
  const arrowStyle = isDark
    ? "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a0a0a0' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[position:right_12px_center]"
    : "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")] bg-no-repeat bg-[position:right_12px_center]";

  return (
    <div className={`flex gap-2 ${className}`}>
      {/* 구 선택 */}
      <div className="flex-1 flex flex-col">
        <label className={labelStyle}>구</label>
        <select
          value={districtName}
          onChange={(e) => handleDistrictChange(e.target.value)}
          className={`${selectBase} ${arrowStyle} pr-8 w-full`}
        >
          <option value="">구 선택</option>
          {SEOUL_DISTRICTS.map((district) => (
            <option key={district.name} value={district.name}>
              {district.name}
            </option>
          ))}
        </select>
      </div>

      {/* 지역 선택 */}
      <div className="flex-1 flex flex-col">
        <label className={labelStyle}>지역</label>
        <select
          value={hotspotName}
          onChange={(e) => handleHotspotChange(e.target.value)}
          disabled={!districtName}
          className={`${selectBase} ${arrowStyle} pr-8 w-full ${!districtName ? selectDisabled : ''}`}
        >
          <option value="">지역 선택</option>
          {hotspots.map((hotspot) => (
            <option key={hotspot.name} value={hotspot.name}>
              {hotspot.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LocationSelectbox;
