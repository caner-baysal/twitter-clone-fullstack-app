package com.workintech.s19challenge_twitter.service;

import com.workintech.s19challenge_twitter.dto.TweetRequest;
import com.workintech.s19challenge_twitter.entity.Tweet;
import com.workintech.s19challenge_twitter.entity.User;
import com.workintech.s19challenge_twitter.exceptions.CustomException;
import com.workintech.s19challenge_twitter.repository.TweetRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class TwitterServiceImplTest {
    @Mock
    private TweetRepository tweetRepository;

    @InjectMocks
    private TweetServiceImpl tweetService;

    private User testUser;
    private TweetRequest testRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setUsername("testuser");

        testRequest = new TweetRequest();
        testRequest.setContent("Test tweet");
    }

    @Test
    void should_CreateTweet_when_ValidInputProvided() {
        Tweet expectedTweet = new Tweet();
        expectedTweet.setId(1L);
        expectedTweet.setContent("Test tweet");
        expectedTweet.setUser(testUser);
        expectedTweet.setCreationDate(LocalDate.now());
        when (tweetRepository.save(any(Tweet.class))).thenReturn(expectedTweet);

        Tweet result = tweetService.createTweet(testRequest, testUser);
        assertNotNull(result, "The created tweet should not be null");
        assertEquals(1L, result.getId(), "The tweet ID should match the expected value");
        assertEquals("Test tweet", result.getContent(), "The tweet content should match the expected value");
        assertNotNull(result.getUser(), "The tweet user should not be null");
        assertEquals(testUser, result.getUser(), "The tweet user should match the expected user");
        assertNotNull(result.getCreationDate(), "The tweet creation date should not be null");
        assertEquals(LocalDate.now(), result.getCreationDate(), "The tweet creation date should be today's date");
    }

    @Test
    void should_GetTweetById_when_TweetExists() {
        Tweet expectedTweet = new Tweet();
        expectedTweet.setId(1L);
        expectedTweet.setContent("Test tweet");
        expectedTweet.setUser(testUser);
        expectedTweet.setCreationDate(LocalDate.now());
        when (tweetRepository.findById(1L)).thenReturn(Optional.of(expectedTweet));

        Tweet result = tweetService.getTweetById(1L);
        assertNotNull(result, "The retrieved tweet should not be null");
        assertEquals(1L, result.getId(), "The tweet ID should match the expected value");
        assertEquals("Test tweet", result.getContent(), "The tweet content should match the expected value");
        assertNotNull(result.getUser(), "The tweet user should not be null");
        assertEquals(testUser, result.getUser(), "The tweet user should match the expected user");
        assertNotNull(result.getCreationDate(), "The tweet creation date should not be null");
        assertEquals(LocalDate.now(), result.getCreationDate(), "The tweet creation date should be today's date");
    }
    @Test
    void should_UpdateTweet_when_ValidInputProvided() {
        Long tweetId = 1L;
        Tweet existingTweet = new Tweet();
        existingTweet.setId(tweetId);
        existingTweet.setContent("Former tweet");
        existingTweet.setUser(testUser);
        existingTweet.setCreationDate(LocalDate.now().minusDays(1));

        TweetRequest updateRequest = new TweetRequest();
        updateRequest.setContent("Updated tweet content");

        Tweet updatedTweet = new Tweet();
        updatedTweet.setId(tweetId);
        updatedTweet.setContent("Updated tweet content");
        updatedTweet.setUser(testUser);
        updatedTweet.setCreationDate(existingTweet.getCreationDate());
        when(tweetRepository.findById(tweetId)).thenReturn(Optional.of(existingTweet));
        when(tweetRepository.save(any(Tweet.class))).thenReturn(updatedTweet);

        Tweet result = tweetService.updateTweet(tweetId, updateRequest, testUser);

        assertNotNull(result, "The updated tweet should not be null");
        assertEquals(1L, result.getId(), "The tweet ID should match the expected value");
        assertEquals("Updated tweet content", result.getContent(), "The content should change to the updated value");
        assertEquals(testUser, result.getUser(), "The tweet user should remain the same");
        assertEquals(existingTweet.getCreationDate(), result.getCreationDate(), "The creation date should remain the same");
    }
    @Test
    void should_ThrowException_when_UserNotOwnerOfTweetOnUpdate() {
        Long tweetId = 1L;
        User differentUser = new User();
        differentUser.setId(2L);
        differentUser.setUsername("differentUser");
        Tweet existingTweet = new Tweet();
        existingTweet.setId(tweetId);
        existingTweet.setContent("Former content");
        existingTweet.setUser(differentUser);
        existingTweet.setCreationDate(LocalDate.now());

        TweetRequest updateRequest = new TweetRequest();
        updateRequest.setContent("Updated content");
        when(tweetRepository.findById(tweetId)).thenReturn(Optional.of(existingTweet));

        CustomException exception = assertThrows(CustomException.class, () ->tweetService.updateTweet(tweetId, updateRequest, testUser));
        assertEquals(HttpStatus.FORBIDDEN, exception.getHttpStatus());
        assertEquals("You are not authorized to update this tweet", exception.getMessage());

    }

    @Test
    void should_DeleteTweet_when_TweetExists() {
        Long tweetId = 1L;
        Tweet exsistingTweet = new Tweet();
        exsistingTweet.setId(tweetId);
        exsistingTweet.setContent("Test tweet");
        exsistingTweet.setUser(testUser);
        when (tweetRepository.findById(tweetId)).thenReturn(Optional.of(exsistingTweet));

        doNothing().when(tweetRepository).delete(exsistingTweet);

        assertDoesNotThrow(() -> tweetService.deleteTweet(tweetId, testUser), "Owner of the tewwt should be able to delete tweet");
        verify(tweetRepository, times(1)).delete(exsistingTweet);
    }
    @Test
    void should_ThrowException_when_TweetNotFound() {
        Long tweetId = 123L;
        when(tweetRepository.findById(tweetId)).thenReturn(Optional.empty());
        CustomException exception = assertThrows(CustomException.class, () -> tweetService.getTweetById(tweetId));
        assertEquals(HttpStatus.NOT_FOUND, exception.getHttpStatus());
        assertTrue(exception.getMessage().contains("Tweet not found"));
         verify(tweetRepository, never()).delete(any(Tweet.class));
    }
    @Test
    void should_ThrowException_when_UserNotOwnerOnDelete() {
        Long tweetId = 1L;
        User differentUser = new User();
        differentUser.setId(2L);
        differentUser.setUsername("differentUser");
        Tweet existingTweet = new Tweet();
        existingTweet.setId(tweetId);
        existingTweet.setContent("Test tweet");
        existingTweet.setUser(differentUser);
        when (tweetRepository.findById(tweetId)).thenReturn(Optional.of(existingTweet));

        CustomException exception = assertThrows(CustomException.class, () -> tweetService.deleteTweet(tweetId, testUser));
    }


}
