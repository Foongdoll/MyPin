package com.foongdoll.server.common.geocode;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/api/geocode")
public class GeocodeController {
    @Value("${naver.client-id}") String clientId;
    @Value("${naver.client-secret}") String clientSecret;

    @GetMapping
    public ResponseEntity<String> geocode(@RequestParam String query) {
        String url = UriComponentsBuilder
                .fromHttpUrl("https://naveropenapi.apigw.ntruss.com/map-geocode/v2/geocode")
                .queryParam("query", query)
                .build()
                .encode()
                .toUriString();

        HttpHeaders headers = new HttpHeaders();
        headers.set("X-NCP-APIGW-API-KEY-ID", clientId);
        headers.set("X-NCP-APIGW-API-KEY", clientSecret);

        HttpEntity<Void> req = new HttpEntity<>(headers);
        RestTemplate rt = new RestTemplate();
        ResponseEntity<String> res = rt.exchange(url, HttpMethod.GET, req, String.class);

        return ResponseEntity.status(res.getStatusCode())
                .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*") // dev에선 허용, prod에선 도메인 한정
                .body(res.getBody());
    }
}