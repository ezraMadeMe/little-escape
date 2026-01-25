package com.littleescape.api.service;

import com.fasterxml.jackson.dataformat.xml.XmlMapper;
import com.littleescape.api.domain.Library;
import com.littleescape.api.dto.ingestion.BookDetailResponse;
import com.littleescape.api.dto.ingestion.BookExistResponse;
import com.littleescape.api.dto.ingestion.BookKeywordResponse;
import com.littleescape.api.repository.LibraryRepository;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * 도서관정보나루 실시간 API 서비스
 *
 * 도서 소장/대출 가능 여부 등 실시간 정보 조회
 * 캐싱 적용으로 API 호출 최소화 (1시간)
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class LibraryApiService {

    private final WebClient libraryWebClient;
    private final LibraryRepository libraryRepository;

    private final XmlMapper xmlMapper = new XmlMapper();

    @Value("${external-api.library.auth-key}")
    private String libraryAuthKey;

    /**
     * 도서 소장/대출 가능 여부 조회 (캐싱 1시간)
     *
     * @param isbn ISBN13
     * @param latitude 사용자 위도 (근처 도서관 필터용)
     * @param longitude 사용자 경도
     * @return 대출 가능한 도서관 목록
     */
    @Cacheable(value = "bookExistence", key = "#isbn + '_' + #latitude + '_' + #longitude",
               unless = "#result == null || #result.isEmpty()")
    public List<BookAvailability> checkBookExistence(String isbn, Double latitude, Double longitude) {
        log.debug("도서 소장 조회 API 호출: ISBN={}", isbn);

        try {
            String response = libraryWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/bookExist")
                            .queryParam("authKey", libraryAuthKey)
                            .queryParam("isbn13", isbn)
                            .queryParam("region", "11")  // 서울
                            .queryParam("format", "xml")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                BookExistResponse bookExistResponse = xmlMapper.readValue(response, BookExistResponse.class);

                if (!bookExistResponse.isEmpty()) {
                    List<BookAvailability> availabilities = new ArrayList<>();

                    for (BookExistResponse.LibraryInfo libInfo : bookExistResponse.getLibraries()) {
                        // 대출 가능한 도서관만 필터링
                        if ("Y".equals(libInfo.getLoanAvailable())) {
                            BookAvailability availability = new BookAvailability();
                            availability.setLibraryCode(libInfo.getLibCode());
                            availability.setLibraryName(libInfo.getLibName());
                            availability.setHasBook("Y".equals(libInfo.getHasBook()));
                            availability.setLoanAvailable(true);

                            // DB에서 도서관 상세 정보 조회
                            Optional<Library> library = libraryRepository.findByLibraryCode(libInfo.getLibCode());
                            library.ifPresent(lib -> {
                                availability.setAddress(lib.getAddress());
                                availability.setLatitude(lib.getLatitude());
                                availability.setLongitude(lib.getLongitude());
                                availability.setOperatingTime(lib.getOperatingTime());
                                availability.setClosedDays(lib.getClosedDays());

                                // 사용자 위치 기반 거리 계산
                                if (latitude != null && longitude != null &&
                                    lib.getLatitude() != null && lib.getLongitude() != null) {
                                    availability.setDistance(calculateDistance(
                                            latitude, longitude,
                                            lib.getLatitude(), lib.getLongitude()
                                    ));
                                }
                            });

                            availabilities.add(availability);
                        }
                    }

                    // 거리순 정렬
                    availabilities.sort((a, b) -> {
                        if (a.getDistance() == null) return 1;
                        if (b.getDistance() == null) return -1;
                        return Double.compare(a.getDistance(), b.getDistance());
                    });

                    log.info("도서 소장 조회 완료: ISBN={}, 대출가능 도서관={}곳", isbn, availabilities.size());
                    return availabilities;
                }
            }

        } catch (Exception e) {
            log.error("도서 소장 조회 실패: ISBN={}", isbn, e);
        }

        return Collections.emptyList();
    }

    /**
     * 근처 대출 가능한 도서관 조회 (반경 5km)
     */
    @Cacheable(value = "nearbyBookAvailability", key = "#isbn + '_' + #latitude + '_' + #longitude",
               unless = "#result == null || #result.isEmpty()")
    public List<BookAvailability> findNearbyAvailableLibraries(String isbn, Double latitude, Double longitude) {
        List<BookAvailability> allLibraries = checkBookExistence(isbn, latitude, longitude);

        // 5km 이내 필터링
        return allLibraries.stream()
                .filter(lib -> lib.getDistance() != null && lib.getDistance() <= 5.0)
                .limit(5)
                .collect(Collectors.toList());
    }

    /**
     * 도서 상세 정보 조회
     */
    @Cacheable(value = "bookDetail", key = "#isbn", unless = "#result == null")
    public BookDetail getBookDetail(String isbn) {
        log.debug("도서 상세 조회 API 호출: ISBN={}", isbn);

        try {
            String response = libraryWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/srchDtlList")
                            .queryParam("authKey", libraryAuthKey)
                            .queryParam("isbn13", isbn)
                            .queryParam("format", "xml")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(10))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                BookDetailResponse detailResponse = xmlMapper.readValue(response, BookDetailResponse.class);

                if (!detailResponse.isEmpty()) {
                    BookDetailResponse.BookInfo item = detailResponse.getBooks().get(0);

                    BookDetail detail = new BookDetail();
                    detail.setIsbn(item.getIsbn13());
                    detail.setTitle(item.getBookName());
                    detail.setAuthor(item.getAuthors());
                    detail.setPublisher(item.getPublisher());
                    detail.setPublicationYear(item.getPublicationYear());
                    detail.setImageUrl(item.getBookImageUrl());
                    detail.setDescription(item.getDescription());
                    detail.setClassNo(item.getClassNo());
                    detail.setClassNm(item.getClassNm());

                    // 키워드 조회
                    List<String> keywords = getBookKeywords(isbn);
                    detail.setKeywords(keywords);

                    return detail;
                }
            }

        } catch (Exception e) {
            log.error("도서 상세 조회 실패: ISBN={}", isbn, e);
        }

        return null;
    }

    /**
     * 도서 키워드 조회
     */
    @Cacheable(value = "bookKeywords", key = "#isbn", unless = "#result == null || #result.isEmpty()")
    public List<String> getBookKeywords(String isbn) {
        try {
            String response = libraryWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/keywordList")
                            .queryParam("authKey", libraryAuthKey)
                            .queryParam("isbn13", isbn)
                            .queryParam("format", "xml")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                BookKeywordResponse keywordResponse = xmlMapper.readValue(response, BookKeywordResponse.class);

                if (!keywordResponse.isEmpty()) {
                    return keywordResponse.getKeywords().stream()
                            .map(BookKeywordResponse.Keyword::getWord)
                            .collect(Collectors.toList());
                }
            }

        } catch (Exception e) {
            log.debug("도서 키워드 조회 실패: ISBN={}", isbn);
        }

        return Collections.emptyList();
    }

    /**
     * 특정 도서관의 도서 대출 가능 여부 조회 (실시간)
     */
    public boolean isBookAvailableAtLibrary(String isbn, String libraryCode) {
        try {
            String response = libraryWebClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/bookExist")
                            .queryParam("authKey", libraryAuthKey)
                            .queryParam("isbn13", isbn)
                            .queryParam("libCode", libraryCode)
                            .queryParam("format", "xml")
                            .build())
                    .retrieve()
                    .bodyToMono(String.class)
                    .timeout(Duration.ofSeconds(5))
                    .onErrorReturn("")
                    .block();

            if (response != null && !response.isEmpty()) {
                BookExistResponse bookExistResponse = xmlMapper.readValue(response, BookExistResponse.class);

                if (!bookExistResponse.isEmpty()) {
                    BookExistResponse.LibraryInfo libInfo = bookExistResponse.getLibraries().get(0);
                    return "Y".equals(libInfo.getLoanAvailable());
                }
            }

        } catch (Exception e) {
            log.debug("도서관 대출 가능 조회 실패: ISBN={}, LibCode={}", isbn, libraryCode);
        }

        return false;
    }

    /**
     * Haversine 공식으로 두 지점 간 거리 계산 (km)
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // 지구 반경 (km)

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    // ========== DTO 클래스 ==========

    /**
     * 도서 대출 가능 정보
     */
    @Data
    public static class BookAvailability {
        private String libraryCode;
        private String libraryName;
        private String address;
        private Double latitude;
        private Double longitude;
        private boolean hasBook;
        private boolean loanAvailable;
        private String operatingTime;
        private String closedDays;
        private Double distance;  // km
    }

    /**
     * 도서 상세 정보
     */
    @Data
    public static class BookDetail {
        private String isbn;
        private String title;
        private String author;
        private String publisher;
        private String publicationYear;
        private String imageUrl;
        private String description;
        private String classNo;
        private String classNm;
        private List<String> keywords;
    }
}
