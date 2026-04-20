package com.workintech.s19challenge_twitter.controller;

import com.workintech.s19challenge_twitter.dto.RetweetRequest;
import com.workintech.s19challenge_twitter.entity.Retweet;
import com.workintech.s19challenge_twitter.entity.User;
import com.workintech.s19challenge_twitter.service.RetweetService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@AllArgsConstructor
@RestController
@RequestMapping("/retweet")
public class RetweetController {
    private final RetweetService retweetService;

    @PostMapping
    public ResponseEntity<?> retweetTweet(@RequestBody RetweetRequest retweetRequest,
                                          @AuthenticationPrincipal User user) {
        try {
            Retweet retweet = retweetService.retweetTweet(retweetRequest, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                    "id", retweet.getId(),
                    "tweetId", retweet.getTweet().getId(),
                    "user", Map.of(
                            "id", retweet.getUser().getId(),
                            "username", retweet.getUser().getUsername()
                    )
            ));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{retweetId}")
    public ResponseEntity<?> deleteRetweet(@PathVariable Long retweetId,
                                           @AuthenticationPrincipal User user) {
        try {
            retweetService.deleteRetweet(retweetId, user);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}