package com.workintech.s19challenge_twitter.dto;

import lombok.Data;

@Data
public class CommentRequest {
    private String content;
    private Long tweetId;
}
