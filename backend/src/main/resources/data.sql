-- Sample Places Data for Testing
-- Only insert if places table is empty

-- FOOD category places
INSERT INTO places (name, address, url, latitude, longitude, category, created_at, updated_at)
SELECT '맛있는 파스타 레스토랑', '서울시 강남구 테헤란로 123', 'https://map.kakao.com', 37.5065, 127.0540, 'FOOD', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM places WHERE name = '맛있는 파스타 레스토랑');

INSERT INTO places (name, address, url, latitude, longitude, category, created_at, updated_at)
SELECT '한식당 정갈한밥상', '서울시 종로구 종로 45', 'https://map.kakao.com', 37.5707, 126.9916, 'FOOD', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM places WHERE name = '한식당 정갈한밥상');

INSERT INTO places (name, address, url, latitude, longitude, category, created_at, updated_at)
SELECT '스시바 도쿄', '서울시 강남구 역삼동 789', 'https://map.kakao.com', 37.5000, 127.0360, 'FOOD', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM places WHERE name = '스시바 도쿄');

-- ACTIVITY category places
INSERT INTO places (name, address, url, latitude, longitude, category, created_at, updated_at)
SELECT '서울숲 산책로', '서울시 성동구 서울숲길 100', 'https://map.kakao.com', 37.5443, 127.0374, 'ACTIVITY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM places WHERE name = '서울숲 산책로');

INSERT INTO places (name, address, url, latitude, longitude, category, created_at, updated_at)
SELECT '실내 클라이밍 짐', '서울시 마포구 홍대입구 56', 'https://map.kakao.com', 37.5559, 126.9239, 'ACTIVITY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM places WHERE name = '실내 클라이밍 짐');

INSERT INTO places (name, address, url, latitude, longitude, category, created_at, updated_at)
SELECT '한강 자전거길', '서울시 영등포구 여의도동 한강공원', 'https://map.kakao.com', 37.5289, 126.9345, 'ACTIVITY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM places WHERE name = '한강 자전거길');

-- RELAX category places
INSERT INTO places (name, address, url, latitude, longitude, category, created_at, updated_at)
SELECT '아늑한 카페 온', '서울시 강남구 신사동 12', 'https://map.kakao.com', 37.5172, 127.0286, 'RELAX', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM places WHERE name = '아늑한 카페 온');

INSERT INTO places (name, address, url, latitude, longitude, category, created_at, updated_at)
SELECT '힐링 스파 센터', '서울시 서초구 서초동 234', 'https://map.kakao.com', 37.4837, 127.0324, 'RELAX', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM places WHERE name = '힐링 스파 센터');

INSERT INTO places (name, address, url, latitude, longitude, category, created_at, updated_at)
SELECT '북카페 책과쉼', '서울시 용산구 이태원로 78', 'https://map.kakao.com', 37.5345, 126.9945, 'RELAX', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM places WHERE name = '북카페 책과쉼');

-- CULTURE category places
INSERT INTO places (name, address, url, latitude, longitude, category, created_at, updated_at)
SELECT '국립중앙박물관', '서울시 용산구 서빙고로 137', 'https://www.museum.go.kr', 37.5239, 126.9803, 'CULTURE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM places WHERE name = '국립중앙박물관');

INSERT INTO places (name, address, url, latitude, longitude, category, created_at, updated_at)
SELECT '예술의전당', '서울시 서초구 남부순환로 2406', 'https://www.sac.or.kr', 37.4779, 127.0122, 'CULTURE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM places WHERE name = '예술의전당');

INSERT INTO places (name, address, url, latitude, longitude, category, created_at, updated_at)
SELECT '인디 영화관 씨네큐브', '서울시 종로구 돈화문로 25', 'https://map.kakao.com', 37.5753, 127.0012, 'CULTURE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM places WHERE name = '인디 영화관 씨네큐브');

