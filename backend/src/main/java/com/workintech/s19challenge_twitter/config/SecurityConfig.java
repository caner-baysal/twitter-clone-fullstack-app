package com.workintech.s19challenge_twitter.config;

import com.workintech.s19challenge_twitter.entity.User;
import com.workintech.s19challenge_twitter.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.hibernate.boot.model.relational.SqlStringGenerationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

import java.util.Arrays;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final UserRepository userRepository;

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3200"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setMaxAge(3600L);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth ->
                        auth
                                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                                .requestMatchers("/auth/register", "/auth/login", "/test").permitAll()
                                //.requestMatchers("/user/all").permitAll()
                                //.requestMatchers("tweet/all").permitAll()
                                .requestMatchers(HttpMethod.GET,"/tweet/findByUserId", "/tweet/findById", "/tweet/all", "/user/all").permitAll()
                                /*.requestMatchers("/like/**").authenticated()
                                .requestMatchers("/comment").authenticated()
                                .requestMatchers("/retweet/**").authenticated()
                                .requestMatchers("/tweet").authenticated()*/
                                .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .httpBasic(httpBasic -> {})
                .build();
    }


    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            System.out.println("Authentication Debug");
            System.out.println("Searching For Username: " + username);
            User user = userRepository.findByUsername(username);
            if (user == null) {
                System.out.println("User Not Found: " + username);

                throw new UsernameNotFoundException("User not found " + username);
            }
            return user;
//            System.out.println("User Successfully Found: " + user.getUsername());
//            System.out.println("Password Hash: " + user.getPassword());
//            return org.springframework.security.core.userdetails.User.builder()
//                    .username(user.getUsername())
//                    .password(user.getPassword())
//                    .roles("USER")
//                    .build();
        };
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userDetailsService());
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

}
