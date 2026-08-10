-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "app_languages" (
    "app_language_id" SMALLSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "app_languages_pkey" PRIMARY KEY ("app_language_id")
);

-- CreateTable
CREATE TABLE "audios" (
    "audio_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "word_id" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "duration_ms" INTEGER,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audios_pkey" PRIMARY KEY ("audio_id")
);

-- CreateTable
CREATE TABLE "child_profiles" (
    "child_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "guardian_id" UUID NOT NULL,
    "nickname" VARCHAR(100) NOT NULL,
    "avatar" VARCHAR(255),
    "language_id" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "child_profiles_pkey" PRIMARY KEY ("child_id")
);

-- CreateTable
CREATE TABLE "exercise_types" (
    "exercise_type_id" SMALLSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "exercise_types_pkey" PRIMARY KEY ("exercise_type_id")
);

-- CreateTable
CREATE TABLE "exercises" (
    "exercise_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "title" VARCHAR(150) NOT NULL,
    "language_id" SMALLINT NOT NULL,
    "exercise_type_id" SMALLINT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("exercise_id")
);

-- CreateTable
CREATE TABLE "images" (
    "image_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "word_id" UUID NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "description" VARCHAR(255),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("image_id")
);

-- CreateTable
CREATE TABLE "learning_progress" (
    "progress_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "child_id" UUID NOT NULL,
    "task_id" UUID NOT NULL,
    "status_id" SMALLINT NOT NULL,
    "score" INTEGER,
    "completed_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "learning_progress_pkey" PRIMARY KEY ("progress_id")
);

-- CreateTable
CREATE TABLE "progress_status" (
    "progress_status_id" SMALLSERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,

    CONSTRAINT "progress_status_pkey" PRIMARY KEY ("progress_status_id")
);

-- CreateTable
CREATE TABLE "task_words" (
    "task_id" UUID NOT NULL,
    "word_id" UUID NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "pk_task_words" PRIMARY KEY ("task_id","word_id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "task_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "exercise_id" UUID NOT NULL,
    "question" TEXT NOT NULL,
    "correct_answer" VARCHAR(255) NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("task_id")
);

-- CreateTable
CREATE TABLE "words" (
    "word_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "text" VARCHAR(150) NOT NULL,
    "language_id" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "words_pkey" PRIMARY KEY ("word_id")
);

-- CreateTable
CREATE TABLE "admins" (
    "admin_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("admin_id")
);

-- CreateTable
CREATE TABLE "guardians" (
    "guardian_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardians_pkey" PRIMARY KEY ("guardian_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_languages_name_key" ON "app_languages"("name");

-- CreateIndex
CREATE UNIQUE INDEX "uq_audios_word_id" ON "audios"("word_id");

-- CreateIndex
CREATE INDEX "idx_child_profiles_language_id" ON "child_profiles"("language_id");

-- CreateIndex
CREATE INDEX "idx_child_profiles_guardian_id" ON "child_profiles"("guardian_id");

-- CreateIndex
CREATE UNIQUE INDEX "exercise_types_name_key" ON "exercise_types"("name");

-- CreateIndex
CREATE INDEX "idx_exercises_language_id" ON "exercises"("language_id");

-- CreateIndex
CREATE INDEX "idx_exercises_type_id" ON "exercises"("exercise_type_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_images_word_id" ON "images"("word_id");

-- CreateIndex
CREATE INDEX "idx_progress_child_id" ON "learning_progress"("child_id");

-- CreateIndex
CREATE INDEX "idx_progress_child_status" ON "learning_progress"("child_id", "status_id");

-- CreateIndex
CREATE INDEX "idx_progress_status_id" ON "learning_progress"("status_id");

-- CreateIndex
CREATE INDEX "idx_progress_task_id" ON "learning_progress"("task_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_progress_child_task" ON "learning_progress"("child_id", "task_id");

-- CreateIndex
CREATE UNIQUE INDEX "progress_status_name_key" ON "progress_status"("name");

-- CreateIndex
CREATE INDEX "idx_task_words_word_id" ON "task_words"("word_id");

-- CreateIndex
CREATE INDEX "idx_tasks_exercise_id" ON "tasks"("exercise_id");

-- CreateIndex
CREATE INDEX "idx_words_language_id" ON "words"("language_id");

-- CreateIndex
CREATE INDEX "idx_words_text" ON "words"("text");

-- CreateIndex
CREATE UNIQUE INDEX "uq_words_text_language" ON "words"("text", "language_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_admins_email" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "uq_guardians_email" ON "guardians"("email");

-- AddForeignKey
ALTER TABLE "audios" ADD CONSTRAINT "fk_audio_word" FOREIGN KEY ("word_id") REFERENCES "words"("word_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "child_profiles" ADD CONSTRAINT "fk_child_guardian" FOREIGN KEY ("guardian_id") REFERENCES "guardians"("guardian_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "child_profiles" ADD CONSTRAINT "fk_child_language" FOREIGN KEY ("language_id") REFERENCES "app_languages"("app_language_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "fk_exercise_language" FOREIGN KEY ("language_id") REFERENCES "app_languages"("app_language_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "fk_exercise_type" FOREIGN KEY ("exercise_type_id") REFERENCES "exercise_types"("exercise_type_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "images" ADD CONSTRAINT "fk_image_word" FOREIGN KEY ("word_id") REFERENCES "words"("word_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "fk_progress_child" FOREIGN KEY ("child_id") REFERENCES "child_profiles"("child_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "fk_progress_status" FOREIGN KEY ("status_id") REFERENCES "progress_status"("progress_status_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "learning_progress" ADD CONSTRAINT "fk_progress_task" FOREIGN KEY ("task_id") REFERENCES "tasks"("task_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_words" ADD CONSTRAINT "fk_task_words_task" FOREIGN KEY ("task_id") REFERENCES "tasks"("task_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "task_words" ADD CONSTRAINT "fk_task_words_word" FOREIGN KEY ("word_id") REFERENCES "words"("word_id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "fk_task_exercise" FOREIGN KEY ("exercise_id") REFERENCES "exercises"("exercise_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "words" ADD CONSTRAINT "fk_word_language" FOREIGN KEY ("language_id") REFERENCES "app_languages"("app_language_id") ON DELETE NO ACTION ON UPDATE NO ACTION;

