package com.workintech.s19challenge_twitter.controller;

import com.workintech.s19challenge_twitter.dto.CommentRequest;
import com.workintech.s19challenge_twitter.entity.Comment;
import com.workintech.s19challenge_twitter.entity.User;
import com.workintech.s19challenge_twitter.service.CommentService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@AllArgsConstructor
@RestController
@RequestMapping("/comment")
public class CommentController {
    private final CommentService commentService;

    @PostMapping
    public ResponseEntity<?> createComment(@RequestBody CommentRequest commentRequest,
                                           @AuthenticationPrincipal User user) {
        try {
            Comment comment = commentService.createComment(commentRequest, user);
            return ResponseEntity.status(HttpStatus.CREATED).body(toSafeResponse(comment));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<?> updateComment(@PathVariable Long commentId,
                                           @RequestBody CommentRequest commentRequest,
                                           @AuthenticationPrincipal User user) {
        try {
            Comment comment = commentService.updateComment(commentId, commentRequest, user);
            return ResponseEntity.ok(toSafeResponse(comment));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(@PathVariable Long commentId,
                                           @AuthenticationPrincipal User user) {
        try {
            commentService.deleteComment(commentId, user);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    private Map<String, Object> toSafeResponse(Comment comment) {
        return Map.of(
                "id", comment.getId(),
                "content", comment.getContent(),
                "creationDate", comment.getCreationDate() != null ? comment.getCreationDate().toString() : "",
                "tweetId", comment.getTweet().getId(),
                "user", Map.of(
                        "id", comment.getUser().getId(),
                        "username", comment.getUser().getUsername()
                )
        );
    }
}