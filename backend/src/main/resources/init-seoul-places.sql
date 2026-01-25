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
-- 향후 확장: 추가 110개 장소
-- ========================================

-- ========================================
-- 강북권 (40개)
-- ========================================

-- 11. 동대문 (중구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000011', '동대문', 'POI000011', '중구',
    37.5707, 127.0094,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000011'
);

-- 12. 신촌 (서대문구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000012', '신촌', 'POI000012', '서대문구',
    37.5559, 126.9364,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000012'
);

-- 13. 삼청동 (종로구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000013', '삼청동', 'POI000013', '종로구',
    37.5864, 126.9826,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000013'
);

-- 14. 경복궁 (종로구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000014', '경복궁', 'POI000014', '종로구',
    37.5796, 126.9770,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000014'
);

-- 15. 창덕궁 (종로구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000015', '창덕궁', 'POI000015', '종로구',
    37.5794, 126.9910,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000015'
);

-- 16. 익선동 (종로구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000016', '익선동', 'POI000016', '종로구',
    37.5718, 126.9850,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000016'
);

-- 17. 을지로 (중구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000017', '을지로', 'POI000017', '중구',
    37.5664, 126.9910,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000017'
);

-- 18. 망원동 (마포구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000018', '망원동', 'POI000018', '마포구',
    37.5556, 126.9101,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000018'
);

-- 19. 합정 (마포구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000019', '합정', 'POI000019', '마포구',
    37.5495, 126.9138,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000019'
);

-- 20. 연남동 (마포구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000020', '연남동', 'POI000020', '마포구',
    37.5651, 126.9245,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000020'
);

-- 21. 상수 (마포구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000021', '상수', 'POI000021', '마포구',
    37.5478, 126.9223,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000021'
);

-- 22. 삼각지 (용산구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000022', '삼각지', 'POI000022', '용산구',
    37.5347, 126.9729,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000022'
);

-- 23. 한강진 (용산구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000023', '한강진', 'POI000023', '용산구',
    37.5315, 126.9951,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000023'
);

-- 24. 혜화 (종로구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000024', '혜화', 'POI000024', '종로구',
    37.5820, 127.0017,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000024'
);

-- 25. 대학로 (종로구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000025', '대학로', 'POI000025', '종로구',
    37.5830, 127.0013,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000025'
);

-- 26. 성북동 (성북구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000026', '성북동', 'POI000026', '성북구',
    37.5933, 127.0009,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000026'
);

-- 27. 안암 (성북구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000027', '안암', 'POI000027', '성북구',
    37.5854, 127.0297,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000027'
);

-- 28. 고려대 (성북구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000028', '고려대', 'POI000028', '성북구',
    37.5894, 127.0325,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000028'
);

-- 29. 건대입구 (광진구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000029', '건대입구', 'POI000029', '광진구',
    37.5403, 127.0698,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000029'
);

-- 30. 왕십리 (성동구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000030', '왕십리', 'POI000030', '성동구',
    37.5613, 127.0378,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000030'
);

-- 31. 신설동 (동대문구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000031', '신설동', 'POI000031', '동대문구',
    37.5753, 127.0251,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000031'
);

-- 32. 청량리 (동대문구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000032', '청량리', 'POI000032', '동대문구',
    37.5800, 127.0472,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000032'
);

-- 33. 종로 (종로구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000033', '종로', 'POI000033', '종로구',
    37.5703, 126.9830,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000033'
);

-- 34. 이화여대 (서대문구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000034', '이화여대', 'POI000034', '서대문구',
    37.5596, 126.9467,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000034'
);

-- 35. 한성대입구 (성북구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000035', '한성대입구', 'POI000035', '성북구',
    37.5887, 127.0063,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000035'
);

-- 36. 성신여대입구 (성북구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000036', '성신여대입구', 'POI000036', '성북구',
    37.5924, 127.0165,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000036'
);

-- 37. 용두동 (동대문구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000037', '용두동', 'POI000037', '동대문구',
    37.5743, 127.0383,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000037'
);

