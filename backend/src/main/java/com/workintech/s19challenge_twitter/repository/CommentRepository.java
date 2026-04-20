package com.workintech.s19challenge_twitter.repository;


import com.workintech.s19challenge_twitter.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {
}
