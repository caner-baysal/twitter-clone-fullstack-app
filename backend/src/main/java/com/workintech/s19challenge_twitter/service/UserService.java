package com.workintech.s19challenge_twitter.service;

import com.workintech.s19challenge_twitter.dto.LoginRequest;
import com.workintech.s19challenge_twitter.dto.RegisterRequest;
import com.workintech.s19challenge_twitter.entity.User;

import java.util.List;

public interface UserService {
    User registerUser(RegisterRequest registerRequest);
    String loginUser(LoginRequest loginRequest);
    List<User> getAllUsers();
    User getCurrentUser();
    User findById(Long id);
    User findByUsername(String username);
    void deleteUser(Long id);
}