-- 38. 회기 (동대문구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000038', '회기', 'POI000038', '동대문구',
    37.5894, 127.0574,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000038'
);

-- 39. 외대앞 (동대문구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000039', '외대앞', 'POI000039', '동대문구',
    37.5964, 127.0598,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000039'
);

-- 40. 신당 (중구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000040', '신당', 'POI000040', '중구',
    37.5660, 127.0178,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000040'
);

-- 41. 약수 (중구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000041', '약수', 'POI000041', '중구',
    37.5543, 127.0109,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000041'
);

-- 42. 금호 (성동구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000042', '금호', 'POI000042', '성동구',
    37.5476, 127.0170,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000042'
);

-- 43. 옥수 (성동구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000043', '옥수', 'POI000043', '성동구',
    37.5403, 127.0178,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000043'
);

-- 44. 응봉 (성동구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000044', '응봉', 'POI000044', '성동구',
    37.5502, 127.0263,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000044'
);

-- 45. 뚝섬 (광진구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000045', '뚝섬', 'POI000045', '광진구',
    37.5471, 127.0470,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000045'
);

-- 46. 아차산 (광진구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000046', '아차산', 'POI000046', '광진구',
    37.5574, 127.1022,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000046'
);

-- 47. 광나루 (광진구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000047', '광나루', 'POI000047', '광진구',
    37.5450, 127.0958,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000047'
);

-- 48. 구의 (광진구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000048', '구의', 'POI000048', '광진구',
    37.5372, 127.0858,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000048'
);

-- 49. 군자 (광진구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000049', '군자', 'POI000049', '광진구',
    37.5569, 127.0795,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000049'
);

-- 50. 중곡 (광진구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000050', '중곡', 'POI000050', '광진구',
    37.5657, 127.0822,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000050'
);

-- ========================================
-- 강남권 (40개)
-- ========================================

-- 51. 신논현 (강남구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000051', '신논현', 'POI000051', '강남구',
    37.5043, 127.0252,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000051'
);

-- 52. 논현 (강남구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000052', '논현', 'POI000052', '강남구',
    37.5104, 127.0221,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000052'
);

-- 53. 압구정로데오 (강남구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000053', '압구정로데오', 'POI000053', '강남구',
    37.5271, 127.0397,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000053'
);

-- 54. 청담 (강남구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000054', '청담', 'POI000054', '강남구',
    37.5195, 127.0472,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000054'
);

-- 55. 선릉 (강남구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000055', '선릉', 'POI000055', '강남구',
    37.5045, 127.0490,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000055'
);

-- 56. 역삼 (강남구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000056', '역삼', 'POI000056', '강남구',
    37.5000, 127.0364,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000056'
);

-- 57. 삼성역 (강남구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000057', '삼성역', 'POI000057', '강남구',
    37.5087, 127.0633,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000057'
);

-- 58. 강남대로 (강남구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000058', '강남대로', 'POI000058', '강남구',
    37.4979, 127.0276,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000058'
);

-- 59. 서초 (서초구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000059', '서초', 'POI000059', '서초구',
    37.4838, 127.0323,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000059'
);

-- 60. 교대 (서초구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000060', '교대', 'POI000060', '서초구',
    37.4936, 127.0144,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000060'
);

-- 61. 방배 (서초구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000061', '방배', 'POI000061', '서초구',
    37.4812, 126.9963,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000061'
);

-- 62. 사당 (동작구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000062', '사당', 'POI000062', '동작구',
    37.4763, 126.9814,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000062'
);

-- 63. 신림 (관악구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000063', '신림', 'POI000063', '관악구',
    37.4842, 126.9296,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000063'
);

-- 64. 봉천 (관악구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000064', '봉천', 'POI000064', '관악구',
    37.4817, 126.9526,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000064'
);

-- 65. 노량진 (동작구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000065', '노량진', 'POI000065', '동작구',
    37.5142, 126.9423,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000065'
);

