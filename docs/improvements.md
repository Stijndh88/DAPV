# Wat kan beter dan de oude site?

Written 21/11/2026 after the old site was copied over. Ordered by what helps visitors and editors most for the least work.
✅ = done in this branch.

## Snel en duidelijk (gedaan)

1. ✅ **Kalender in twee weergaven.** Lijst per maand (met "Volgende" gemarkeerd) en "Seizoen in één blik": elke maand als
   mini-kalender, wedstrijddagen aanklikbaar. Werkt zonder JavaScript, dus ook in de statische demo.
2. ✅ **Kalender in je gsm.** `/kalender.ics` om te abonneren (Google, iPhone, Outlook) en per wedstrijd "Zet in je agenda"
   (.ics) en "Google Agenda". Loting = begin van de afspraak, einde = einde van het vissen.
3. ✅ **Route naar het water** op elke wedstrijd en visplaats (Google Maps, of de eigen kaartlink van het water).
4. ✅ **Wedstrijden in twee delen** tonen beide blokken ("09:00 tot 12:00 en 13:30 tot 17:00") in plaats van een fout einduur.
5. ✅ **Voeders en aas als labels**, zoals allergenen: per water wat mag en niet mag om te voederen en aan de haak, hoeveel,
   ondiep vissen, leefnet en korrels van de club, plus de clubregels. Op de visplaats én op elke wedstrijd daar.
   Redacteurs vinken het aan in Viswaters > Voeders en aas.
6. ✅ **Super Prestige als label** in plaats van een zin in de notities.
7. ✅ **Vorige/volgende wedstrijd** onderaan elke wedstrijd, en "Eerder gevist hier" op elke visplaats.
8. ✅ **Seizoen voorbij?** De kalender zegt dat het seizoen erop zit en dat de nieuwe kalender volgt.

## Volgende stap (klein tot middelgroot)

- **Weer voor de wedstrijddag** (Open-Meteo, gratis, geen sleutel): wind, regen en temperatuur vanaf 7 dagen vooraf.
  Heeft een kleine server-call per wedstrijdpagina nodig en de coördinaten van elk water.
- **Coördinaten per water + kaartje** (OpenStreetMap). Nu zoeken we op naam en gemeente, wat bij "Dender - Liedekerke" vaag is.
- **Delen naar WhatsApp/Facebook** op elke uitslag en elk nieuwsbericht (gewone links, geen tracking-knoppen).
- **Uitslag-template voor WhatsApp**: één knop die de top 3 als tekst kopieert om in de clubgroep te plakken.
- **Vissersprofielen**: per visser alle uitslagen, gemiddelde plaats, beste vangst, seizoensverloop.
- **Records**: zwaarste vangst ooit, per water en per seizoen; Koning per jaar.
- **Klassement per reeks**: Super Prestige vs. Kampioenschap (4 reeksen) apart. Wacht op Stijns keuze of GP's meetellen.

## Groter of om over te beslissen

- **Foto's per wedstrijd laten opladen** door leden (met goedkeuring door een redacteur).
- **Ledenzone**: ledenlijst, lidgeld, inschrijven voor wedstrijden. Vraagt accounts voor leden; de privacy van de ledenlijst eerst beslissen.
- **Online inschrijven voor een wedstrijd** (max. deelnemers, wachtlijst).
- **Nieuwsbrief of pushmelding** bij een nieuwe uitslag.

## Wat er nog in de data te controleren valt

Zie `migration/data/import/report.json` (`calendarDoubts`) en het PR-bericht.
