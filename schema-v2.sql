-- =====================================================================
-- DDL-Skript: Sprachlern-App (PostgreSQL) - Version 2 (guardians + admins)
-- =====================================================================

-- Erweiterung für UUID-Generierung
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================================
-- LOOKUP-TABELLEN
-- =====================================================================

CREATE TABLE app_languages (
    app_language_id SMALLSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE exercise_types (
    exercise_type_id SMALLSERIAL PRIMARY KEY,
    name             VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE progress_status (
    progress_status_id SMALLSERIAL PRIMARY KEY,
    name               VARCHAR(100) NOT NULL UNIQUE
);

-- =====================================================================
-- STAMMDATEN
-- =====================================================================

INSERT INTO app_languages(name) VALUES ('DE'), ('AR');

INSERT INTO exercise_types(name)
VALUES ('MULTIPLE_CHOICE'), ('MATCHING'), ('TEXT_INPUT');

INSERT INTO progress_status(name)
VALUES ('OPEN'), ('IN_PROGRESS'), ('COMPLETED');

-- =====================================================================
-- 1. GUARDIANS (Sorgeberechtigte) — vormals "parents"
-- =====================================================================

CREATE TABLE guardians (
    guardian_id   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_guardians_email UNIQUE (email)
);
-- Hinweis: Der automatische UNIQUE-Index auf email reicht vollkommen aus.

-- =====================================================================
-- 1b. ADMINS — eigenständige Ressource mit eigenem Login/Auth,
--     bewusst getrennt von guardians (kein gemeinsames Konto/Rollenfeld)
-- =====================================================================

CREATE TABLE admins (
    admin_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT uq_admins_email UNIQUE (email)
);

-- =====================================================================
-- 2. CHILD_PROFILE (Kinderprofil)
-- =====================================================================

CREATE TABLE child_profiles (
    child_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guardian_id UUID NOT NULL,
    nickname    VARCHAR(100) NOT NULL,
    avatar      VARCHAR(255),
    language_id SMALLINT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_child_guardian
        FOREIGN KEY (guardian_id) REFERENCES guardians (guardian_id) ON DELETE CASCADE,
    CONSTRAINT fk_child_language
        FOREIGN KEY (language_id) REFERENCES app_languages (app_language_id)
);

CREATE INDEX idx_child_profiles_guardian_id ON child_profiles (guardian_id);
CREATE INDEX idx_child_profiles_language_id ON child_profiles (language_id);

-- =====================================================================
-- 3. EXERCISE (Lernübung)
-- =====================================================================

CREATE TABLE exercises (
    exercise_id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title            VARCHAR(150) NOT NULL,
    language_id      SMALLINT NOT NULL,
    exercise_type_id SMALLINT NOT NULL,
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_exercise_language
        FOREIGN KEY (language_id) REFERENCES app_languages (app_language_id),
    CONSTRAINT fk_exercise_type
        FOREIGN KEY (exercise_type_id) REFERENCES exercise_types (exercise_type_id)
);

CREATE INDEX idx_exercises_language_id ON exercises (language_id);
CREATE INDEX idx_exercises_type_id ON exercises (exercise_type_id);

-- =====================================================================
-- 4. WORD (Lernwort)
-- =====================================================================

CREATE TABLE words (
    word_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text        VARCHAR(150) NOT NULL,
    language_id SMALLINT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_word_language
        FOREIGN KEY (language_id) REFERENCES app_languages (app_language_id),
    CONSTRAINT uq_words_text_language
        UNIQUE (text, language_id)
);

CREATE INDEX idx_words_language_id ON words (language_id);
CREATE INDEX idx_words_text ON words (text);

-- =====================================================================
-- 5. IMAGE (Bild zum Lernwort - 1:1)
-- =====================================================================

CREATE TABLE images (
    image_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word_id     UUID NOT NULL,
    url         VARCHAR(500) NOT NULL,
    description VARCHAR(255),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_image_word
        FOREIGN KEY (word_id) REFERENCES words (word_id) ON DELETE CASCADE,
    CONSTRAINT uq_images_word_id
        UNIQUE (word_id)
);

-- =====================================================================
-- 6. AUDIO (Aussprache zum Lernwort - 1:1)
-- =====================================================================

CREATE TABLE audios (
    audio_id    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word_id     UUID NOT NULL,
    url         VARCHAR(500) NOT NULL,
    duration_ms INT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_audio_word
        FOREIGN KEY (word_id) REFERENCES words (word_id) ON DELETE CASCADE,
    CONSTRAINT uq_audios_word_id
        UNIQUE (word_id)
);

-- =====================================================================
-- 7. TASK (Aufgabe innerhalb einer Übung)
-- =====================================================================

CREATE TABLE tasks (
    task_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exercise_id    UUID NOT NULL,
    question       TEXT NOT NULL,
    correct_answer VARCHAR(255) NOT NULL,
    position       INT NOT NULL DEFAULT 0,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_task_exercise
        FOREIGN KEY (exercise_id) REFERENCES exercises (exercise_id) ON DELETE CASCADE
);

CREATE INDEX idx_tasks_exercise_id ON tasks (exercise_id);

-- =====================================================================
-- 8. TASK_WORDS (Zwischentabelle: n:m)
-- =====================================================================

CREATE TABLE task_words (
    task_id  UUID NOT NULL,
    word_id  UUID NOT NULL,
    position INT NOT NULL DEFAULT 0,

    CONSTRAINT pk_task_words
        PRIMARY KEY (task_id, word_id),
    CONSTRAINT fk_task_words_task
        FOREIGN KEY (task_id) REFERENCES tasks (task_id) ON DELETE CASCADE,
    CONSTRAINT fk_task_words_word
        FOREIGN KEY (word_id) REFERENCES words (word_id) ON DELETE RESTRICT
);

CREATE INDEX idx_task_words_word_id ON task_words (word_id);

-- =====================================================================
-- 9. LEARNING_PROGRESS (Lernfortschritt)
-- =====================================================================

CREATE TABLE learning_progress (
    progress_id  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id     UUID NOT NULL,
    task_id      UUID NOT NULL,
    status_id    SMALLINT NOT NULL,
    score        INT CHECK (score >= 0 AND score <= 100),
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_progress_child
        FOREIGN KEY (child_id) REFERENCES child_profiles (child_id) ON DELETE CASCADE,
    CONSTRAINT fk_progress_status
        FOREIGN KEY (status_id) REFERENCES progress_status (progress_status_id),
    CONSTRAINT fk_progress_task
        FOREIGN KEY (task_id) REFERENCES tasks (task_id) ON DELETE CASCADE,
    CONSTRAINT uq_progress_child_task
        UNIQUE (child_id, task_id)
);

CREATE INDEX idx_progress_child_id ON learning_progress (child_id);
CREATE INDEX idx_progress_task_id ON learning_progress (task_id);
CREATE INDEX idx_progress_status_id ON learning_progress (status_id);
CREATE INDEX idx_progress_child_status ON learning_progress (child_id, status_id);

-- =====================================================================
-- ENDE DES SKRIPTS
-- =====================================================================
