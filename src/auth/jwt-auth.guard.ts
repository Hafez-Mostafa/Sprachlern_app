import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Authentifizierungs-Guard für JWT-geschützte Endpunkte.
 *
 * Dieser Guard verwendet die zuvor definierte JWT-Strategie ("jwt"),
 * um eingehende Anfragen zu überprüfen.
 *
 * Ist das JWT gültig, wird der Benutzer authentifiziert und die
 * Benutzerdaten werden unter `request.user` bereitgestellt.
 *
 * Ist das JWT ungültig, abgelaufen oder fehlt es vollständig,
 * wird die Anfrage mit dem HTTP-Statuscode 401 (Unauthorized)
 * abgelehnt.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