-- 66. 대방 (동작구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000066', '대방', 'POI000066', '동작구',
    37.5133, 126.9262,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000066'
);

-- 67. 이수 (동작구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000067', '이수', 'POI000067', '동작구',
    37.4867, 126.9821,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000067'
);

-- 68. 동작 (동작구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000068', '동작', 'POI000068', '동작구',
    37.5024, 126.9395,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000068'
);

-- 69. 반포 (서초구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000069', '반포', 'POI000069', '서초구',
    37.4978, 127.0044,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000069'
);

-- 70. 고속터미널 (서초구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000070', '고속터미널', 'POI000070', '서초구',
    37.5048, 127.0047,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000070'
);

-- 71. 양재 (서초구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000071', '양재', 'POI000071', '서초구',
    37.4844, 127.0344,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000071'
);

-- 72. 가로수길 (강남구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000072', '가로수길', 'POI000072', '강남구',
    37.5196, 127.0228,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000072'
);

-- 73. 신사 (강남구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000073', '신사', 'POI000073', '강남구',
    37.5163, 127.0204,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000073'
);

-- 74. 도산공원 (강남구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000074', '도산공원', 'POI000074', '강남구',
    37.5263, 127.0385,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000074'
);

-- 75. 압구정 (강남구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000075', '압구정', 'POI000075', '강남구',
    37.5273, 127.0276,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000075'
);

-- 76. 잠원 (서초구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000076', '잠원', 'POI000076', '서초구',
    37.5146, 127.0116,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000076'
);

-- 77. 한남 (용산구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000077', '한남', 'POI000077', '용산구',
    37.5341, 127.0027,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000077'
);

-- 78. 남부터미널 (서초구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000078', '남부터미널', 'POI000078', '서초구',
    37.4764, 127.0048,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000078'
);

-- 79. 낙성대 (관악구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000079', '낙성대', 'POI000079', '관악구',
    37.4766, 126.9637,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000079'
);

-- 80. 서울대입구 (관악구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000080', '서울대입구', 'POI000080', '관악구',
    37.4813, 126.9526,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000080'
);

-- 81. 관악 (관악구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000081', '관악', 'POI000081', '관악구',
    37.4782, 126.9515,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000081'
);

-- 82. 쌍문 (도봉구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000082', '쌍문', 'POI000082', '도봉구',
    37.6506, 127.0325,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000082'
);

-- 83. 수유 (강북구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000083', '수유', 'POI000083', '강북구',
    37.6388, 127.0256,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000083'
);

-- 84. 미아 (강북구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000084', '미아', 'POI000084', '강북구',
    37.6134, 127.0297,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000084'
);

-- 85. 길음 (성북구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000085', '길음', 'POI000085', '성북구',
    37.6016, 127.0255,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000085'
);

-- 86. 돈암 (성북구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000086', '돈암', 'POI000086', '성북구',
    37.5919, 127.0177,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000086'
);

-- 87. 정릉 (성북구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000087', '정릉', 'POI000087', '성북구',
    37.6065, 127.0100,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000087'
);

-- 88. 월곡 (성북구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000088', '월곡', 'POI000088', '성북구',
    37.6065, 127.0587,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000088'
);

-- 89. 상봉 (중랑구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000089', '상봉', 'POI000089', '중랑구',
    37.5963, 127.0844,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000089'
);

-- 90. 중랑 (중랑구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000090', '중랑', 'POI000090', '중랑구',
    37.5964, 127.0856,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000090'
);

-- ========================================
-- 동남권 (20개)
-- ========================================

-- 91. 송파 (송파구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000091', '송파', 'POI000091', '송파구',
    37.5145, 127.1061,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000091'
);

-- 92. 문정 (송파구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000092', '문정', 'POI000092', '송파구',
    37.4846, 127.1222,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000092'
);

-- 93. 가락시장 (송파구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000093', '가락시장', 'POI000093', '송파구',
    37.4925, 127.1189,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000093'
);

-- 94. 석촌호수 (송파구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000094', '석촌호수', 'POI000094', '송파구',
    37.5110, 127.1007,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000094'
);

