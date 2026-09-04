-- Demo board and vacancy data for LOCAL DEVELOPMENT ONLY.
--
-- Unlike seed-menu.sql, this is invented content, not a copy of the live sites: the real board
-- changes every year and is maintained through the CMS. It exists so the board and vacancy
-- screens have enough rows to exercise, in particular dragging them into a new order.
--
-- Run against a MariaDB instance after Hibernate has created the schema (start the backend once).
-- Safe to re-run: truncates first.

SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE board_member;
TRUNCATE TABLE board_term;
TRUNCATE TABLE vacancy;
SET FOREIGN_KEY_CHECKS = 1;

-- The current executive board is shared across both bars (bar IS NULL); previous terms are per bar.
INSERT INTO board_term (id, label, type, bar, is_current, sort_order, group_photo_id, photo_credit) VALUES
  (1, 'Board 2025-2026',        'EXECUTIVE',   NULL,     1, 0, NULL, NULL),
  (2, 'Board 2024-2025',        'EXECUTIVE',   'HUBBLE', 0, 1, NULL, 'Photos by Studio Voorbeeld'),
  (3, 'Board 2024-2025',        'EXECUTIVE',   'METEOR', 0, 2, NULL, NULL),
  (4, 'Supervisory Board 2025', 'SUPERVISORY', 'HUBBLE', 1, 3, NULL, NULL);

INSERT INTO board_member (term_id, name, role, sort_order, photo_id) VALUES
  (1, 'Ada Jansen',      'Chair',            0, NULL),
  (1, 'Bram de Vries',   'Secretary',        1, NULL),
  (1, 'Cleo Bakker',     'Treasurer',        2, NULL),
  (1, 'Daan Smit',       'Commissioner',     3, NULL),
  (1, 'Eva Meijer',      'Commissioner',     4, NULL),

  (2, 'Femke Willems',   'Chair',            0, NULL),
  (2, 'Gijs Hendriks',   'Secretary',        1, NULL),
  (2, 'Hanna Peters',    'Treasurer',        2, NULL),

  (3, 'Ivo Bos',         'Chair',            0, NULL),
  (3, 'Julia Kramer',    'Treasurer',        1, NULL),

  (4, 'Karel Dijkstra',  'Chair',            0, NULL),
  (4, 'Lotte van Dam',   'Member',           1, NULL);

-- A vacancy with no bar shows on both sites; the inactive one should stay off the public site.
INSERT INTO vacancy (title, description, hours, type, apply_email, apply_link, bar, active, sort_order, image_id) VALUES
  ('Bar Manager',    'Run the bar floor during evening shifts.', '10-15 hrs/week', 'Paid',      'board@hubble.cafe', NULL, 'HUBBLE', 1, 0, NULL),
  ('Kitchen Staff',  'Prepare the daily dish and lunch orders.', '8-12 hrs/week',  'Paid',      'board@hubble.cafe', NULL, 'HUBBLE', 1, 1, NULL),
  ('Event Helper',   'Help set up and run events at both bars.', 'Flexible',       'Volunteer', NULL,               NULL, NULL,     1, 2, NULL),
  ('Winter Barista', 'Seasonal role, filled for now.',           '6 hrs/week',     'Paid',      NULL,               NULL, 'METEOR', 0, 3, NULL);
