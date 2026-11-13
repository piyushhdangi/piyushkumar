# ============================================================================
# Smart Campus Lost & Found System - MySQL Database Schema
# Compatible with MySQL 8.0+ / MariaDB 10.6+
# ============================================================================

CREATE DATABASE IF NOT EXISTS smart_campus_lost_found
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_campus_lost_found;

-- Drop tables in reverse dependency order for clean initialization
DROP TABLE IF EXISTS StatusHistory;
DROP TABLE IF EXISTS Claims;
DROP TABLE IF EXISTS Items;
DROP TABLE IF EXISTS Users;

-- 1. Users Table
CREATE TABLE Users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'staff', 'admin') NOT NULL DEFAULT 'student',
  department VARCHAR(100) DEFAULT 'General Campus',
  student_or_staff_id VARCHAR(50) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_email (email),
  INDEX idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Items Table
CREATE TABLE Items (
  item_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  category ENUM(
    'ID & Cards',
    'Wallets & Bags',
    'Electronics',
    'Keys & Access',
    'Books & Notes',
    'Bottles & Gear',
    'Apparel & Accessories',
    'Other'
  ) NOT NULL,
  item_type ENUM('Lost', 'Found') NOT NULL,
  location VARCHAR(160) NOT NULL,
  report_date DATE NOT NULL,
  image_path VARCHAR(500) DEFAULT NULL,
  identifying_details TEXT DEFAULT NULL,
  verification_question VARCHAR(255) DEFAULT 'Please describe any unique marks, contents, or serial numbers on this item.',
  status ENUM('Open', 'Matched', 'Returned', 'Closed') NOT NULL DEFAULT 'Open',
  is_flagged_duplicate TINYINT(1) NOT NULL DEFAULT 0,
  user_id INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_items_user
    FOREIGN KEY (user_id) REFERENCES Users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  INDEX idx_items_type (item_type),
  INDEX idx_items_category (category),
  INDEX idx_items_status (status),
  INDEX idx_items_location (location),
  INDEX idx_items_report_date (report_date),
  INDEX idx_items_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Claims Table
CREATE TABLE Claims (
  claim_id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  claimant_id INT NOT NULL,
  identifying_features TEXT NOT NULL,
  verification_note TEXT NOT NULL,
  claim_status ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
  reviewer_note VARCHAR(255) DEFAULT NULL,
  reviewed_by INT DEFAULT NULL,
  reviewed_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_claims_item
    FOREIGN KEY (item_id) REFERENCES Items(item_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_claims_claimant
    FOREIGN KEY (claimant_id) REFERENCES Users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_claims_reviewer
    FOREIGN KEY (reviewed_by) REFERENCES Users(user_id)
    ON DELETE SET NULL
    ON UPDATE CASCADE,
  UNIQUE KEY uq_item_claimant (item_id, claimant_id),
  INDEX idx_claims_item (item_id),
  INDEX idx_claims_claimant (claimant_id),
  INDEX idx_claims_status (claim_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. StatusHistory Table
CREATE TABLE StatusHistory (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  item_id INT NOT NULL,
  old_status ENUM('None', 'Open', 'Matched', 'Returned', 'Closed') NOT NULL,
  new_status ENUM('Open', 'Matched', 'Returned', 'Closed') NOT NULL,
  note VARCHAR(255) DEFAULT NULL,
  updated_by INT NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_item
    FOREIGN KEY (item_id) REFERENCES Items(item_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT fk_history_user
    FOREIGN KEY (updated_by) REFERENCES Users(user_id)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  INDEX idx_history_item (item_id),
  INDEX idx_history_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
