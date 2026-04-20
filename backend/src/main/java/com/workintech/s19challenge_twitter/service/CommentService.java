package com.workintech.s19challenge_twitter.service;

import com.workintech.s19challenge_twitter.dto.CommentRequest;
import com.workintech.s19challenge_twitter.entity.Comment;
import com.workintech.s19challenge_twitter.entity.User;

public interface CommentService {
    Comment createComment(CommentRequest commentRequest, User user);
    Comment updateComment(Long commentId, CommentRequest commentRequest, User user);
    void deleteComment(Long commentId, User user);
}
