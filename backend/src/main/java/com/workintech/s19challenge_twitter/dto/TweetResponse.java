package com.workintech.s19challenge_twitter.dto;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class TweetResponse {
    private Long id;
    private String content;
    private LocalDate creationDate;
    private UserSummary user;
    private List<LikeSummary> likes;
    private List<CommentSummary> comments;
    private List<RetweetSummary> retweets;
    private String retweetedBy;
    private Long retweetId;

    @Data
    public static class UserSummary {
        private Long id;
        private String username;
        private String email;
    }

    @Data
    public static class LikeSummary {
        private Long id;
        private UserSummary user;
    }

    @Data
    public static class CommentSummary {
        private Long id;
        private String content;
        private String creationDate;
        private UserSummary user;
    }

    @Data
    public static class RetweetSummary {
        private Long id;
        private UserSummary user;
    }
}