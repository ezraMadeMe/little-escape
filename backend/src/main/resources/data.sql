-- ========================================
-- 초기 데이터 (data.sql)
-- Spring Boot 시작 시 자동 실행 (spring.sql.init.mode=always)
-- 모든 INSERT는 멱등성 보장 (IF NOT EXISTS / WHERE NOT EXISTS)
-- DDL(ALTER/CREATE TABLE)은 Hibernate ddl-auto: update 가 관리
-- ========================================

-- ========================================
-- 태그가 적용된 미션 템플릿 업데이트
-- ========================================

-- 포장마차 (술 관련)
UPDATE mission_templates SET tags = 'ALCOHOL_ONLY' WHERE title = '가산 포장마차 거리 가기' AND (tags IS NULL OR tags = '');

-- 한강 자전거 타기 (높은 활동량)
UPDATE mission_templates SET tags = 'HIGH_ACTIVITY' WHERE title = '한강 자전거 타기' AND (tags IS NULL OR tags = '');

-- 새벽 운동 (스포츠/운동)
UPDATE mission_templates SET tags = 'HIGH_ACTIVITY,SPORTS_REQUIRED' WHERE title = '새벽 운동' AND (tags IS NULL OR tags = '');

-- 실내 클라이밍 (스포츠/운동)
UPDATE mission_templates SET tags = 'SPORTS_REQUIRED' WHERE title = '실내 클라이밍' AND (tags IS NULL OR tags = '');

-- 가산 헬스장 운동 (스포츠/운동)
UPDATE mission_templates SET tags = 'SPORTS_REQUIRED' WHERE title = '가산 헬스장 운동' AND (tags IS NULL OR tags = '');

-- LP 바 (술 관련 가능성)
UPDATE mission_templates SET tags = 'ALCOHOL_ONLY' WHERE title = 'LP 바에서 음악 듣기' AND (tags IS NULL OR tags = '');

-- 장한평 야시장 (술 관련 가능성)
UPDATE mission_templates SET tags = 'ALCOHOL_ONLY' WHERE title = '장한평 야시장 구경' AND (tags IS NULL OR tags = '');

-- 리셋 워크 25 (걷기)
UPDATE mission_templates SET tags = 'HIGH_ACTIVITY' WHERE title = '리셋 워크 25' AND (tags IS NULL OR tags = '');

-- 계단 리셋 12 (높은 활동량)
UPDATE mission_templates SET tags = 'HIGH_ACTIVITY' WHERE title = '계단 리셋 12' AND (tags IS NULL OR tags = '');

-- 미니 하이킹 30 (높은 활동량, 야외)
UPDATE mission_templates SET tags = 'HIGH_ACTIVITY,OUTDOOR_REQUIRED' WHERE title = '미니 하이킹 30' AND (tags IS NULL OR tags = '');

-- 천변 바람 22 (야외)
UPDATE mission_templates SET tags = 'OUTDOOR_REQUIRED' WHERE title = '천변 바람 22' AND (tags IS NULL OR tags = '');

-- 답십리 공원 조깅 (높은 활동량, 스포츠)
UPDATE mission_templates SET tags = 'HIGH_ACTIVITY,SPORTS_REQUIRED' WHERE title = '답십리 공원 조깅' AND (tags IS NULL OR tags = '');

-- ========================================
-- 단계별 가이드(Guide) 데이터
-- ========================================

-- 천변 바람 22 (산책 후 카페 코스)
UPDATE mission_templates
SET guide = '[
    {"icon": "WALK", "title": "중랑천 바람 쐬기", "desc": "장한평역 3번 출구에서 뚝방길 따라 20분 걷기. 이어폰 필수."},
    {"icon": "DRINK", "title": "감성 충전", "desc": "사이에섬에서 시그니처 칵테일 한 잔 시키고 야경 보기."}
]'::jsonb
WHERE title = '천변 바람 22' AND guide IS NULL;

-- 장한평 서점 방문 (서점 → 카페 코스)
UPDATE mission_templates
SET guide = '[
    {"icon": "BOOK", "title": "책 구경하기", "desc": "서점에서 30분 천천히 둘러보기. 마음에 드는 책 1권 메모."},
    {"icon": "COFFEE", "title": "카페 타임", "desc": "근처 카페에서 아메리카노 한 잔과 함께 여유 부리기."}
]'::jsonb
WHERE title = '장한평 서점 방문' AND guide IS NULL;

-- 미니 하이킹 30 (하이킹 → 휴식 코스)
UPDATE mission_templates
SET guide = '[
    {"icon": "HIKE", "title": "오르막 걷기", "desc": "30분 천천히 등산로 오르기. 호흡 유지하며 무리하지 않기."},
    {"icon": "REST", "title": "정상에서 휴식", "desc": "물 2모금 마시고 발목/종아리 스트레치. 주변 소리 듣기."}
]'::jsonb
WHERE title = '미니 하이킹 30' AND guide IS NULL;

