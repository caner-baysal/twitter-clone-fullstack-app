package com.workintech.s19challenge_twitter.service;

import com.workintech.s19challenge_twitter.dto.RetweetRequest;
import com.workintech.s19challenge_twitter.dto.TweetRequest;
import com.workintech.s19challenge_twitter.entity.Retweet;
import com.workintech.s19challenge_twitter.entity.Tweet;
import com.workintech.s19challenge_twitter.entity.User;
import com.workintech.s19challenge_twitter.exceptions.CustomException;
import com.workintech.s19challenge_twitter.repository.RetweetRepository;
import com.workintech.s19challenge_twitter.repository.TweetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RetweetServiceImpl implements RetweetService {

    private final RetweetRepository retweetRepository;

    private final TweetRepository tweetRepository;

    @Override
    public Retweet retweetTweet(RetweetRequest retweetRequest, User user) {
        Tweet tweet = tweetRepository.findById(retweetRequest.getTweetId()).orElseThrow(() -> new CustomException("Tweet not found", HttpStatus.NOT_FOUND));
        retweetRepository.findByUserIdAndTweetId(user.getId(), tweet.getId()).ifPresent(r -> {
            throw new CustomException("Already retweeted", HttpStatus.BAD_REQUEST);
        });
            Retweet retweet = new Retweet();
            retweet.setUser(user);
            retweet.setTweet(tweet);
            retweet.setCreationDate(LocalDateTime.now().toString());
            return retweetRepository.save(retweet);
    }

    @Override
    public void deleteRetweet(Long retweetId, User user) {
        Retweet retweet = retweetRepository.findById(retweetId).orElseThrow(() -> new CustomException("Retweet not found", HttpStatus.NOT_FOUND));
        if(!retweet.getUser().getId().equals(user.getId())) {
            throw new CustomException("You are not allowed to delete this retweet", HttpStatus.FORBIDDEN);
        } else {
            retweetRepository.delete(retweet);
        }
    }
}
