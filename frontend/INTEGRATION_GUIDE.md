# CongestionBadge 미션 카드 통합 가이드

## 🎯 목표
기존 MissionCard 컴포넌트에 실시간 혼잡도 배지를 추가하여 사용자에게 장소의 혼잡도 정보를 시각적으로 제공합니다.

---

## 📦 1. 타입 정의 추가

### `src/types/appointment.ts` 수정

```typescript
// 기존 Appointment 인터페이스에 추가
export interface Appointment {
  // ... 기존 필드들

  // 혼잡도 정보 (선택적 필드)
  congestionLevel?: number; // 1-5
  congestionText?: string; // "여유", "보통", "혼잡" 등
  placeCode?: string; // 서울시 장소 코드
}
```

---

## 🔧 2. MissionCard 컴포넌트 수정

### `src/components/MissionCard.tsx`

#### 2.1. Import 추가

```typescript
import CongestionBadge from './CongestionBadge';
import { useSingleCongestion } from '../hooks/useCongestion';
```

#### 2.2. 컴포넌트 내부에 Hook 추가

```typescript
const MissionCard = ({ appointment, count = 1 }: MissionCardProps) => {
  // ... 기존 코드

  // 혼잡도 데이터 조회 (장소 코드가 있을 때만)
  const { data: congestionData } = useSingleCongestion(
    appointment.placeCode || null
  );

  // ... 나머지 코드
```

#### 2.3. 헤더에 혼잡도 배지 추가

**기존 코드 (line 371-387):**
```tsx
<div className="flex items-center justify-between px-4 py-3">
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
      <span className="text-lg">
        {appointment.missionTitle ? '🎯' : '❓'}
      </span>
    </div>
    <span className="font-bold text-gray-900">
      {appointment.missionTitle || '미션 미선택'}
    </span>
  </div>

  {/* 뱃지/날짜 영역 */}
  <div className="flex gap-2">
    {renderHeaderRight()}
  </div>
</div>
```

**수정 후:**
```tsx
<div className="flex items-center justify-between px-4 py-3">
  <div className="flex items-center gap-2">
    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
      <span className="text-lg">
        {appointment.missionTitle ? '🎯' : '❓'}
      </span>
    </div>
    <span className="font-bold text-gray-900">
      {appointment.missionTitle || '미션 미선택'}
    </span>
  </div>

  {/* 뱃지/날짜 영역 */}
  <div className="flex gap-2">
    {/* 혼잡도 배지 추가 */}
    {congestionData && (
      <CongestionBadge
        level={congestionData.congestionLevel}
        placeName={congestionData.placeName}
        variant="compact"
      />
    )}
    {renderHeaderRight()}
  </div>
</div>
```

#### 2.4. 푸터에 혼잡도 상세 정보 추가 (선택사항)

**기존 장소 정보 표시 부분 (line 300-304):**
```tsx
{/* 장소명 */}
{appointment.placeName && (
  <div className="font-bold text-gray-900 text-base mb-1">
    📍 {appointment.placeName}
  </div>
)}
```

**수정 후:**
```tsx
{/* 장소명 + 혼잡도 */}
{appointment.placeName && (
  <div className="space-y-2 mb-3">
    <div className="font-bold text-gray-900 text-base">
      📍 {appointment.placeName}
    </div>
    {/* 혼잡도 상세 배지 */}
    {congestionData && (
      <CongestionBadge
        level={congestionData.congestionLevel}
        placeName={congestionData.placeName}
        variant="default"
      />
    )}
  </div>
)}
```

---

## 📊 3. API 연동 (서버에서 혼잡도 데이터 포함)

### 백엔드 수정 (선택사항)

혼잡도 데이터를 Appointment 응답에 직접 포함하려면:

#### `AppointmentResponse.java` 수정

```java
public class AppointmentResponse {
    // ... 기존 필드들

    // 혼잡도 정보 추가
    private Integer congestionLevel;
    private String congestionText;
    private String placeCode;

    public static AppointmentResponse from(Appointment appointment) {
        // ... 기존 변환 로직

        // 혼잡도 정보 조회 및 설정
        if (appointment.getPlace() != null) {
            String placeCode = findPlaceCode(appointment.getPlace());
            if (placeCode != null) {
                CongestionData congestion = getCongestionData(placeCode);
                response.setCongestionLevel(congestion.getLevel());
                response.setCongestionText(congestion.getText());
                response.setPlaceCode(placeCode);
            }
        }

        return response;
    }
}
```

---

## 🎨 4. 스타일 커스터마이징

### 프로젝트 브랜드 색상 적용

프로젝트의 네온/힙한 스타일에 맞게 배지 색상 수정:

#### `CongestionBadge.tsx` 커스터마이징

