package com.littleescape.external.kakao;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "kakao")
public class KakaoProperties {
    private String mobilityApiKey;

    public String getMobilityApiKey() { return mobilityApiKey; }
    public void setMobilityApiKey(String mobilityApiKey) { this.mobilityApiKey = mobilityApiKey; }
}
