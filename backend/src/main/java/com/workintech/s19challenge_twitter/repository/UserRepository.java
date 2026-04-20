package com.workintech.s19challenge_twitter.repository;

import com.workintech.s19challenge_twitter.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
    User findByEmail(String email);

    User findByUsername(String username);
}
