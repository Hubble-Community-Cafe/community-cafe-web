-- Per-tab access for staff/board users, replacing the single hierarchical role step by step.
-- A module without a row is hidden for that user. Admins hold every module through their role,
-- so they get no rows. Rows go with the user (ON DELETE CASCADE), also for the bulk delete of
-- the data-retention job.
--
-- Existing users keep exactly the access they have today (must match AccessPresets.forRole):
--   VIEWER     VIEW on every content tab, EDIT on SCREENS (switching scenes was open to everyone)
--   DDD_POSTER as VIEWER, plus EDIT on DAILY_DISH
--   EDITOR     EDIT on every content tab, SCREENS and SCREEN_POSTERS

CREATE TABLE `admin_user_permission` (
  `admin_user_id` bigint(20) NOT NULL,
  `module` varchar(30) NOT NULL,
  `access_level` varchar(10) NOT NULL,
  PRIMARY KEY (`admin_user_id`, `module`),
  CONSTRAINT `fk_admin_user_permission_user` FOREIGN KEY (`admin_user_id`)
    REFERENCES `admin_user` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

INSERT INTO `admin_user_permission` (`admin_user_id`, `module`, `access_level`)
SELECT u.`id`, m.`module`,
       CASE
         WHEN u.`role` = 'EDITOR' THEN 'EDIT'
         WHEN u.`role` = 'DDD_POSTER' AND m.`module` = 'DAILY_DISH' THEN 'EDIT'
         ELSE 'VIEW'
       END
FROM `admin_user` u
CROSS JOIN (
  SELECT 'MENU' AS `module`
  UNION ALL SELECT 'DAILY_DISH'
  UNION ALL SELECT 'OPENING_HOURS'
  UNION ALL SELECT 'EVENTS'
  UNION ALL SELECT 'BOARD'
  UNION ALL SELECT 'VACANCIES'
  UNION ALL SELECT 'ASSOCIATIONS'
  UNION ALL SELECT 'MEDIA'
) m
WHERE u.`role` IN ('VIEWER', 'DDD_POSTER', 'EDITOR');

INSERT INTO `admin_user_permission` (`admin_user_id`, `module`, `access_level`)
SELECT `id`, 'SCREENS', 'EDIT' FROM `admin_user` WHERE `role` IN ('VIEWER', 'DDD_POSTER', 'EDITOR');

INSERT INTO `admin_user_permission` (`admin_user_id`, `module`, `access_level`)
SELECT `id`, 'SCREEN_POSTERS', 'EDIT' FROM `admin_user` WHERE `role` = 'EDITOR';
