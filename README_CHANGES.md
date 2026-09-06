# Backend-Änderungen: Zentrale Concepts + Fragenpool

Dieses Archiv enthält NUR neue/geänderte Dateien, kein komplettes Repo.
Struktur entspricht eurem `backend/`-Root — einfach die Dateien an
gleicher Stelle überschreiben bzw. neu anlegen.

## 1. Dateien LÖSCHEN (nicht mehr gebraucht)

```
src/words/dto/create-word.dto.ts
src/words/dto/bulk-create-words.dto.ts
src/words/dto/image-upsert.dto.ts
```

Wörter werden nicht mehr eigenständig angelegt — das passiert jetzt
ausschließlich über `POST /concepts` bzw. `POST /concepts/:id/translations`.
Bilder hängen jetzt am Concept, nicht mehr am Wort.

## 2. Neue Dateien (einfach in gleicher Struktur ablegen)

```
src/concepts/                    (komplett neu)
src/question-pool/                (komplett neu)
```

## 3. Geänderte Dateien (überschreiben)

```
prisma/schema.prisma
prisma/migrations/20260906120000_central_concepts_and_question_pool/migration.sql   (neu)
src/words/words.controller.ts
src/words/words.service.ts
src/words/dto/update-word.dto.ts
src/tasks/tasks.service.ts
src/tasks/tasks.service.spec.ts
src/tasks/dto/create-task.dto.ts
src/tasks/dto/update-task.dto.ts
src/learning-progress/learning-progress.service.ts
src/learning-progress/learning-progress.service.spec.ts
src/app.module.ts
openapi.yaml
```

## 4. Nach dem Einspielen unbedingt tun

1. **Migration auf einer Kopie/Staging-DB testen**, nicht direkt auf
   Produktion (siehe Kommentar am Anfang der `migration.sql`). Die
   Migration ist datenerhaltend: jedes bestehende Wort wird sein eigenes
   Concept mit seinem bisherigen Bild; jeder bestehende Task bekommt seine
   eigene neue Fragenpool-Frage mit bisherigem Text/Antwort. Nichts geht
   verloren, aber ihr solltet danach bewusst gleiche Wörter zu einem
   gemeinsamen Concept zusammenführen (aktuell nur per SQL/Admin-UI, es
   gibt noch keinen automatischen "Merge"-Endpoint).
2. `npx prisma generate` laufen lassen (regeneriert den Prisma-Client für
   die neuen Modelle `concepts`/`question_pool` und die geänderten
   Relationen bei `words`/`images`/`tasks`).
3. `npm run build` (tsc) und `npm test` laufen lassen — ich konnte das
   hier nicht selbst ausführen (kein DB-Zugriff, und die vorhandenen
   DB-Zugangsdaten müsst ihr ohnehin rotieren, siehe Audit C1), also bitte
   als letzten Schritt bei euch verifizieren.
4. `npm run generate:types` im Frontend laufen lassen, sobald ihr die neue
   `openapi.yaml` übernommen habt — die generierten TS-Typen ändern sich
   spürbar (u. a. `Task.question_id` statt `Task.correct_answer`,
   komplett neue `Concept`/`Question`-Typen).

## 5. Was sich inhaltlich geändert hat (Kurzfassung)

- **Concepts**: `POST /concepts` erzwingt einen Text pro aktiver
  `app_language` in einem Request (400 sonst). Ein Bild hängt jetzt an
  `concepts` (1:1), nicht mehr an `words`. Audio bleibt 1:1 pro Wort/Sprache
  wie bisher.
- **Fragenpool**: `question_pool` (admin-only CRUD unter
  `/question-pool`) ist jetzt die einzige Quelle für Frage + Musterlösung.
  `tasks` referenziert nur noch `question_id`; `TasksService` prüft beim
  Anlegen/Ändern, dass die Frage zur Sprache der Exercise passt.
- **Nebeneffekt**: `correct_answer` wird dadurch nirgends mehr öffentlich
  ausgeliefert (behebt Audit-Finding C3 automatisch mit).
- **Zwei zusätzliche, beim Umbauen entdeckte Spec-Bugs mitkorrigiert**:
  `POST /words/{wordId}/tasks` war fälschlich die Wort-Erstellung
  (gehörte eigentlich unter `/words`) und die GET-Variante verlangte
  `adminBearerAuth`, obwohl der Controller sie public lässt — beides in
  der neuen `openapi.yaml` korrigiert.

## 6. Bewusst NICHT gemacht (nächster Schritt lt. eurer Vorgabe: erst Backend, dann Frontend)

Das Frontend (Admin-UI für Concepts/Fragenpool, ExercisePage-Anpassung an
`question_id`) ist noch NICHT angefasst — kommt im nächsten Schritt, wie
gewünscht.
