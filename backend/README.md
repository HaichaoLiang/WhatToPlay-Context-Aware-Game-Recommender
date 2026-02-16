# WhatToPlay Backend (Flask + MySQL + JWT)

## Setup
1) Create MySQL DB and user:
```sql
CREATE DATABASE whatoplay CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'whatoplayuser'@'localhost' IDENTIFIED BY 'your_pw';
GRANT ALL PRIVILEGES ON whatoplay.* TO 'whatoplayuser'@'localhost';
FLUSH PRIVILEGES;
