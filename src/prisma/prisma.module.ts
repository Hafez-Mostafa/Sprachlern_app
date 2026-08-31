import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule stellt den PrismaService für die gesamte Anwendung bereit.
 *
 * Da das Modul mit @Global() markiert ist, muss es nur einmal
 * (z. B. im AppModule) importiert werden. Danach kann der
 * PrismaService in allen anderen Modulen per Dependency Injection
 * verwendet werden.
 */
@Global()
@Module({
  /**
   * providers:
   * Hier registriert NestJS den PrismaService.
   * Dadurch kann NestJS eine Instanz erstellen und verwalten.
   */
  providers: [PrismaService],

  /**
   * exports:
   * Macht den PrismaService für andere Module verfügbar.
   *
   * Ohne export könnten andere Module den Service
   * nicht per Constructor Injection verwenden.
   */
  exports: [PrismaService],
})
export class PrismaModule {}
