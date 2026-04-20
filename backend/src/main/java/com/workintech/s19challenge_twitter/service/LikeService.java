package com.workintech.s19challenge_twitter.service;

import com.workintech.s19challenge_twitter.dto.LikeRequest;

import com.workintech.s19challenge_twitter.entity.User;

public interface LikeService {
    String toggleLike(LikeRequest likeRequest, User user);
}
