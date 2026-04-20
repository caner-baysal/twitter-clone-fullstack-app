package com.workintech.s19challenge_twitter;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;


@SpringBootApplication
public class S19challengeTwitterApplication {

    public static void main(String[] args) {

        System.setProperty("spring.devtools.restart.enabled", "false");
        System.setProperty("spring.devtools.livereload.enabled", "false");


        SpringApplication.run(S19challengeTwitterApplication.class, args);
    }

}
