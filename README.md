Twitter Clone — Full Stack Project

A full-stack Twitter clone built with Spring Boot and React, developed as a practical exercise
to implement RESTful API design, Spring Security, JPA relationships, and React frontend integration.

Project Overview

This project simulates core Twitter features including tweeting, liking, commenting, and retweeting.
It demonstrates a layered backend architecture connected to a React frontend, with JWT-less
Basic Authentication and CORS configuration between two separate servers.

Features

- ✅ User registration and login (Spring Security / Basic Auth)
- ✅ Create, read, update and delete tweets
- ✅ Like / unlike tweets
- ✅ Comment on tweets
- ✅ Retweet (appears in feed with original author attribution)
- ✅ Global exception handling
- ✅ Bean validation on all inputs
- ✅ CORS configuration (frontend on port 3200, backend on port 3000)
- ✅ Unit tests (JUnit 5 + Mockito)
- ✅ Responsive UI

Tech Stack

Backend
| Technology | Purpose |
|---|---|
| Java 17 | Core programming language |
| Spring Boot 3.2.5 | Application framework |
| Spring Security | Authentication and authorization (Basic Auth + BCrypt) |
| Spring Data JPA / Hibernate | ORM and database access |
| PostgreSQL | Relational database |
| Lombok | Boilerplate reduction (getters, setters, constructors) |
| Jakarta Validation | Input validation (annotations on DTOs and entities) |
| JUnit 5 | Unit testing framework |
| Mockito | Mocking dependencies in unit tests |
| Maven | Build and dependency management tool |

Frontend
| Technology | Purpose |
|---|---|
| JavaScript (ES6+) | Core programming language |
| React 19 | UI library (functional components and hooks) |
| Axios | HTTP client with request/response interceptors |
| CSS3 | Custom styling, animations, responsive layout |

Architecture

The backend follows a classic layered architecture:
- **Controller** — handles HTTP requests and responses
- **Service** — contains business logic
- **Repository** — JPA interfaces for database access
- **Entity** — JPA mapped database tables
- **DTO** — Data Transfer Objects to avoid exposing entities directly
- **GlobalExceptionHandler** — centralized error handling via `@RestControllerAdvice`

Database Schema

The PostgreSQL database uses the `twitter_clone` schema with the following tables:

- `users` — registered user accounts
- `tweets` — tweet content linked to users
- `comments` — comments linked to tweets and users
- `likes` — like records linked to tweets and users
- `retweets` — retweet records linked to tweets and users

Getting Started

Prerequisites
- Java 17+
- Node.js 18+
- PostgreSQL

Backend Setup
```bash
# Clone the repository
git clone <repo-url>

# Configure database credentials in application.properties
spring.datasource.url=jdbc:postgresql://localhost:5432/fsweb
spring.datasource.username=your_username
spring.datasource.password=your_password

# Run the application
./mvnw spring-boot:run
# Backend will start on http://localhost:3000
```

Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start the dev server
npm start
# Frontend will start on http://localhost:3200
```

API Endpoints

| Method | Endpoint | Description | Auth Required |

| POST | /tweet | Create tweet | ✅ Yes |
| PUT | /tweet/:id | Update tweet | ✅ Yes |
| DELETE | /tweet/:id | Delete tweet (owner only) | ✅ Yes |
| POST | /like | Like / unlike a tweet | ✅ Yes |
| POST | /comment | Add comment | ✅ Yes |
| PUT | /comment/:id | Update comment | ✅ Yes |
| DELETE | /comment/:id | Delete comment (owner only) | ✅ Yes |
| POST | /retweet | Retweet a tweet | ✅ Yes |
| DELETE | /retweet/:id | Delete retweet | ✅ Yes |

Testing

Unit tests are written for the core service layer covering tweet and user operations.

```bash
# Run tests
./mvnw test
```

Notes

- This project was built as a university assignment to practice Spring Boot concepts
- Passwords are stored as BCrypt hashes — never in plain text
- The frontend stores the password in React state only for Basic Auth header generation
  (not suitable for production — use JWT tokens in a real application)
- CORS is configured to allow requests only from `http://localhost:3200`
