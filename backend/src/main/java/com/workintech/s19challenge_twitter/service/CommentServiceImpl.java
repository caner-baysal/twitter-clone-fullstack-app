package com.workintech.s19challenge_twitter.service;

import com.workintech.s19challenge_twitter.dto.CommentRequest;
import com.workintech.s19challenge_twitter.entity.Comment;
import com.workintech.s19challenge_twitter.entity.Tweet;
import com.workintech.s19challenge_twitter.entity.User;
import com.workintech.s19challenge_twitter.exceptions.CustomException;
import com.workintech.s19challenge_twitter.repository.CommentRepository;
import com.workintech.s19challenge_twitter.repository.TweetRepository;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
public class CommentServiceImpl implements CommentService {


    private final CommentRepository commentRepository;

    private final TweetRepository tweetRepository;


    @Override
    public Comment createComment(CommentRequest commentRequest, User user) {
        Tweet tweet = tweetRepository.findById(commentRequest.getTweetId()).orElseThrow(() -> new CustomException("Tweet not found", HttpStatus.NOT_FOUND));
        Comment comment = new Comment();
        comment.setContent(commentRequest.getContent());
        comment.setUser(user);
        comment.setTweet(tweet);
        comment.setCreationDate(LocalDateTime.now());
        return commentRepository.save(comment);
    }

    @Override
    public Comment updateComment(Long commentId, CommentRequest commentRequest, User user) {
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new CustomException("Comment not found", HttpStatus.NOT_FOUND));
        /*if(comment.getTweet() == null) {
            throw new RuntimeException("Comment is not relate to this tweet");
        }*/ if(!comment.getUser().getId().equals(user.getId())) {
            throw new CustomException("Your are not allowed to change this comment " + commentId, HttpStatus.FORBIDDEN);
        } else {
            comment.setContent(commentRequest.getContent());
            return commentRepository.save(comment);
        }
    }

    @Override
    public void deleteComment(Long commentId, User user) {
        Comment comment = commentRepository.findById(commentId).orElseThrow(() -> new CustomException("Comment not found", HttpStatus.NOT_FOUND));
        if (!comment.getUser().getId().equals(user.getId()) &&
                !comment.getTweet().getUser().getId().equals(user.getId())) {
            throw new CustomException("You are not allowed to delete this comment", HttpStatus.FORBIDDEN);
        }
        commentRepository.delete(comment);
    }
}
