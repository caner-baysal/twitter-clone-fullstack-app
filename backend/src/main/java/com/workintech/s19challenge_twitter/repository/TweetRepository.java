package com.workintech.s19challenge_twitter.repository;

import com.workintech.s19challenge_twitter.entity.Tweet;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface TweetRepository extends JpaRepository<Tweet, Long> {

    List<Tweet> findByUserId(Long userId);

    @Query("SELECT t FROM Tweet t JOIN FETCH t.user WHERE t.user.id = :userId")
    List<Tweet> findByUserIdWithUser(@Param("userId") Long userId);

    @Query("SELECT t FROM Tweet t LEFT JOIN FETCH t.user LEFT JOIN FETCH t.likes LEFT JOIN FETCH t.retweets LEFT JOIN FETCH t.comments")
    List<Tweet> findAllWithRelations();
}
