package com.workintech.s19challenge_twitter.controller;

import com.workintech.s19challenge_twitter.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RequiredArgsConstructor
@RestController
@RequestMapping("/user")
public class UserController {
    private final UserRepository userRepository;

    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers() {
        // map to safe fields only, never return User entity directly
        List<Map<String, Object>> users = userRepository.findAll().stream()
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "username", u.getUsername(),
                        "email", u.getEmail()
                ))
                .toList();
        return ResponseEntity.ok(users);
    }
}