```typescript
// 기존 파스텔 톤 대신 프로젝트 브랜드 색상 적용
case 1: // 여유
  return {
    icon: '🟢',
    text: '지금 여유로워요',
    shortText: '여유',
    bgColor: 'bg-electric-lime bg-opacity-20', // 프로젝트 브랜드 색상
    textColor: 'text-electric-lime-dark',
    borderColor: 'border-electric-lime',
    gradientFrom: 'from-electric-lime',
    gradientTo: 'to-green-400',
  };
```

---

## 🧪 5. 테스트

### 5.1. 개발 서버 실행

```bash
# 백엔드
cd backend
./mvnw spring-boot:run

# 프론트엔드
cd frontend
npm run dev
```

### 5.2. 테스트 시나리오

1. **혼잡도 데이터 있는 장소**
   - 서울시 120개 주요 장소 중 하나로 약속 생성
   - 미션 카드에 혼잡도 배지 표시 확인
   - 색상이 혼잡도 레벨에 맞게 표시되는지 확인

2. **혼잡도 데이터 없는 장소**
   - 서울시 데이터에 없는 장소로 약속 생성
   - 배지가 표시되지 않는지 확인 (정상 동작)

3. **다양한 혼잡도 레벨**
   - Level 1 (여유): 초록색 배지
   - Level 2 (보통): 파란색 배지
   - Level 3 (약간 붐빔): 노란색 배지
   - Level 4 (붐빔): 주황색 배지
   - Level 5 (매우 붐빔): 빨간색 배지

---

## 🚀 6. 예시 코드 전체

### 완성된 MissionCard 예시

```tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CongestionBadge from './CongestionBadge';
import { useSingleCongestion } from '../hooks/useCongestion';
import { Appointment } from '../types/appointment';

interface MissionCardProps {
  appointment: Appointment;
  count?: number;
}

const MissionCard = ({ appointment, count = 1 }: MissionCardProps) => {
  const navigate = useNavigate();

  // 혼잡도 데이터 조회
  const { data: congestionData, loading } = useSingleCongestion(
    appointment.placeCode || null
  );

  // ... 기존 코드들

  return (
    <div className="bg-white border-b border-gray-100 overflow-hidden last:border-b-0">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <span className="text-lg">🎯</span>
          </div>
          <span className="font-bold text-gray-900">
            {appointment.missionTitle}
          </span>
        </div>

        <div className="flex gap-2">
          {/* 혼잡도 배지 */}
          {!loading && congestionData && (
            <CongestionBadge
              level={congestionData.congestionLevel}
              placeName={congestionData.placeName}
              variant="compact"
            />
          )}
          {/* D-day 배지 */}
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
            ⏳ D-2
          </span>
        </div>
      </div>

      {/* 바디 - 이미지 */}
      {/* ... 기존 코드 ... */}

      {/* 푸터 */}
      <div className="px-4 py-3">
        {/* 장소 정보 + 혼잡도 */}
        {appointment.placeName && (
          <div className="space-y-2 mb-3">
            <div className="font-bold text-gray-900 text-base">
              📍 {appointment.placeName}
            </div>
            {!loading && congestionData && (
              <CongestionBadge
                level={congestionData.congestionLevel}
                placeName={congestionData.placeName}
                variant="default"
              />
            )}
          </div>
        )}

        {/* ... 기존 코드 ... */}
      </div>
    </div>
  );
};

export default MissionCard;
```

---

## 📱 7. 모바일 반응형 고려사항

### 작은 화면에서 배지 레이아웃

```tsx
{/* 모바일에서는 배지를 세로로 정렬 */}
<div className="flex flex-col sm:flex-row gap-2">
  {congestionData && (
    <CongestionBadge
      level={congestionData.congestionLevel}
      placeName={congestionData.placeName}
      variant="compact"
    />
  )}
  <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
    ⏳ D-2
  </span>
</div>
```

---

## 🎯 8. 다음 단계

1. ✅ CongestionBadge 컴포넌트 생성 완료
2. ✅ API 연동 Hook 작성 완료
3. [ ] MissionCard에 통합 (이 가이드 참고)
4. [ ] 실제 데이터로 테스트
5. [ ] 사용자 피드백 수집
6. [ ] 추가 최적화 (캐싱, 로딩 상태 등)

---

## 💡 팁

1. **성능 최적화**: useSingleCongestion Hook은 자동으로 중복 요청을 방지합니다.
2. **에러 처리**: 혼잡도 데이터가 없어도 미션 카드는 정상 작동합니다.
3. **로딩 상태**: loading 상태를 확인하여 배지가 깜빡이지 않도록 합니다.
4. **캐싱**: React Query나 SWR을 사용하면 더 나은 캐싱이 가능합니다.

---

**작성일:** 2026-01-20
**버전:** 1.0.0
**문의:** 개발팀
