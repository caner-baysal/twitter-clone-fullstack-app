package com.workintech.s19challenge_twitter.repository;

import com.workintech.s19challenge_twitter.entity.Retweet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface RetweetRepository extends JpaRepository<Retweet, Long> {
    Optional<Retweet> findByUserIdAndTweetId(Long userId, Long tweetId);
}
