-- Baseline: the production schema as of 2026-09-28 (v1.2.x), from a structure-only export of the
-- live database (MariaDB 12.2). It includes the two manual migrations that used to live in
-- docs/migrations (menu_category.active, audit_log VARCHAR columns) and whatever Hibernate's former
-- ddl-auto=update created, types, key names and all.
--
-- Production itself never runs this file: it already has these tables, so Flyway marks it as V1
-- (spring.flyway.baseline-on-migrate). It builds new databases: e2e, local development, new setups.
-- Do not edit it; every change goes in a new V<n>__description.sql.

CREATE TABLE `admin_user` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `azure_oid` varchar(255) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `display_name` varchar(255) DEFAULT NULL,
  `email` varchar(255) NOT NULL,
  `role` enum('ADMIN','DDD_POSTER','EDITOR','VIEWER') NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKedndehou4au0e2w7nfk49u0ey` (`azure_oid`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `association` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `bar` enum('HUBBLE','METEOR') DEFAULT NULL,
  `name` varchar(100) NOT NULL,
  `logo_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKmqvayxu0vtujx2v4ixhb3t63b` (`logo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `audit_log` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `action` varchar(30) NOT NULL,
  `actor_email` varchar(255) DEFAULT NULL,
  `actor_name` varchar(255) DEFAULT NULL,
  `actor_oid` varchar(255) DEFAULT NULL,
  `changes` text DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `entity_id` bigint(20) DEFAULT NULL,
  `entity_label` varchar(255) DEFAULT NULL,
  `entity_type` varchar(40) NOT NULL,
  `summary` varchar(500) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_audit_entity` (`entity_type`,`entity_id`),
  KEY `idx_audit_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `board_member` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `role` varchar(100) DEFAULT NULL,
  `sort_order` int(11) NOT NULL,
  `photo_id` bigint(20) DEFAULT NULL,
  `term_id` bigint(20) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `FKmksnsygm8hs68l4g6qoxmfpw5` (`photo_id`),
  KEY `FK2f8yqislnnw8c6eubxakmkioh` (`term_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `board_term` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `bar` enum('HUBBLE','METEOR') DEFAULT NULL,
  `is_current` bit(1) NOT NULL,
  `label` varchar(100) NOT NULL,
  `photo_credit` varchar(300) DEFAULT NULL,
  `sort_order` int(11) NOT NULL,
  `type` enum('EXECUTIVE','SUPERVISORY') NOT NULL,
  `group_photo_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FK8sie7irg7998fcl1un6ogf5g1` (`group_photo_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `daily_dish` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `date` date NOT NULL,
  `description` text DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `price` decimal(6,2) DEFAULT NULL,
  `image_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKr0uslwri3lfqvmjoc1sfs1r8l` (`image_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `event` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `bar` enum('HUBBLE','METEOR') NOT NULL,
  `date` date NOT NULL,
  `description` text DEFAULT NULL,
  `price` varchar(100) DEFAULT NULL,
  `published` bit(1) NOT NULL,
  `start_time` time DEFAULT NULL,
  `subscribe_link` varchar(512) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `image_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKg09jk632f7hgjq91e4npti956` (`image_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `form_submission` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `had_attachment` bit(1) NOT NULL,
  `type` enum('COMPLAINT','DECLARATION','INFORMATION','LOAN','SCREEN') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `hours_override` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `bar` enum('HUBBLE','METEOR') NOT NULL,
  `close_time` time DEFAULT NULL,
  `closed` bit(1) NOT NULL,
  `date` date NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `open_time` time DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `media_asset` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `alt` varchar(255) DEFAULT NULL,
  `bar` enum('HUBBLE','METEOR') DEFAULT NULL,
  `content_type` varchar(100) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `filename` varchar(255) NOT NULL,
  `height` int(11) DEFAULT NULL,
  `size_bytes` bigint(20) DEFAULT NULL,
  `uploaded_by_oid` varchar(255) DEFAULT NULL,
  `url` varchar(512) NOT NULL,
  `width` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `menu_category` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `availability_note` varchar(255) DEFAULT NULL,
  `bar` enum('HUBBLE','METEOR') DEFAULT NULL,
  `kind` enum('DRINK','FOOD') NOT NULL,
  `name` varchar(100) NOT NULL,
  `sort_order` int(11) NOT NULL,
  `parent_id` bigint(20) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `FKd5p8k4v86nblgj0jvixy9k38j` (`parent_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `menu_item` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `allergens` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `dietary_tags` varchar(255) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `regular_price` decimal(6,2) NOT NULL,
  `size_options` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL,
  `student_price` decimal(6,2) DEFAULT NULL,
  `category_id` bigint(20) NOT NULL,
  `image_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKqrrmg534c9fint7sxs1tmnyou` (`category_id`),
  KEY `FK2h8vmboj8uvyj649400c429se` (`image_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `opening_hours` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `bar` enum('HUBBLE','METEOR') NOT NULL,
  `close_time` time NOT NULL,
  `day_of_week` enum('FRIDAY','MONDAY','SATURDAY','SUNDAY','THURSDAY','TUESDAY','WEDNESDAY') NOT NULL,
  `kitchen_close` time DEFAULT NULL,
  `kitchen_open` time DEFAULT NULL,
  `open_time` time NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKq06elwdqc4tj3tpgb686o1qq2` (`bar`,`day_of_week`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Single-row settings table; the entity assigns its id itself, so no AUTO_INCREMENT.
CREATE TABLE `screen_scene_settings` (
  `id` bigint(20) NOT NULL,
  `closed_poster_id` bigint(20) DEFAULT NULL,
  `last_call_poster_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

CREATE TABLE `vacancy` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `active` bit(1) NOT NULL,
  `apply_email` varchar(200) DEFAULT NULL,
  `apply_link` varchar(512) DEFAULT NULL,
  `bar` enum('HUBBLE','METEOR') DEFAULT NULL,
  `description` text DEFAULT NULL,
  `hours` varchar(100) DEFAULT NULL,
  `sort_order` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `type` varchar(100) DEFAULT NULL,
  `image_id` bigint(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `FKsotajj6opyt8vyr5eh62yuou0` (`image_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

-- Foreign keys last, so the tables above can be created in any order.

ALTER TABLE `association`
  ADD CONSTRAINT `FKmqvayxu0vtujx2v4ixhb3t63b` FOREIGN KEY (`logo_id`) REFERENCES `media_asset` (`id`);

ALTER TABLE `board_member`
  ADD CONSTRAINT `FK2f8yqislnnw8c6eubxakmkioh` FOREIGN KEY (`term_id`) REFERENCES `board_term` (`id`),
  ADD CONSTRAINT `FKmksnsygm8hs68l4g6qoxmfpw5` FOREIGN KEY (`photo_id`) REFERENCES `media_asset` (`id`);

ALTER TABLE `board_term`
  ADD CONSTRAINT `FK8sie7irg7998fcl1un6ogf5g1` FOREIGN KEY (`group_photo_id`) REFERENCES `media_asset` (`id`);

ALTER TABLE `daily_dish`
  ADD CONSTRAINT `FKr0uslwri3lfqvmjoc1sfs1r8l` FOREIGN KEY (`image_id`) REFERENCES `media_asset` (`id`);

ALTER TABLE `event`
  ADD CONSTRAINT `FKg09jk632f7hgjq91e4npti956` FOREIGN KEY (`image_id`) REFERENCES `media_asset` (`id`);

ALTER TABLE `menu_category`
  ADD CONSTRAINT `FKd5p8k4v86nblgj0jvixy9k38j` FOREIGN KEY (`parent_id`) REFERENCES `menu_category` (`id`);

ALTER TABLE `menu_item`
  ADD CONSTRAINT `FK2h8vmboj8uvyj649400c429se` FOREIGN KEY (`image_id`) REFERENCES `media_asset` (`id`),
  ADD CONSTRAINT `FKqrrmg534c9fint7sxs1tmnyou` FOREIGN KEY (`category_id`) REFERENCES `menu_category` (`id`);

ALTER TABLE `vacancy`
  ADD CONSTRAINT `FKsotajj6opyt8vyr5eh62yuou0` FOREIGN KEY (`image_id`) REFERENCES `media_asset` (`id`);