-- Sample Mission Templates Data
INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, created_at, updated_at)
SELECT '공원 산책', '근처 공원에서 30분 이상 산책하기', 'ACTIVITY', 'EASY', '30분 이상 산책', NULL, 'OUTDOOR', 'ANY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '공원 산책');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, created_at, updated_at)
SELECT '심야 서점 방문', '밤늦게 서점에서 책 구경하기', 'CULTURE', 'MEDIUM', '22시 이후 방문', NULL, 'INDOOR', 'NIGHT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '심야 서점 방문');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, created_at, updated_at)
SELECT '모닝 커피', '아침 일찍 카페에서 커피 한 잔', 'RELAX', 'EASY', '오전 6~9시 방문', NULL, 'INDOOR', 'MORNING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '모닝 커피');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, created_at, updated_at)
SELECT '한강 자전거 타기', '한강공원에서 자전거 타기', 'ACTIVITY', 'MEDIUM', '30분 이상 자전거', NULL, 'OUTDOOR', 'AFTERNOON', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '한강 자전거 타기');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, created_at, updated_at)
SELECT '박물관 탐방', '박물관에서 전시 관람하기', 'CULTURE', 'EASY', '1시간 이상 관람', NULL, 'INDOOR', 'ANY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '박물관 탐방');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, created_at, updated_at)
SELECT '새벽 운동', '새벽에 운동하기', 'ACTIVITY', 'HARD', '오전 5~7시 운동', NULL, 'ANY', 'MORNING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '새벽 운동');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, created_at, updated_at)
SELECT '실내 클라이밍', '실내 클라이밍 체험하기', 'ACTIVITY', 'HARD', '1시간 이상 클라이밍', NULL, 'INDOOR', 'ANY', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '실내 클라이밍');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, created_at, updated_at)
SELECT '야외 피크닉', '공원에서 피크닉 즐기기', 'RELAX', 'EASY', '1시간 이상 피크닉', NULL, 'OUTDOOR', 'AFTERNOON', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '야외 피크닉');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, created_at, updated_at)
SELECT '심야 맛집 탐방', '밤늦게 맛집 방문하기', 'FOOD', 'MEDIUM', '21시 이후 방문', NULL, 'INDOOR', 'NIGHT', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '심야 맛집 탐방');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, created_at, updated_at)
SELECT '브런치 카페', '여유로운 브런치 즐기기', 'FOOD', 'EASY', '오전 10시~오후 2시', NULL, 'INDOOR', 'AFTERNOON', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '브런치 카페');

-- ========================================
-- 위치 기반 미션 데이터 (가산디지털단지역 주변)
-- 중심 좌표: (37.481, 126.882)
-- ========================================

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '가산 포장마차 거리 가기', '가산디지털단지 포장마차 거리에서 저녁 한 잔', 'FOOD', 'EASY', '저녁 시간 추천', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800', 'OUTDOOR', 'NIGHT', 37.4815, 126.8825, '서울시 금천구 가산디지털1로 168', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '가산 포장마차 거리 가기');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '독산동 맛집 탐방', '독산동 숨은 맛집에서 점심 먹기', 'FOOD', 'EASY', '점심 시간 추천', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?q=80&w=800', 'INDOOR', 'AFTERNOON', 37.4790, 126.8870, '서울시 금천구 독산동 271-5', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '독산동 맛집 탐방');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '가산 카페거리 산책', '가산디지털단지 카페거리에서 커피 한 잔', 'RELAX', 'EASY', '오후 시간 추천', 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=800', 'INDOOR', 'AFTERNOON', 37.4805, 126.8810, '서울시 금천구 가산디지털2로 98', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '가산 카페거리 산책');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '가산 PC방 게임 한판', '가산디지털단지 PC방에서 게임 한 판', 'ACTIVITY', 'EASY', '언제나 가능', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=800', 'INDOOR', 'ANY', 37.4820, 126.8835, '서울시 금천구 가산디지털1로 171', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '가산 PC방 게임 한판');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '독산역 노래방 가기', '독산역 근처 노래방에서 스트레스 해소', 'ACTIVITY', 'EASY', '저녁 시간 추천', 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?q=80&w=800', 'INDOOR', 'NIGHT', 37.4726, 126.8927, '서울시 금천구 시흥대로 398', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '독산역 노래방 가기');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '가산 헬스장 운동', '가산디지털단지 헬스장에서 운동하기', 'ACTIVITY', 'MEDIUM', '평일 저녁 추천', 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800', 'INDOOR', 'ANY', 37.4800, 126.8800, '서울시 금천구 디지털로9길 46', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '가산 헬스장 운동');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '가산 영화관 관람', '가산디지털단지 영화관에서 영화 보기', 'CULTURE', 'EASY', '저녁 시간 추천', 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=800', 'INDOOR', 'NIGHT', 37.4812, 126.8818, '서울시 금천구 디지털로10길 9', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '가산 영화관 관람');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '가산 도서관 독서', '가산디지털단지 도서관에서 책 읽기', 'CULTURE', 'EASY', '주말 오후 추천', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=800', 'INDOOR', 'AFTERNOON', 37.4795, 126.8845, '서울시 금천구 가산디지털1로 145', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '가산 도서관 독서');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '가산 베이커리 투어', '가산디지털단지 베이커리에서 빵 사먹기', 'FOOD', 'EASY', '오전 시간 추천', 'https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=800', 'INDOOR', 'MORNING', 37.4808, 126.8822, '서울시 금천구 가산디지털2로 115', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '가산 베이커리 투어');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '가산 공원 산책', '가산디지털단지 근처 공원에서 산책하기', 'RELAX', 'EASY', '아침/저녁 추천', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800', 'OUTDOOR', 'ANY', 37.4785, 126.8795, '서울시 금천구 가산동 60-31', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '가산 공원 산책');

