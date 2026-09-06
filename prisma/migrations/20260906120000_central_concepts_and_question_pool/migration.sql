-- ============================================================================
-- Migration: Zentrale Concepts (Wort = 1 Bild + N Texte/Audios pro Sprache)
--            + Fragenpool (question_pool) als einzige Quelle für Task-Fragen
--
-- WICHTIG: Vor dem Ausführen gegen eine Kopie/Staging-DB testen, nicht direkt
-- gegen Produktion. Diese Migration ist datenerhaltend (kein DROP TABLE ohne
-- vorherige Übernahme der Daten), aber sie verändert Kern-Tabellen strukturell.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Concepts-Tabelle anlegen
-- ----------------------------------------------------------------------------
CREATE TABLE "concepts" (
    "concept_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT "concepts_pkey" PRIMARY KEY ("concept_id")
);

-- ----------------------------------------------------------------------------
-- 2. words.concept_id einführen. Migrationsstrategie: JEDES bestehende Wort
--    bekommt sein EIGENES neues Concept (1:1). Das ist die einzige sichere
--    automatische Zuordnung - welche alten Wörter inhaltlich "dasselbe
--    Konzept" in verschiedenen Sprachen sind, kann eine Migration nicht
--    erraten. Der Admin kann Concepts danach bewusst zusammenführen
--    (z. B. über die neue Concepts-Verwaltung im Frontend).
-- ----------------------------------------------------------------------------
ALTER TABLE "words" ADD COLUMN "concept_id" UUID;

DO $$
DECLARE
  r RECORD;
  new_id UUID;
BEGIN
  FOR r IN SELECT word_id FROM "words" LOOP
    INSERT INTO "concepts" DEFAULT VALUES RETURNING concept_id INTO new_id;
    UPDATE "words" SET concept_id = new_id WHERE word_id = r.word_id;
  END LOOP;
END $$;

ALTER TABLE "words" ALTER COLUMN "concept_id" SET NOT NULL;
ALTER TABLE "words" ADD CONSTRAINT "fk_word_concept"
  FOREIGN KEY ("concept_id") REFERENCES "concepts"("concept_id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- Alte globale Eindeutigkeit (Text+Sprache) weicht der neuen Eindeutigkeit
-- pro Concept+Sprache (ein Concept darf pro Sprache nur einen Text haben).
DROP INDEX IF EXISTS "uq_words_text_language";
CREATE UNIQUE INDEX "uq_words_concept_language" ON "words"("concept_id", "language_id");
CREATE INDEX "idx_words_concept_id" ON "words"("concept_id");

-- ----------------------------------------------------------------------------
-- 3. Bilder von word_id auf concept_id umhängen (1:1 auf Concept-Ebene, damit
--    es künftig wirklich nur EIN Bild pro Concept gibt, egal wie viele
--    Sprach-Wörter daran hängen).
-- ----------------------------------------------------------------------------
ALTER TABLE "images" ADD COLUMN "concept_id" UUID;

UPDATE "images" i
SET concept_id = w.concept_id
FROM "words" w
WHERE w.word_id = i.word_id;

ALTER TABLE "images" ALTER COLUMN "concept_id" SET NOT NULL;
ALTER TABLE "images" DROP CONSTRAINT "fk_image_word";
ALTER TABLE "images" DROP COLUMN "word_id";
ALTER TABLE "images" DROP CONSTRAINT IF EXISTS "uq_images_word_id";
ALTER TABLE "images" ADD CONSTRAINT "uq_images_concept_id" UNIQUE ("concept_id");
ALTER TABLE "images" ADD CONSTRAINT "fk_image_concept"
  FOREIGN KEY ("concept_id") REFERENCES "concepts"("concept_id")
  ON DELETE CASCADE ON UPDATE NO ACTION;

-- ----------------------------------------------------------------------------
-- 4. Fragenpool-Tabelle anlegen
-- ----------------------------------------------------------------------------
CREATE TABLE "question_pool" (
    "question_id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "language_id" SMALLINT NOT NULL,
    "question" TEXT NOT NULL,
    "correct_answer" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
    CONSTRAINT "question_pool_pkey" PRIMARY KEY ("question_id")
);

ALTER TABLE "question_pool" ADD CONSTRAINT "fk_question_pool_language"
  FOREIGN KEY ("language_id") REFERENCES "app_languages"("app_language_id")
  ON DELETE NO ACTION ON UPDATE NO ACTION;

CREATE INDEX "idx_question_pool_language_id" ON "question_pool"("language_id");

-- ----------------------------------------------------------------------------
-- 5. tasks.question_id einführen. Migrationsstrategie: JEDER bestehende Task
--    bekommt seine eigene neue Pool-Frage mit seinem bisherigen question/
--    correct_answer-Inhalt (Sprache = Sprache der zugehörigen Exercise).
--    Mehrfach genutzte, identische Fragen kann der Admin danach im
--    Fragenpool bewusst zusammenführen.
-- ----------------------------------------------------------------------------
ALTER TABLE "tasks" ADD COLUMN "question_id" UUID;

DO $$
DECLARE
  t RECORD;
  ex_lang SMALLINT;
  new_q UUID;
BEGIN
  FOR t IN SELECT task_id, exercise_id, question, correct_answer FROM "tasks" LOOP
    SELECT language_id INTO ex_lang FROM "exercises" WHERE exercise_id = t.exercise_id;

    INSERT INTO "question_pool" (question_id, language_id, question, correct_answer)
    VALUES (gen_random_uuid(), ex_lang, t.question, t.correct_answer)
    RETURNING question_id INTO new_q;

    UPDATE "tasks" SET question_id = new_q WHERE task_id = t.task_id;
  END LOOP;
END $$;

ALTER TABLE "tasks" ALTER COLUMN "question_id" SET NOT NULL;
ALTER TABLE "tasks" ADD CONSTRAINT "fk_task_question"
  FOREIGN KEY ("question_id") REFERENCES "question_pool"("question_id")
  ON DELETE RESTRICT ON UPDATE NO ACTION;

CREATE INDEX "idx_tasks_question_id" ON "tasks"("question_id");

ALTER TABLE "tasks" DROP COLUMN "question";
ALTER TABLE "tasks" DROP COLUMN "correct_answer";
