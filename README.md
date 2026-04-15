
| 1            |                                                                                                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Titel        | Projekt Setup                                                                                                                                                                                                                               |
| Inhalt       | Git, Typescript, Ordnerstruktur  für public und api<br>ExpressJS im api, public ohne UI Libraries<br>Ergebnis: Boilerplate Setup ist im GitLab eingecheckt, und Server Funktionalität mit helloworld dummy erfolgreich getestet |
| Prioriät     | hoch                                                                                                                                                                                                                                        |
| Abhängig von | -                                                                                                                                                                                                                                           |

| 2            |                                                     |
| ------------ | --------------------------------------------------- |
| Titel        | Design erstellen                                    |
| Inhalt       | Ergebnis: Design als Skizze, ggf. Mockup mit drawio |
| Prioriät     | hoch                                                |
| Abhängig von | Anforderungen final definiert für Version 1         |

| 3            |                                                                                                                                                                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Titel        | Zufallszahlen Generierung Serverseitig                                                                                                                                                                                                                                        |
| Inhalt       | Verbindung zwischen Client + Server: Es gibt einen GET Endpunkt auf der Server der angefragt werden kann um eine zufallszahl abzufragen.<br>Wie werden die Zufallszahlen generiert? mit nodejs Bordmitteln https://nodejs.org/api/crypto.html#cryptorandomintmin-max-callback |
| Prioriät     |                                                                                                                                                                                                                                                                               |
| Abhängig von |                                                                                                                                                                                                                                                                               |
|              |                                                                                                                                                                                                                                                                               |

| 4            |                                                                                                                                                                                                                                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Titel        | Zufällig Element auswählen                                                                                                                                                                                                                                                                                                      |
| Inhalt       | Ziel des ganzen ist aus einer Menge von Elementen (abgebildet durch die Segmente eines Rads) zufällig eines auszuwählen. Die Auswahl wird durch das Drehen eines Rads visualisiert.<br><br>Zufallsgeneration: Es wird eine Element bestimmt, das Rad dreht eine ganze Umdrehung und dann so lange bis das Element erreich wurde |
| Prioriät     |                                                                                                                                                                                                                                                                                                                                 |
| Abhängig von |                                                                                                                                                                                                                                                                                                                                 |

| 5            |                                                                                                              |
| ------------ | ------------------------------------------------------------------------------------------------------------ |
| Titel        | Element Auswahl physikalisch "korrekt" darstellen                                                            |
| Inhalt       | Verlangsamung der Rotationsgeschwindigkeit des Rads auf den letzten 180° bis zu einer minimalgeschwindigkeit |
| Prioriät     |                                                                                                              |
| Abhängig von |                                                                                                              |

| 6            |                                                                                                         |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| Titel        | Visualisierung Rad                                                                                      |
| Inhalt       | Als SVG via JavaScript generiert, konfigurierbar viele Felder in gleicher größe, unterschiedliche Farbe |
| Prioriät     |                                                                                                         |
| Abhängig von |                                                                                                         |

| 7            |                                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Titel        | Customization: Anzahl Segmente                                                                                           |
| Inhalt       | Der Nutzer kann bestimmen wie viele Felder das Rad hat, jedes Segment hat einen Namen, es kann auch leere segmente geben |
| Prioriät     |                                                                                                                          |
| Abhängig von |                                                                                                                          |

| 8            |                                                                                                                                      |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Titel        | Customization: Stärke Regler                                                                                                         |
| Inhalt       | Der kann über einen Schieberegler die Stärke/Intensität/Dauer der Drehbewegung steuern<br>*Was genau heißt Stärke/Intensität/Dauer?* |
| Prioriät     |                                                                                                                                      |
| Abhängig von |                                                                                                                                      |

| 9            |                                                        |
| ------------ | ------------------------------------------------------ |
| Titel        | Customization: Drehrichtung                            |
| Inhalt       | Der Nutzer kann bestimmen ob das Rad CCW oder CW dreht |
| Prioriät     |                                                        |
| Abhängig von |                                                        |

| 10           |                                                                                                                                                                                                          |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Titel        | Drehen-Button                                                                                                                                                                                            |
| Inhalt       | Es gibt ein Button um das Drehen zu starten<br>Was ist das Drehen? Berúcksichtigt die eingestellten Werte für Stärke, Drehrichtung und Anzahl Segmente und startet den Prozess. <br>Was ist der Prozess? |
| Prioriät     |                                                                                                                                                                                                          |
| Abhängig von |                                                                                                                                                                                                          |


| 11           |                                |
| ------------ | ------------------------------ |
| Titel        | Assets raussuchen für: Sounds, |
| Inhalt       |                                |
| Prioriät     |                                |
| Abhängig von |                                |