-- 95. 올림픽공원 (송파구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000095', '올림픽공원', 'POI000095', '송파구',
    37.5219, 127.1235,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000095'
);

-- 96. 방이 (송파구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000096', '방이', 'POI000096', '송파구',
    37.5099, 127.1263,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000096'
);

-- 97. 오금 (송파구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000097', '오금', 'POI000097', '송파구',
    37.5028, 127.1281,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000097'
);

-- 98. 개롱 (송파구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000098', '개롱', 'POI000098', '송파구',
    37.4922, 127.1263,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000098'
);

-- 99. 거여 (송파구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000099', '거여', 'POI000099', '송파구',
    37.4938, 127.1434,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000099'
);

-- 100. 마천 (송파구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000100', '마천', 'POI000100', '송파구',
    37.4948, 127.1475,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000100'
);

-- 101. 천호 (강동구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000101', '천호', 'POI000101', '강동구',
    37.5385, 127.1236,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000101'
);

-- 102. 길동 (강동구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000102', '길동', 'POI000102', '강동구',
    37.5377, 127.1401,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000102'
);

-- 103. 둔촌 (강동구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000103', '둔촌', 'POI000103', '강동구',
    37.5269, 127.1362,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000103'
);

-- 104. 암사 (강동구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000104', '암사', 'POI000104', '강동구',
    37.5515, 127.1281,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000104'
);

-- 105. 고덕 (강동구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000105', '고덕', 'POI000105', '강동구',
    37.5548, 127.1542,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000105'
);

-- 106. 상일동 (강동구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000106', '상일동', 'POI000106', '강동구',
    37.5567, 127.1701,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000106'
);

-- 107. 강동구청 (강동구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000107', '강동구청', 'POI000107', '강동구',
    37.5300, 127.1238,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000107'
);

-- 108. 명일 (강동구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000108', '명일', 'POI000108', '강동구',
    37.5515, 127.1477,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000108'
);

-- 109. 강일 (강동구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000109', '강일', 'POI000109', '강동구',
    37.5575, 127.1758,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000109'
);

-- 110. 미사 (강동구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000110', '미사', 'POI000110', '강동구',
    37.5605, 127.1887,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000110'
);

-- ========================================
-- 서남권 (10개) - POI000111~120
-- ========================================

-- 111. 목동 (양천구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000111', '목동', 'POI000111', '양천구',
    37.5265, 126.8754,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000111'
);

-- 112. 신월 (양천구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000112', '신월', 'POI000112', '양천구',
    37.5174, 126.8355,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000112'
);

-- 113. 까치산 (강서구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000113', '까치산', 'POI000113', '강서구',
    37.5318, 126.8456,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000113'
);

-- 114. 구로 (구로구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000114', '구로', 'POI000114', '구로구',
    37.5033, 126.8809,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000114'
);

-- 115. 금천 (금천구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000115', '금천', 'POI000115', '금천구',
    37.4568, 126.8956,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000115'
);

-- 116. 가산 (금천구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000116', '가산', 'POI000116', '금천구',
    37.4817, 126.8825,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000116'
);

-- 117. 독산 (금천구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000117', '독산', 'POI000117', '금천구',
    37.4663, 126.8926,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000117'
);

-- 118. 신도림 (구로구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000118', '신도림', 'POI000118', '구로구',
    37.5086, 126.8911,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000118'
);

-- 119. 대림 (영등포구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000119', '대림', 'POI000119', '영등포구',
    37.4932, 126.8955,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000119'
);

-- 120. 당산 (영등포구)
INSERT INTO seoul_city_places (
    place_code, place_name, area_code, area_name,
    latitude, longitude,
    congestion_level, is_valid,
    created_at, updated_at, last_updated
)
SELECT
    'POI000120', '당산', 'POI000120', '영등포구',
    37.5345, 126.9027,
    'NORMAL', true,
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (
    SELECT 1 FROM seoul_city_places WHERE place_code = 'POI000120'
);

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
