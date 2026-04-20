package com.workintech.s19challenge_twitter.service;

import com.workintech.s19challenge_twitter.dto.RetweetRequest;
import com.workintech.s19challenge_twitter.entity.Retweet;
import com.workintech.s19challenge_twitter.entity.User;

public interface RetweetService {
    Retweet retweetTweet(RetweetRequest retweetRequest, User user);
    void deleteRetweet(Long retweetId, User user);
}
