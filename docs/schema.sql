-- Community Cafe Web: full database schema.
--
-- Run this in phpMyAdmin (or any MariaDB client) against the "cafeweb" database
-- when you need the tables before the backend container is healthy.
-- Hibernate (ddl-auto=update) will also create these automatically once the
-- backend can reach the database, so running this script is idempotent.
--
-- Order matters: create referenced tables before tables that reference them.

SET FOREIGN_KEY_CHECKS = 0;

-- Standalone: no foreign keys
CREATE TABLE IF NOT EXISTS media_asset (
    id            BIGINT          NOT NULL AUTO_INCREMENT,
    filename      VARCHAR(255)    NOT NULL,
    content_type  VARCHAR(100),
    url           VARCHAR(512)    NOT NULL,
    alt           VARCHAR(255),
    size_bytes    BIGINT,
    width         INT,
    height        INT,
    bar           VARCHAR(20),
    uploaded_by_oid VARCHAR(255),
    created_at    DATETIME(6)     NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_user (
    id            BIGINT          NOT NULL AUTO_INCREMENT,
    azure_oid     VARCHAR(255)    NOT NULL,
    email         VARCHAR(255)    NOT NULL,
    display_name  VARCHAR(255),
    role          VARCHAR(20)     NOT NULL,
    created_at    DATETIME(6)     NOT NULL,
    updated_at    DATETIME(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_admin_user_azure_oid (azure_oid)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS audit_log (
    id            BIGINT          NOT NULL AUTO_INCREMENT,
    entity_type   VARCHAR(40)     NOT NULL,
    entity_id     BIGINT,
    entity_label  VARCHAR(255),
    action        VARCHAR(30)     NOT NULL,
    actor_oid     VARCHAR(255),
    actor_email   VARCHAR(255),
    actor_name    VARCHAR(255),
    changes       TEXT,
    summary       VARCHAR(500),
    created_at    DATETIME(6)     NOT NULL,
    PRIMARY KEY (id),
    INDEX idx_audit_entity   (entity_type, entity_id),
    INDEX idx_audit_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Self-referencing: parent_id points to another row in the same table (tab hierarchy)
CREATE TABLE IF NOT EXISTS menu_category (
    id                BIGINT          NOT NULL AUTO_INCREMENT,
    name              VARCHAR(100)    NOT NULL,
    kind              VARCHAR(10)     NOT NULL,
    availability_note VARCHAR(255),
    sort_order        INT             NOT NULL,
    bar               VARCHAR(20),
    parent_id         BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_menu_category_parent FOREIGN KEY (parent_id) REFERENCES menu_category (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Depends on menu_category and media_asset
CREATE TABLE IF NOT EXISTS menu_item (
    id            BIGINT          NOT NULL AUTO_INCREMENT,
    category_id   BIGINT          NOT NULL,
    name          VARCHAR(200)    NOT NULL,
    description   TEXT,
    regular_price DECIMAL(6,2)    NOT NULL,
    student_price DECIMAL(6,2),
    size_options  VARCHAR(255)    NOT NULL DEFAULT '',
    dietary_tags  VARCHAR(255)    NOT NULL DEFAULT '',
    allergens     VARCHAR(255)    NOT NULL DEFAULT '',
    image_id      BIGINT,
    sort_order    INT             NOT NULL,
    active        TINYINT(1)      NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    CONSTRAINT fk_menu_item_category FOREIGN KEY (category_id) REFERENCES menu_category (id),
    CONSTRAINT fk_menu_item_image    FOREIGN KEY (image_id)    REFERENCES media_asset (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Depends on media_asset
CREATE TABLE IF NOT EXISTS daily_dish (
    id          BIGINT          NOT NULL AUTO_INCREMENT,
    date        DATE            NOT NULL,
    name        VARCHAR(200)    NOT NULL,
    description TEXT,
    price       DECIMAL(6,2),
    image_id    BIGINT,
    PRIMARY KEY (id),
    CONSTRAINT fk_daily_dish_image FOREIGN KEY (image_id) REFERENCES media_asset (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Weekly opening hours (one row per bar per day; missing day = closed that day)
CREATE TABLE IF NOT EXISTS opening_hours (
    id            BIGINT       NOT NULL AUTO_INCREMENT,
    bar           VARCHAR(20)  NOT NULL,
    day_of_week   VARCHAR(10)  NOT NULL,
    open_time     TIME         NOT NULL,
    close_time    TIME         NOT NULL,
    kitchen_open  TIME,
    kitchen_close TIME,
    PRIMARY KEY (id),
    UNIQUE KEY uk_opening_hours_bar_day (bar, day_of_week)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events (per bar; published = false hides from public site without deleting)
CREATE TABLE IF NOT EXISTS event (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    bar            VARCHAR(20)  NOT NULL,
    title          VARCHAR(200) NOT NULL,
    description    TEXT,
    date           DATE         NOT NULL,
    start_time     TIME,
    price          VARCHAR(100),
    subscribe_link VARCHAR(512),
    image_id       BIGINT,
    published      TINYINT(1)   NOT NULL DEFAULT 1,
    PRIMARY KEY (id),
    INDEX idx_event_bar_date (bar, date),
    CONSTRAINT fk_event_image FOREIGN KEY (image_id) REFERENCES media_asset (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One-off date overrides (holidays, special closures, special hours)
CREATE TABLE IF NOT EXISTS hours_override (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    bar         VARCHAR(20)  NOT NULL,
    date        DATE         NOT NULL,
    closed      TINYINT(1)   NOT NULL DEFAULT 1,
    open_time   TIME,
    close_time  TIME,
    note        VARCHAR(255),
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Board terms and members (current/previous executive, supervisory)
CREATE TABLE IF NOT EXISTS board_term (
    id              BIGINT       NOT NULL AUTO_INCREMENT,
    label           VARCHAR(100) NOT NULL,
    type            VARCHAR(20)  NOT NULL,
    bar             VARCHAR(20),
    is_current      TINYINT(1)   NOT NULL DEFAULT 0,
    sort_order      INT          NOT NULL DEFAULT 0,
    group_photo_id  BIGINT,
    photo_credit    VARCHAR(300),
    PRIMARY KEY (id),
    INDEX idx_board_term_type (type),
    CONSTRAINT fk_board_term_group_photo FOREIGN KEY (group_photo_id) REFERENCES media_asset (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS board_member (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    term_id     BIGINT       NOT NULL,
    name        VARCHAR(100) NOT NULL,
    role        VARCHAR(100),
    photo_id    BIGINT,
    sort_order  INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    INDEX idx_board_member_term (term_id),
    CONSTRAINT fk_board_member_term  FOREIGN KEY (term_id)  REFERENCES board_term (id),
    CONSTRAINT fk_board_member_photo FOREIGN KEY (photo_id) REFERENCES media_asset (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS vacancy (
    id          BIGINT       NOT NULL AUTO_INCREMENT,
    title       VARCHAR(100) NOT NULL,
    description TEXT,
    hours       VARCHAR(100),
    type        VARCHAR(100),
    apply_email VARCHAR(200),
    apply_link  VARCHAR(512),
    image_id    BIGINT,
    bar         VARCHAR(20),
    active      TINYINT(1)   NOT NULL DEFAULT 1,
    sort_order  INT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    CONSTRAINT fk_vacancy_image FOREIGN KEY (image_id) REFERENCES media_asset (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