-- 디저트 한 입 + 10분 산책 (디저트 → 산책 코스)
UPDATE mission_templates
SET guide = '[
    {"icon": "DESSERT", "title": "디저트 픽업", "desc": "베이커리나 디저트 카페에서 테이크아웃. 편의점도 괜찮아."},
    {"icon": "WALK", "title": "산책하며 먹기", "desc": "10분 걸으며 천천히 먹기. 가장 맛있는 한 입의 이유 생각해보기."}
]'::jsonb
WHERE title = '디저트 한 입 + 10분 산책' AND guide IS NULL;

-- ========================================
-- THEME A: 걷기/리셋 미션 템플릿 (10개)
-- ========================================

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '리셋 워크 25', '생각이 많을 땐 그냥 걷는 게 답이야. 가까운 산책 루트에서 25분만 걸어봐. 걷는 동안 마음이 편해진 순간 1개를 기억해.', 'ACTIVITY', 'EASY', '맑은 날씨 추천 · 금요일 저녁이나 주말 오전 · 공원이나 산책로 어딘가', 'https://images.unsplash.com/photo-1502134249126-9f3755a50d78?w=800&q=80', 'OUTDOOR', 'MORNING', 37.5665, 126.9780, '서울 성동구 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '리셋 워크 25');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '계단 리셋 12', '계단이나 언덕 구간을 천천히 12분 올라봐. 무리하지 마. 정상에서 숨이 가라앉는 1분 동안 주변 소리 3개 들어봐.', 'ACTIVITY', 'MEDIUM', '낮 시간 추천 · 체력에 맞춰 조절해 · 전망대나 언덕 공원 근처', 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80', 'OUTDOOR', 'AFTERNOON', 37.5850, 127.0010, '서울 종로구 언덕 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '계단 리셋 12');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '루틴 걷기+스트레치 8', '10분 천천히 걷고, 가벼운 스트레치 3종(목/어깨/종아리) 중 1개 선택해서 2분. 핸드폰은 내려둬.', 'ACTIVITY', 'EASY', '광장이나 공원 · 저녁이나 주말 오전 · 조용한 공간이면 더 좋아', 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80', 'OUTDOOR', 'ANY', 37.5500, 126.9900, '서울 광장 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '루틴 걷기+스트레치 8');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '노을 타임 15', '노을이 보이는 방향으로 15분만 걸어봐. 하늘 색 2가지를 마음속으로 이름 붙여봐. 뭐라고 부를지는 네 마음대로야.', 'RELAX', 'EASY', '해질녘(17:00~20:00) · 맑은 날씨 필수 · 노을 명소나 강변', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', 'OUTDOOR', 'AFTERNOON', 37.5326, 126.9900, '한강공원 근처',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '노을 타임 15');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '천천히 한 바퀴 20', '원형 루프(둘레길/호수)를 20분 걸어봐. 출발점으로 돌아왔는지 확인해. 원점 회귀가 포인트야.', 'ACTIVITY', 'EASY', '둘레길이나 호수 공원 · 주말 오전이나 오후 · 평지 산책 추천', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80', 'OUTDOOR', 'ANY', 37.5200, 127.1200, '서울 둘레길 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '천천히 한 바퀴 20');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '조용한 길 18', '차도에서 한 블록 떨어진 길로 18분 걸어봐. 소리(사람/바람/기계) 중 가장 작은 소리 1개를 찾아봐.', 'RELAX', 'EASY', '평일 저녁이나 주말 밤 · 근린공원이나 주택가 산책로 · 조용한 곳 추천', 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&q=80', 'OUTDOOR', 'NIGHT', 37.5400, 127.0700, '서울 주택가 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '조용한 길 18');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '미니 하이킹 30', '오르막 구간을 30분(호흡 유지) 걸어봐. 물 2모금 마시고 발목/종아리 스트레치 1회. 무리하지 마.', 'ACTIVITY', 'HARD', '주말 오전(09:00~13:00) · 등산로 입구나 숲길 · 초보자는 평지로 전환해도 돼', 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80', 'OUTDOOR', 'MORNING', 37.6100, 127.0300, '서울 근교 산 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '미니 하이킹 30');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '천변 바람 22', '바람이 느껴지는 방향으로 22분 걸어봐. 걷는 동안 눈에 들어온 파란색 3개를 세봐. 하늘? 간판? 옷? 뭐든 좋아.', 'ACTIVITY', 'EASY', '천변 산책로나 강변 공원 · 오후나 저녁 · 바람 불 때가 좋아', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80', 'OUTDOOR', 'AFTERNOON', 37.5219, 127.0411, '성수동 한강 입구 근처',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '천변 바람 22');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '1정거장 내려 걷기 16', '대중교통 1정거장 전/후로 내려 16분 걸어봐. 가장 좋았던 간판이나 가게 이름 1개를 머릿속으로 메모해.', 'ACTIVITY', 'EASY', '평일 퇴근길이나 금요일 저녁 · 역 주변 산책로나 시장 거리 · 인도 안전 주의', 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=800&q=80', 'OUTDOOR', 'NIGHT', 37.5600, 127.0000, '서울 역 주변 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '1정거장 내려 걷기 16');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '공기 바꾸기 10', '집이나 현재 위치에서 10분만 걸어서 바깥 공기 마셔봐. 돌아오기 전에 심호흡 5회.', 'RELAX', 'EASY', '언제든지 가능 · 근린공원이나 동네 산책로 · 비 오면 건물 로비도 괜찮아', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80', 'ANY', 'ANY', 37.5700, 126.9800, '집 근처 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '공기 바꾸기 10');

