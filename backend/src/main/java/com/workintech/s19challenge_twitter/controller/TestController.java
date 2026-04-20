package com.workintech.s19challenge_twitter.controller;
import com.workintech.s19challenge_twitter.entity.Tweet;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/test")
public class TestController {
    @GetMapping
    public String test() {
        return "TEST ÇALIŞIYOR!";
    }
}


