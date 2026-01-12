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