-- ========================================
-- 위치 기반 미션 데이터 (장한평역 주변)
-- 중심 좌표: (37.561, 127.064)
-- ========================================

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '장안동 벚꽃길 걷기', '장안동 벚꽃길을 따라 여유롭게 산책하기', 'RELAX', 'EASY', '봄철 추천', 'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=800', 'OUTDOOR', 'AFTERNOON', 37.5625, 127.0655, '서울시 동대문구 장안동 산1-1', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '장안동 벚꽃길 걷기');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '장한평 중고차 시장 구경', '장한평 중고차 시장에서 차 구경하기', 'ACTIVITY', 'EASY', '주말 오후 추천', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=800', 'OUTDOOR', 'AFTERNOON', 37.5605, 127.0635, '서울시 동대문구 천호대로 506', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '장한평 중고차 시장 구경');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '장한평 맛집 탐방', '장한평역 근처 숨은 맛집에서 식사하기', 'FOOD', 'EASY', '점심/저녁 추천', 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=800', 'INDOOR', 'ANY', 37.5610, 127.0640, '서울시 동대문구 답십리로 지하 650', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '장한평 맛집 탐방');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT 'LP 바에서 음악 듣기', '장한평 LP 바에서 아날로그 음악 감상', 'CULTURE', 'MEDIUM', '저녁 시간 추천', 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?q=80&w=800', 'INDOOR', 'NIGHT', 37.5615, 127.0645, '서울시 동대문구 장한로 272', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = 'LP 바에서 음악 듣기');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '장한평 카페 투어', '장한평역 근처 감성 카페에서 커피 마시기', 'RELAX', 'EASY', '오후 시간 추천', 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=800', 'INDOOR', 'AFTERNOON', 37.5608, 127.0638, '서울시 동대문구 답십리로 668', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '장한평 카페 투어');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '답십리 공원 조깅', '답십리 공원에서 조깅하기', 'ACTIVITY', 'MEDIUM', '아침/저녁 추천', 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?q=80&w=800', 'OUTDOOR', 'MORNING', 37.5630, 127.0660, '서울시 동대문구 답십리동 산1-5', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '답십리 공원 조깅');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '장한평 볼링장 가기', '장한평 볼링장에서 볼링 한 게임', 'ACTIVITY', 'EASY', '저녁 시간 추천', 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?q=80&w=800', 'INDOOR', 'NIGHT', 37.5600, 127.0630, '서울시 동대문구 천호대로 512', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '장한평 볼링장 가기');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '장한평 서점 방문', '장한평역 근처 서점에서 책 구경하기', 'CULTURE', 'EASY', '주말 오후 추천', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=800', 'INDOOR', 'AFTERNOON', 37.5612, 127.0642, '서울시 동대문구 답십리로 670', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '장한평 서점 방문');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '장한평 분식집 탐방', '장한평 분식집에서 떡볶이 먹기', 'FOOD', 'EASY', '점심/간식 시간', 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=800', 'INDOOR', 'AFTERNOON', 37.5607, 127.0637, '서울시 동대문구 장한로 268', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '장한평 분식집 탐방');

INSERT INTO mission_templates (title, description, category, difficulty_level, condition, image_url, location_type, time_of_day, latitude, longitude, address, created_at, updated_at)
SELECT '장한평 야시장 구경', '장한평 야시장에서 야식 먹기', 'FOOD', 'EASY', '저녁 시간 추천', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=800', 'OUTDOOR', 'NIGHT', 37.5618, 127.0648, '서울시 동대문구 답십리로 675', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM mission_templates WHERE title = '장한평 야시장 구경');

-- Sample Adjectives Data for Nickname Generation
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
