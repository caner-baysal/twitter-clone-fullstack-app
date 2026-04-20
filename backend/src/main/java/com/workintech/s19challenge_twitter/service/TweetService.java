package com.workintech.s19challenge_twitter.service;

import com.workintech.s19challenge_twitter.dto.TweetRequest;
import com.workintech.s19challenge_twitter.dto.TweetResponse;
import com.workintech.s19challenge_twitter.entity.Tweet;
import com.workintech.s19challenge_twitter.entity.User;

import java.util.List;

public interface TweetService {
    TweetResponse createTweet(TweetRequest tweetRequest, User user);
    List<TweetResponse> getAllTweets();
    List<TweetResponse> tweetsByUserId(Long userId);
    TweetResponse getTweetById(Long tweetId);
    TweetResponse updateTweet(Long tweetId, TweetRequest tweetRequest, User user);
    void deleteTweet(Long tweetId, User user);
}