-- ========================================
-- THEME B: 도시 마이크로 어드벤처 (10개)
-- ========================================

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '낯선 골목 20', '평소 안 가던 블록이나 골목을 20분 탐험해봐. 마음에 드는 디테일(문, 창문, 간판) 사진 1장 찍어도 좋고 안 찍어도 돼.', 'CULTURE', 'EASY', '낮 시간이나 밝은 시간대 · 골목길이나 벽화마을 · 큰 길 위주로 해도 괜찮아', 'https://images.unsplash.com/photo-1555532538-dcdbd01d3781?w=800&q=80', 'OUTDOOR', 'AFTERNOON', 37.5443, 127.0557, '성수동 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '낯선 골목 20');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '3가지 색 찾기 18', '18분 동안 빨강/파랑/초록 중 3색을 찾아봐. 가장 많이 본 색 1개를 선택해 이유를 한 문장으로 생각해봐.', 'CULTURE', 'EASY', '거리나 광장, 공원 · 낮 시간 추천 · 날씨 애매하면 실내 쇼핑몰도 괜찮아', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80', 'ANY', 'ANY', 37.5300, 127.0000, '서울 거리 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '3가지 색 찾기 18');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '편집숍/서점 루프 25', '독립서점이나 편집숍에서 25분 천천히 둘러봐. 마음에 드는 물건이나 책 1개를 ''나중에''로 저장해. 사진이나 메모로.', 'CULTURE', 'EASY', '실내라 날씨 상관없어 · 영업시간 확인 필수 · 대형서점도 괜찮아', 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=800&q=80', 'INDOOR', 'ANY', 37.5443, 127.0557, '성수동 골목 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '편집숍/서점 루프 25');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '전시/갤러리 30', '전시나 갤러리에서 30분 관람해봐(한 작품에 1분 이상). 가장 오래 본 작품 1개를 한 단어로 표현해봐.', 'CULTURE', 'EASY', '주말 오후 · 전시장이나 미술관 · 무료/유료 혼재(예산 범위 확인)', 'https://images.unsplash.com/photo-1499781350541-7783f6c6a0c8?w=800&q=80', 'INDOOR', 'AFTERNOON', 37.5170, 127.0470, '서울 전시장 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '전시/갤러리 30');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '버스 2정거장 미션 15', '버스나 지하철 2정거장 이동 후, 내린 곳에서 15분 걸어봐. 처음 본 가게나 건물 1개를 발견하고 이름(간판) 기록해봐.', 'ACTIVITY', 'MEDIUM', '금요일 저녁이나 주말 · 버스정류장이나 역 주변 · 이동 귀찮으면 도보 탐험도 괜찮아', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&q=80', 'OUTDOOR', 'AFTERNOON', 37.5500, 127.0500, '서울 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '버스 2정거장 미션 15');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '카페 20 + 사람 구경 5', '카페에서 20분 머물러봐(폰 잠깐 내려둬). 밖을 보며 ''기분 좋아 보이는 사람'' 포인트 1개를 관찰해봐.', 'RELAX', 'EASY', '카페나 베이커리 카페 · 오전이나 오후 · 혼잡하면 테이크아웃 후 공원도 괜찮아', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80', 'INDOOR', 'ANY', 37.5200, 127.0300, '서울 카페 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '카페 20 + 사람 구경 5');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '야경 한 포인트 12', '야경이 보이는 포인트에서 12분 머물러봐. 가장 밝은 빛 1개를 찾고 ''왜 밝아 보이는지'' 생각해봐.', 'RELAX', 'EASY', '금요일이나 토요일 저녁(19:00~23:00) · 야경 명소나 전망대 · 추우면 실내 전망 카페도 괜찮아', 'https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=800&q=80', 'OUTDOOR', 'NIGHT', 37.5100, 127.0600, '서울 야경 명소 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '야경 한 포인트 12');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '지도 핀 5개 찍기', '15분 산책하며 마음에 든 장소 5개를 ''마음''으로 저장(핀)해봐. 핀 중 1개를 ''다음에 올 이유'' 한 문장으로 적어봐.', 'CULTURE', 'EASY', '주말 오후 · 거리나 공원, 시장 · 메모 기능 부담되면 사진 1장으로 대체해도 돼', 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800&q=80', 'OUTDOOR', 'AFTERNOON', 37.5400, 127.0400, '서울 거리 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '지도 핀 5개 찍기');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '디저트 한 입 + 10분 산책', '디저트 테이크아웃 후 10분만 걸어봐. 걷는 동안 ''가장 맛있게 느껴진 한 입''의 이유 1개를 떠올려봐.', 'FOOD', 'EASY', '디저트나 베이커리, 젤라또 · 오후나 저녁 · 편의점 디저트도 괜찮아', 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80', 'OUTDOOR', 'AFTERNOON', 37.5350, 127.0250, '서울 베이커리 근처',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '디저트 한 입 + 10분 산책');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, is_place_required, created_at, updated_at)
SELECT '한 구역 벗어나기 20', '평소 생활권에서 한 구역(동/역) 벗어나 20분 걸어봐. ''이 동네는 이런 느낌'' 한 문장으로 요약해봐.', 'ACTIVITY', 'MEDIUM', '금요일 저녁이나 주말 · 동네 명소나 시장, 공원 · 이동 부담되면 반경 축소해도 돼', 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80', 'OUTDOOR', 'AFTERNOON', 37.5600, 127.0200, '서울 어딘가',false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '한 구역 벗어나기 20');

