package com.workintech.s19challenge_twitter.controller;

import com.workintech.s19challenge_twitter.dto.LikeRequest;
import com.workintech.s19challenge_twitter.entity.User;
import com.workintech.s19challenge_twitter.repository.UserRepository;
import com.workintech.s19challenge_twitter.service.LikeService;
import lombok.AllArgsConstructor;
import org.apache.coyote.Response;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@AllArgsConstructor
@RestController
@RequestMapping("/like")
public class LikeController {
    private final LikeService likeService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<?> toggleLike(@RequestBody LikeRequest likeRequest,
                                        @AuthenticationPrincipal User user) {

        System.out.println("=== LIKE CONTROLLER DEBUG ===");
        System.out.println("Principal: " + (user != null ? user.getUsername() : "NULL"));
        System.out.println("Tweet ID: " + likeRequest.getTweetId());

        if(user == null) {
            System.out.println("ERROR: Principal is NULL!");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        try {
            String result = likeService.toggleLike(likeRequest, user);
            return ResponseEntity.ok(result);

        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
