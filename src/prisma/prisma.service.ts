import 'dotenv/config';

import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from 'generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

/**
 * Lädt die Umgebungsvariablen aus der .env-Datei.
 *
 * Dadurch steht z. B. process.env.DATABASE_URL zur Verfügung.
 */

/**
 * Prisma 7 verwendet einen Datenbank-Adapter.
 *
 * PrismaPg stellt die Verbindung zu einer PostgreSQL-Datenbank her.
 * Dafür wird die Verbindungsadresse (DATABASE_URL) aus der .env-Datei gelesen.
 */
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

/**
 * PrismaService verbindet NestJS mit Prisma.
 *
 * Aufgaben:
 * - Erbt alle Datenbankmethoden von PrismaClient.
 * - Baut beim Start der Anwendung eine Datenbankverbindung auf.
 * - Trennt die Verbindung beim Beenden der Anwendung.
 *
 * Dadurch müssen andere Services sich nicht selbst um die
 * Datenbankverbindung kümmern.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  /**
   * Erstellt den PrismaClient.
   *
   * Der Adapter wird an die Basisklasse (PrismaClient)
   * übergeben. Erst dadurch weiß Prisma, wie die Verbindung
   * zur PostgreSQL-Datenbank hergestellt werden soll.
   */
  constructor() {
    super({ adapter });
  }

  /**
   * Lifecycle-Hook von NestJS.
   *
   * Wird automatisch einmal beim Start der Anwendung aufgerufen.
   * Baut die Verbindung zur Datenbank auf.
   *
   * Ablauf:
   *
   * NestJS startet
   *        ↓
   * PrismaService wird erstellt
   *        ↓
   * constructor()
   *        ↓
   * onModuleInit()
   *        ↓
   * this.$connect()
   *        ↓
   * Verbindung zu PostgreSQL
   */
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Lifecycle-Hook von NestJS.
   *
   * Wird automatisch aufgerufen, wenn die Anwendung beendet wird.
   * Schließt die Verbindung zur Datenbank sauber.
   *
   * Ablauf:
   *
   * Anwendung wird beendet
   *        ↓
   * onModuleDestroy()
   *        ↓
   * this.$disconnect()
   *        ↓
   * Verbindung wird geschlossen
   */
  async onModuleDestroy() {
    await this.$disconnect();
  }
}
