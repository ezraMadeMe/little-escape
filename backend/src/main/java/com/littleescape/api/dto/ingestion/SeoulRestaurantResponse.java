package com.littleescape.api.dto.ingestion;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * 서울시 모범음식점 지정 현황 API JSON 응답 매핑 DTO
 * API: http://openapi.seoul.go.kr:8088/{KEY}/json/LOCALDATA_072405/1/100/
 * 데이터셋: 서울시 모범음식점 지정 현황
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SeoulRestaurantResponse {

    @JsonProperty("LOCALDATA_072405")
    private RestaurantData restaurantData;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class RestaurantData {
        
        @JsonProperty("list_total_count")
        private Integer totalCount;
        
        @JsonProperty("RESULT")
        private Result result;
        
        @JsonProperty("row")
        private List<Restaurant> restaurants;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Result {
        @JsonProperty("CODE")
        private String code;

        @JsonProperty("MESSAGE")
        private String message;
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Restaurant {
        
        @JsonProperty("OPNSFTEAMCODE")
        private String openTeamCode;  // 개방자치단체코드
        
        @JsonProperty("MGTNO")
        private String managementNo;  // 관리번호
        
        @JsonProperty("APVPERMYMD")
        private String approvalDate;  // 인허가일자
        
        @JsonProperty("APVCANCELYMD")
        private String cancelDate;  // 인허가취소일자
        
        @JsonProperty("TRDSTATEGBN")
        private String businessStatus;  // 영업상태구분 (01:영업/폐업 등)
        
        @JsonProperty("TRDSTATENM")
        private String businessStatusName;  // 영업상태명
        
        @JsonProperty("DTLSTATEGBN")
        private String detailStatus;  // 상세영업상태코드
        
        @JsonProperty("DTLSTATENM")
        private String detailStatusName;  // 상세영업상태명
        
        @JsonProperty("DCBYMD")
        private String closureDate;  // 폐업일자
        
        @JsonProperty("CLGSTDT")
        private String closureStartDate;  // 휴업시작일자
        
        @JsonProperty("CLGENDDT")
        private String closureEndDate;  // 휴업종료일자
        
        @JsonProperty("ROPNYMD")
        private String reopenDate;  // 재개업일자
        
        @JsonProperty("SITETEL")
        private String telephone;  // 소재지전화
        
        @JsonProperty("SITEAREA")
        private String siteArea;  // 소재지면적
        
        @JsonProperty("SITEPOSTNO")
        private String postalCode;  // 소재지우편번호
        
        @JsonProperty("SITEWHLADDR")
        private String fullAddress;  // 소재지전체주소
        
        @JsonProperty("RDNWHLADDR")
        private String roadAddress;  // 도로명전체주소
        
        @JsonProperty("RDNPOSTNO")
        private String roadPostalCode;  // 도로명우편번호
        
        @JsonProperty("BPLCNM")
        private String businessName;  // 사업장명 (업소명)
        
        @JsonProperty("LASTMODTS")
        private String lastModified;  // 최종수정시점
        
        @JsonProperty("UPDATEDT")
        private String updateDate;  // 데이터갱신일자
        
        @JsonProperty("UPTAENM")
        private String businessType;  // 업태구분명 (예: 한식, 중식, 일식 등)
        
        @JsonProperty("SITEGB")
        private String siteType;  // 소재지구분 (1:지번, 2:도로명)
        
        @JsonProperty("SIGUN_NM")
        private String districtName;  // 시군명 (예: 성동구)
        
        @JsonProperty("SIGUN_CD")
        private String districtCode;  // 시군코드
        
        @JsonProperty("X")
        private String longitude;  // 경도 (X좌표)
        
        @JsonProperty("Y")
        private String latitude;  // 위도 (Y좌표)
        
        @JsonProperty("SANITTN_BIZCOND_NM")
        private String foodBusinessType;  // 위생업태명 (예: 일반음식점, 휴게음식점)
        
        @JsonProperty("SANITTN_INDUTYPE_NM")
        private String industryType;  // 위생업종명
        
        @JsonProperty("TOT_FACLT_SCALE")
        private String facilityScale;  // 총시설규모
        
        @JsonProperty("MALE_ENFLPSN_CNT")
        private String maleEmployeeCount;  // 남성종사자수
        
        @JsonProperty("YY")
        private String year;  // 지정연도
        
        @JsonProperty("FEMALE_ENFLPSN_CNT")
        private String femaleEmployeeCount;  // 여성종사자수
        
        @JsonProperty("BSNSITE_CIRCUMFR_DIV_NM")
        private String surroundingArea;  // 영업장주변구분명
        
        @JsonProperty("GRAD_FACLT_DIV_NM")
        private String facilityGrade;  // 등급시설구분명
        
        @JsonProperty("TOT_EMPLY_CNT")
        private String totalEmployeeCount;  // 총종업원수
        
        @JsonProperty("REFINE_LOTNO_ADDR")
        private String refinedLotAddress;  // 정제된 지번주소
        
        @JsonProperty("REFINE_ROADNM_ADDR")
        private String refinedRoadAddress;  // 정제된 도로명주소
        
        @JsonProperty("REFINE_ZIP_CD")
        private String refinedZipCode;  // 정제된 우편번호
        
        @JsonProperty("REFINE_WGS84_LOGT")
        private String refinedLongitude;  // 정제된 경도(WGS84)
        
        @JsonProperty("REFINE_WGS84_LAT")
        private String refinedLatitude;  // 정제된 위도(WGS84)
    }
}




