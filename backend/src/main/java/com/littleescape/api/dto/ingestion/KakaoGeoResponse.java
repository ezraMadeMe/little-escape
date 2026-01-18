package com.littleescape.api.dto.ingestion;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * Kakao Local API (주소 검색) JSON 응답 매핑 DTO
 * API: https://dapi.kakao.com/v2/local/search/address.json
 */
@Data
public class KakaoGeoResponse {

    @JsonProperty("meta")
    private Meta meta;
    
    @JsonProperty("documents")
    private List<Document> documents;

    @Data
    public static class Meta {
        @JsonProperty("total_count")
        private Integer totalCount;
        
        @JsonProperty("pageable_count")
        private Integer pageableCount;
        
        @JsonProperty("is_end")
        private Boolean isEnd;
    }

    @Data
    public static class Document {
        
        @JsonProperty("address_name")
        private String addressName;  // 전체 지번 주소
        
        @JsonProperty("address_type")
        private String addressType;  // 주소 타입 (REGION, ROAD, REGION_ADDR, ROAD_ADDR)
        
        @JsonProperty("x")
        private String longitude;  // 경도 (X 좌표)
        
        @JsonProperty("y")
        private String latitude;  // 위도 (Y 좌표)
        
        @JsonProperty("address")
        private Address address;
        
        @JsonProperty("road_address")
        private RoadAddress roadAddress;
    }

    @Data
    public static class Address {
        @JsonProperty("address_name")
        private String addressName;
        
        @JsonProperty("region_1depth_name")
        private String region1depthName;  // 시도 단위
        
        @JsonProperty("region_2depth_name")
        private String region2depthName;  // 구 단위
        
        @JsonProperty("region_3depth_name")
        private String region3depthName;  // 동 단위
        
        @JsonProperty("mountain_yn")
        private String mountainYn;
        
        @JsonProperty("main_address_no")
        private String mainAddressNo;
        
        @JsonProperty("sub_address_no")
        private String subAddressNo;
    }

    @Data
    public static class RoadAddress {
        @JsonProperty("address_name")
        private String addressName;
        
        @JsonProperty("region_1depth_name")
        private String region1depthName;
        
        @JsonProperty("region_2depth_name")
        private String region2depthName;
        
        @JsonProperty("region_3depth_name")
        private String region3depthName;
        
        @JsonProperty("road_name")
        private String roadName;
        
        @JsonProperty("underground_yn")
        private String undergroundYn;
        
        @JsonProperty("main_building_no")
        private String mainBuildingNo;
        
        @JsonProperty("sub_building_no")
        private String subBuildingNo;
        
        @JsonProperty("building_name")
        private String buildingName;
        
        @JsonProperty("zone_no")
        private String zoneNo;
    }
}


