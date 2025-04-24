CREATE DATABASE youtube_research;
CREATE TABLE youtube_metadata (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    url VARCHAR(500) DEFAULT NULL,
    fetch_time DATETIME NOT NULL,
    type VARCHAR(50) NOT NULL,
    publish_time DATETIME DEFAULT NULL,
    view_count BIGINT DEFAULT NULL,
    likes_count INT DEFAULT 0,
    comments_count INT DEFAULT 0,
    tags TEXT DEFAULT NULL,
    category VARCHAR(100) DEFAULT NULL,
    INDEX (url)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;