-- ========================================
-- 기존 places 데이터 → detail 테이블 마이그레이션
-- 멱등성 보장 (ON CONFLICT DO NOTHING)
-- Hibernate ddl-auto:update가 테이블 생성 후 실행됨
-- ========================================

-- places → place_detail_performance (공연/축제/문화행사)
INSERT INTO place_detail_performance (place_id, start_date, end_date, ticket_price, performance_state, created_at, updated_at)
SELECT id, start_date, end_date, ticket_price, performance_state, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM places
WHERE data_source IN ('KOPIS', 'SEOUL_CULTURE', 'SEOUL_RESERVATION')
  AND (start_date IS NOT NULL OR performance_state IS NOT NULL)
  AND id NOT IN (SELECT place_id FROM place_detail_performance)
ON CONFLICT (place_id) DO NOTHING;

-- places → place_detail_facility (도서관/시설)
INSERT INTO place_detail_facility (place_id, operating_time, closed_days, created_at, updated_at)
SELECT id, operating_time, closed_days, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM places
WHERE data_source IN ('LIBRARY', 'SEOUL_PARK')
  AND (operating_time IS NOT NULL OR closed_days IS NOT NULL)
  AND id NOT IN (SELECT place_id FROM place_detail_facility)
ON CONFLICT (place_id) DO NOTHING;

-- ========================================
-- 닉네임 생성용 형용사 데이터
-- ========================================

INSERT INTO adjectives (word) SELECT '행복한' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '행복한');
INSERT INTO adjectives (word) SELECT '나른한' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '나른한');
INSERT INTO adjectives (word) SELECT '배고픈' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '배고픈');
INSERT INTO adjectives (word) SELECT '즐거운' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '즐거운');
INSERT INTO adjectives (word) SELECT '설레는' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '설레는');
INSERT INTO adjectives (word) SELECT '활기찬' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '활기찬');
INSERT INTO adjectives (word) SELECT '편안한' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '편안한');
INSERT INTO adjectives (word) SELECT '상쾌한' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '상쾌한');
INSERT INTO adjectives (word) SELECT '신나는' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '신나는');
INSERT INTO adjectives (word) SELECT '포근한' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '포근한');
INSERT INTO adjectives (word) SELECT '여유로운' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '여유로운');
INSERT INTO adjectives (word) SELECT '따뜻한' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '따뜻한');
INSERT INTO adjectives (word) SELECT '용감한' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '용감한');
INSERT INTO adjectives (word) SELECT '재미있는' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '재미있는');
INSERT INTO adjectives (word) SELECT '귀여운' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '귀여운');
INSERT INTO adjectives (word) SELECT '멋진' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '멋진');
INSERT INTO adjectives (word) SELECT '활발한' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '활발한');
INSERT INTO adjectives (word) SELECT '사랑스러운' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '사랑스러운');
INSERT INTO adjectives (word) SELECT '차분한' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '차분한');
INSERT INTO adjectives (word) SELECT '밝은' WHERE NOT EXISTS (SELECT 1 FROM adjectives WHERE word = '밝은');
