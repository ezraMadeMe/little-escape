#!/bin/bash

echo "=========================================="
echo "피드 API 테스트 스크립트"
echo "=========================================="
echo ""

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Backend 상태 확인
echo "1. Backend 상태 확인..."
if lsof -i :8080 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend가 8080 포트에서 실행 중입니다${NC}"
else
    echo -e "${RED}❌ Backend가 실행되지 않았습니다${NC}"
    echo "   실행 명령: cd backend && ./gradlew bootRun"
    exit 1
fi

echo ""

# 2. Frontend 상태 확인
echo "2. Frontend 상태 확인..."
if lsof -i :5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend가 5173 포트에서 실행 중입니다${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend가 실행되지 않았습니다${NC}"
    echo "   실행 명령: cd frontend && npm run dev"
fi

echo ""

# 3. Health Check
echo "3. Backend Health Check..."
HEALTH_STATUS=$(curl -s http://localhost:8080/actuator/health)
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend가 정상 응답합니다${NC}"
    echo "   응답: $HEALTH_STATUS"
else
    echo -e "${RED}❌ Backend가 응답하지 않습니다${NC}"
    exit 1
fi

echo ""

# 4. Feed API 테스트
echo "4. Feed API 테스트..."
echo "   요청: GET /api/v1/appointments/feed?page=0&size=20"
FEED_RESPONSE=$(curl -s "http://localhost:8080/api/v1/appointments/feed?page=0&size=20")

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Feed API가 정상 응답합니다${NC}"

    # JSON 파싱 (jq가 있는 경우)
    if command -v jq > /dev/null 2>&1; then
        FEED_COUNT=$(echo "$FEED_RESPONSE" | jq '. | length')
        echo "   피드 아이템 수: $FEED_COUNT"

        if [ "$FEED_COUNT" -eq "0" ]; then
            echo -e "${YELLOW}⚠️  피드에 공개된 데이터가 없습니다${NC}"
            echo ""
            echo "   다음 SQL을 Supabase에서 실행하여 테스트 데이터를 생성하세요:"
            echo ""
            echo "   UPDATE appointments"
            echo "   SET is_public = true, completed_at = COALESCE(completed_at, updated_at)"
            echo "   WHERE status = 'COMPLETED'"
            echo "     AND (proof_image_url IS NOT NULL OR array_length(proof_image_urls, 1) > 0)"
            echo "     AND is_public = false"
            echo "   LIMIT 10;"
        else
            echo -e "${GREEN}✅ $FEED_COUNT개의 피드 아이템이 있습니다${NC}"
            echo ""
            echo "   샘플 데이터 (첫 번째 아이템):"
            echo "$FEED_RESPONSE" | jq '.[0] // "없음"' 2>/dev/null || echo "   (jq를 사용할 수 없어 원본 데이터 출력 생략)"
        fi
    else
        echo "   원본 응답:"
        echo "$FEED_RESPONSE"
        echo ""
        echo -e "${YELLOW}💡 jq를 설치하면 더 읽기 좋은 형태로 출력됩니다: brew install jq${NC}"
    fi
else
    echo -e "${RED}❌ Feed API 요청 실패${NC}"
    exit 1
fi

echo ""
echo "=========================================="
echo "테스트 완료!"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "1. 브라우저에서 http://localhost:5173 접속"
echo "2. 로그인 후 피드 페이지(홈) 확인"
echo "3. 공개된 인증샷이 표시되는지 확인"
echo ""
