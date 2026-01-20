-- ========================================
-- 서울시 120개 주요 장소 초기 데이터
-- ========================================
-- 출처: 서울시 실시간 도시데이터 API
-- API 문서: https://data.seoul.go.kr/dataList/OA-21285/F/1/datasetView.do
--
-- 초기 등록: MVP용 10개 주요 장소
-- 향후 확장: 120개 전체 장소 추가 예정
--
-- 주의사항:
-- - place_code는 서울시 API의 실제 POI ID
-- - latitude, longitude는 WGS84 좌표계
-- - is_valid는 초기값 true (스케줄러가 자동 갱신)
-- - congestion_level 등 실시간 데이터는 스케줄러가 채움
-- ========================================

-- ========================================
-- MVP: 서울시 10대 주요 관광지/핫플
-- ========================================

-- 1. 광화문·덕수궁 (종로구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000001', '광화문·덕수궁', 'POI000001', '종로구',
    37.5665, 126.9780,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000001'
);

-- 2. 서울역 (용산구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000002', '서울역', 'POI000002', '용산구',
    37.5547, 126.9707,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000002'
);

-- 3. 강남역 (강남구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000003', '강남역', 'POI000003', '강남구',
    37.4979, 127.0276,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000003'
);

-- 4. 홍대입구역 (마포구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000004', '홍대입구역', 'POI000004', '마포구',
    37.5568, 126.9236,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000004'
);

-- 5. 명동 (중구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000005', '명동', 'POI000005', '중구',
    37.5636, 126.9852,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000005'
);

-- 6. 이태원·한남동 (용산구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000006', '이태원·한남동', 'POI000006', '용산구',
    37.5349, 126.9944,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000006'
);

-- 7. 여의도 (영등포구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000007', '여의도', 'POI000007', '영등포구',
    37.5219, 126.9245,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000007'
);

-- 8. 잠실 (송파구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000008', '잠실', 'POI000008', '송파구',
    37.5133, 127.1000,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000008'
);

-- 9. 북촌·인사동 (종로구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000009', '북촌·인사동', 'POI000009', '종로구',
    37.5833, 126.9833,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000009'
);

-- 10. 성수동 (성동구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000010', '성수동', 'POI000010', '성동구',
    37.5443, 127.0557,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000010'
);

-- ========================================
-- 향후 확장: 추가 110개 장소 (주석으로 목록 기록)
-- ========================================
--
-- 강북권 (40개):
-- - POI000011~050: 동대문, 신촌, 압구정, 삼청동, 경복궁, 창덕궁,
--                   익선동, 을지로, 망원동, 합정, 연남동, 상수,
--                   삼각지, 한강진, 혜화, 대학로, 성북동, 안암,
--                   고려대, 건대입구, 왕십리, 신설동, 청량리 등
--
-- 강남권 (40개):
-- - POI000051~090: 신논현, 논현, 압구정로데오, 청담, 선릉, 역삼,
--                   삼성역, 강남대로, 서초, 교대, 방배, 사당,
--                   신림, 봉천, 노량진, 대방, 이수, 동작,
--                   반포, 고속터미널, 양재, 가로수길, 신사,
--                   도산공원, 압구정, 잠원, 한남 등
--
-- 동남권 (20개):
-- - POI000091~110: 송파, 문정, 가락시장, 석촌호수, 올림픽공원,
--                   방이, 오금, 개롱, 거여, 마천, 천호,
--                   길동, 둔촌, 암사, 고덕, 상일동,
--                   강동구청, 명일 등
--
-- 서남권 (20개):
-- - POI000111~120: 목동, 신월, 까치산, 구로, 금천, 가산,
--                   독산, 신도림, 대림, 영등포, 당산,
--                   문래, 신길, 대방, 구일, 개봉, 오류,
--                   천왕, 온수, 관악 등
--
-- ========================================
-- 초기 데이터 검증 쿼리
-- ========================================
--
-- SELECT COUNT(*) AS total_places FROM seoul_city_places;
-- SELECT place_code, place_name, area_name, latitude, longitude
-- FROM seoul_city_places
-- ORDER BY place_code;
--
-- ========================================
