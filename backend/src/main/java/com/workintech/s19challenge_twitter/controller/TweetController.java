package com.workintech.s19challenge_twitter.controller;

import com.workintech.s19challenge_twitter.dto.TweetRequest;
import com.workintech.s19challenge_twitter.dto.TweetResponse;
import com.workintech.s19challenge_twitter.entity.Tweet;
import com.workintech.s19challenge_twitter.entity.User;
import com.workintech.s19challenge_twitter.repository.TweetRepository;
import com.workintech.s19challenge_twitter.service.TweetService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@AllArgsConstructor
@RestController
@RequestMapping("/tweet")
public class TweetController {
    private final TweetService tweetService;
    private final TweetRepository tweetRepository;

    @PostMapping
    public ResponseEntity<?> createTweet(@Valid @RequestBody TweetRequest tweetRequest, @AuthenticationPrincipal User user) {
        try {
            TweetResponse tweet = tweetService.createTweet(tweetRequest, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(tweet);
        } catch(RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }


    @GetMapping("/all")
    public ResponseEntity<List<TweetResponse>> getAllTweets() {
        return ResponseEntity.ok(tweetService.getAllTweets());
    }

    @GetMapping("/findByUserId")
    public ResponseEntity<?> tweetsByUserId(@RequestParam Long userId) {
        return ResponseEntity.ok(tweetService.getAllTweets());
    }

    @GetMapping("/findById")
    public ResponseEntity<?> getTweetById(@RequestParam Long tweetId) {
        try {
            return ResponseEntity.ok(tweetService.getTweetById(tweetId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{tweetId}")
    public ResponseEntity<?> updateTweet(@PathVariable Long tweetId, @RequestBody TweetRequest tweetRequest, @AuthenticationPrincipal User user) {
        try {
            return ResponseEntity.ok(tweetService.updateTweet(tweetId, tweetRequest, user));
        } catch(RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{tweetId}")
    public ResponseEntity<?> deleteTweet(@PathVariable Long tweetId, @AuthenticationPrincipal User user) {
        try {
            tweetService.deleteTweet(tweetId, user);
            return ResponseEntity.noContent().build();
        } catch(RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

}
