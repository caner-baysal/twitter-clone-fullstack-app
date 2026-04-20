package com.workintech.s19challenge_twitter.service;

import com.workintech.s19challenge_twitter.dto.TweetRequest;
import com.workintech.s19challenge_twitter.dto.TweetResponse;
import com.workintech.s19challenge_twitter.entity.Tweet;
import com.workintech.s19challenge_twitter.entity.User;
import com.workintech.s19challenge_twitter.exceptions.CustomException;
import com.workintech.s19challenge_twitter.repository.RetweetRepository;
import com.workintech.s19challenge_twitter.repository.TweetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TweetServiceImpl implements TweetService {

    private final TweetRepository tweetRepository;
    private final RetweetRepository retweetRepository;

    @Override
    public TweetResponse createTweet(TweetRequest tweetRequest, User user) {

        if (user == null) throw new CustomException("User not authenticated", HttpStatus.UNAUTHORIZED);

        Tweet tweet = new Tweet();
        tweet.setContent(tweetRequest.getContent());
        tweet.setUser(user);
        tweet.setCreationDate(LocalDate.now());
        Tweet saved = tweetRepository.save(tweet);
        Tweet reloaded = tweetRepository.findById(saved.getId())
                .orElseThrow(() -> new CustomException("Tweet not found after save", HttpStatus.INTERNAL_SERVER_ERROR));
        return toResponse(reloaded);
    }

    @Override
    public List<TweetResponse> getAllTweets() {
        List<TweetResponse> originalTweets = tweetRepository.findAll()
                .stream()
                .map(this::toResponse)
                .collect(java.util.stream.Collectors.toList());

        // also add retweets as separate feed entries
        List<TweetResponse> retweetEntries = retweetRepository.findAll()
                .stream()
                .map(retweet -> {
                    TweetResponse dto = toResponse(retweet.getTweet());
                    // mark it as a retweet so frontend can display "retweeted by"
                    dto.setRetweetedBy(retweet.getUser().getUsername());
                    dto.setRetweetId(retweet.getId());
                    return dto;
                })
                .collect(java.util.stream.Collectors.toList());

        originalTweets.addAll(retweetEntries);

        // sort all by id descending (newest first)
        originalTweets.sort((a, b) -> Long.compare(b.getId(), a.getId()));

        return originalTweets;
    }

    @Override
    public List<TweetResponse> tweetsByUserId(Long userId) {
        return tweetRepository.findByUserId(userId).stream().map(this::toResponse).toList();

    }

    @Override
    public TweetResponse getTweetById(Long tweetId) {
        Tweet tweet = tweetRepository.findById(tweetId)
                .orElseThrow(() -> new CustomException("Tweet not found with id: " + tweetId, HttpStatus.NOT_FOUND));
        return toResponse(tweet);
    }

    @Override
    public TweetResponse updateTweet(Long tweetId, TweetRequest tweetRequest, User user) {
        Tweet tweet = tweetRepository.findById(tweetId)
                .orElseThrow(() -> new CustomException("Tweet not found with id: ", HttpStatus.NOT_FOUND));
        if(!tweet.getUser().getId().equals(user.getId())) {
            throw new CustomException("You are not authorized to update this tweet", HttpStatus.FORBIDDEN);
        }
        tweet.setContent(tweetRequest.getContent());
        return toResponse(tweetRepository.save(tweet));
    }

    @Override
    public void deleteTweet(Long tweetId, User user) {
        Tweet tweet = tweetRepository.findById(tweetId)
                .orElseThrow(() -> new CustomException("Tweet not found", HttpStatus.NOT_FOUND));
        if(!tweet.getUser().getId().equals(user.getId())) {
            throw new CustomException("You are not authorized to delete this tweet", HttpStatus.FORBIDDEN);
        }
            tweetRepository.delete(tweet);
    }

    private TweetResponse toResponse(Tweet tweet) {
        TweetResponse dto = new TweetResponse();
        dto.setId(tweet.getId());
        dto.setContent(tweet.getContent());
        dto.setCreationDate(tweet.getCreationDate());

        if (tweet.getUser() != null) {
            TweetResponse.UserSummary userDto = new TweetResponse.UserSummary();
            userDto.setId(tweet.getUser().getId());
            userDto.setUsername(tweet.getUser().getUsername());
            userDto.setEmail(tweet.getUser().getEmail());
            dto.setUser(userDto);
        }

        dto.setLikes(tweet.getLikes() == null ? List.of() :
                tweet.getLikes().stream().map(like -> {
                    TweetResponse.LikeSummary ls = new TweetResponse.LikeSummary();
                    ls.setId(like.getId());
                    if (like.getUser() != null) {
                        TweetResponse.UserSummary u = new TweetResponse.UserSummary();
                        u.setId(like.getUser().getId());
                        u.setUsername(like.getUser().getUsername());
                        u.setEmail(like.getUser().getEmail());
                        ls.setUser(u);
                    }
                    return ls;
                }).toList());

        dto.setComments(tweet.getComments() == null ? List.of() :
                tweet.getComments().stream().map(comment -> {
                    TweetResponse.CommentSummary cs = new TweetResponse.CommentSummary();
                    cs.setId(comment.getId());
                    cs.setContent(comment.getContent());
                    cs.setCreationDate(comment.getCreationDate() != null ? comment.getCreationDate().toString() : null);
                    if (comment.getUser() != null) {
                        TweetResponse.UserSummary u = new TweetResponse.UserSummary();
                        u.setId(comment.getUser().getId());
                        u.setUsername(comment.getUser().getUsername());
                        u.setEmail(comment.getUser().getEmail());
                        cs.setUser(u);
                    }
                    return cs;
                }).toList());

        dto.setRetweets(tweet.getRetweets() == null ? List.of() :
                tweet.getRetweets().stream().map(retweet -> {
                    TweetResponse.RetweetSummary rs = new TweetResponse.RetweetSummary();
                    rs.setId(retweet.getId());
                    if (retweet.getUser() != null) {
                        TweetResponse.UserSummary u = new TweetResponse.UserSummary();
                        u.setId(retweet.getUser().getId());
                        u.setUsername(retweet.getUser().getUsername());
                        u.setEmail(retweet.getUser().getEmail());
                        rs.setUser(u);
                    }
                    return rs;
                }).toList());

        return dto;
    }
}
