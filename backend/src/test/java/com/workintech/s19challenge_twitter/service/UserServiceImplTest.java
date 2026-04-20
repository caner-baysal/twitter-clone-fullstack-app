package com.workintech.s19challenge_twitter.service;

import com.workintech.s19challenge_twitter.dto.LoginRequest;
import com.workintech.s19challenge_twitter.dto.RegisterRequest;
import com.workintech.s19challenge_twitter.entity.User;
import com.workintech.s19challenge_twitter.exceptions.CustomException;
import com.workintech.s19challenge_twitter.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserServiceImplTest {
    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserServiceImpl userService;

    private LoginRequest loginRequest;
    private RegisterRequest registerRequest;

    @BeforeEach
    void SetUp() {
        loginRequest = new LoginRequest();
        loginRequest.setUsername("testUser");
        loginRequest.setPassword("password");

        registerRequest = new RegisterRequest();
        registerRequest.setUsername("newUser");
        registerRequest.setEmail("newUser@test.com");
        registerRequest.setPassword("newPassword");
    }
    @Test
    void registerUser_ShouldReturnSavedUser_WhenEmailAndUsernameAvailable() {
        when(userRepository.findByEmail(registerRequest.getEmail())).thenReturn(null);
        when(userRepository.findByUsername(registerRequest.getUsername())).thenReturn(null);
        when(passwordEncoder.encode("newPassword")).thenReturn("encodedPassword123");

        User savedUser = new User();
        savedUser.setId(1L);
        savedUser.setUsername("newUser");
        savedUser.setEmail("newUser@test.com");
        savedUser.setPassword("encodedPassword123");
        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        User result = userService.registerUser(registerRequest);

        assertNotNull(result, "Registered user should not be null");
        assertEquals(1L, result.getId(), "Id should be 1");
        assertEquals("newUser", result.getUsername(),"Username should be correct");
        assertEquals("newUser@test.com", result.getEmail(),"Email should be correct");
        assertEquals("encodedPassword123", result.getPassword(), "Password should be correct");
    }
    @Test
    void loginUser_ShouldReturnSuccessMessage_WhenValidCredentials() {
        User existingUser = new User();
        existingUser.setUsername("testUser");
        existingUser.setPassword("encodedPassword");

        when(userRepository.findByUsername("testUser")).thenReturn(existingUser);
        when(passwordEncoder.matches("password", "encodedPassword")).thenReturn(true);

        String result = userService.loginUser((loginRequest));

        assertNotNull(result);
        assertTrue(result.contains("Logged in successfully"), "Should contain success message");
        assertTrue(result.contains("testUser"), "Should contain username");
    }
    @Test
    void loginUser_ShouldThrowException_WhenInvalidPassword(){
        LoginRequest wrongPasswordRequest = new LoginRequest();
        wrongPasswordRequest.setUsername("testUser");
        wrongPasswordRequest.setPassword("wrongPassword");

        CustomException exception = assertThrows(CustomException.class, () -> userService.loginUser(wrongPasswordRequest));
        assertEquals(HttpStatus.UNAUTHORIZED, exception.getHttpStatus());
        assertEquals("Invalid username or password", exception.getMessage());
    }
    @Test
    void loginUser_ShouldThrowException_WhenUserNotFound() {
        LoginRequest unknownUserRequest = new LoginRequest();
        unknownUserRequest.setUsername("unknownUser");
        unknownUserRequest.setPassword("anyPassword");

        when(userRepository.findByUsername("unknownUser")).thenReturn(null);

        CustomException exception = assertThrows(CustomException.class, () -> userService.loginUser(unknownUserRequest));
        assertEquals(HttpStatus.UNAUTHORIZED, exception.getHttpStatus());
        assertEquals("Invalid username or password", exception.getMessage());
    }
}
