# TimeTraq — Volledige Functionaliteitsoverzicht

> Dit document beschrijft elke pagina, feature en functionaliteit van TimeTraq, inclusief alle verschillen tussen de **beheerder (admin)** en de **medewerker (employee)** rol.

---

## Inhoudsopgave

1. [Rollen & Rechten](#1-rollen--rechten)
2. [Authenticatie](#2-authenticatie)
3. [Navigatie & Layout](#3-navigatie--layout)
4. [Dashboard — Medewerker](#4-dashboard--medewerker)
5. [Dashboard — Beheerder](#5-dashboard--beheerder)
6. [Timesheets](#6-timesheets)
7. [Projecten](#7-projecten)
8. [Teams](#8-teams)
9. [Verlofaanvragen — Medewerker](#9-verlofaanvragen--medewerker)
10. [Verlofbeheer — Beheerder](#10-verlofbeheer--beheerder)
11. [Urenrapportage — Beheerder](#11-urenrapportage--beheerder)
12. [Weekstatus & Debrief](#12-weekstatus--debrief)
13. [Instellingen](#13-instellingen)
14. [AI-assistent (Timy)](#14-ai-assistent-timy)
15. [Desktop Tracker](#15-desktop-tracker)
16. [Realtime & Notificaties](#16-realtime--notificaties)
17. [Aanwezigheid (Presence)](#17-aanwezigheid-presence)

---

## 1. Rollen & Rechten

TimeTraq kent twee rollen. Elke gebruiker heeft er precies één.

| Kenmerk | Medewerker | Beheerder |
|---|---|---|
| Interne rolnaam | `employee` | `admin` |
| Eigen timesheets beheren | ✅ | ✅ |
| Eigen verlofaanvragen | ✅ | ✅ |
| Eigen weekstatus invullen | ✅ | ✅ |
| Teams bekijken waarvan lid | ✅ | ✅ |
| Teams aanmaken / bewerken | ❌ | ✅ |
| Alle teams beheren | ❌ | ✅ |
| Projecten aanmaken | Alleen als creator-rechten | ✅ |
| Verlofaanvragen goedkeuren/afwijzen | ❌ | ✅ |
| Urenrapportage inzien | ❌ | ✅ |
| Medewerkers uitnodigen | ❌ | ✅ |
| Organisatie-instellingen aanpassen | ❌ | ✅ |
| Andere medewerker beheerder maken | ❌ | ✅ |
| Medewerker uit organisatie halen | ❌ | ✅ |
| Weekstatus-debrief inzien | ❌ | ✅ |
| Werkuren & verlofbeleid instellen | ❌ | ✅ |

---

## 2. Authenticatie

### Registreren
- Formulier met voornaam, achternaam, e-mail en wachtwoord
- Wachtwoordsterktemeter met visuele balk (zwak / matig / sterk / zeer sterk)
- Wachtwoordveld met tonen/verbergen knop
- Akkoord met privacybeleid verplicht aanvinken
- Google OAuth-registratie als alternatief

### Inloggen
- E-mail + wachtwoord combinatie
- Google OAuth-inloggen ("Inloggen met Google")
- Onthoud mij optie
- Link naar wachtwoord vergeten

### Wachtwoord vergeten / herstellen
- Stap 1: E-mailadres invoeren → herstelmail ontvangt de gebruiker
- Stap 2: Link in mail opent pagina voor nieuw wachtwoord instellen

### E-mailverificatie
- Na registratie wordt verificatiemail verstuurd
- Pagina toont wachtstatus en biedt knop om verificatiemail opnieuw te sturen

### Uitloggen
- Beschikbaar via de instellingenpagina (rode knop)

---

## 3. Navigatie & Layout

### Zijbalk (sidebar)
Zichtbaar op alle pagina's na inloggen. Bevat:

| Menuitem | Zichtbaar voor |
|---|---|
| Dashboard | Iedereen |
| Timesheets | Iedereen |
| Projects | Iedereen |
| Teams | Iedereen |
| Leave requests / Verlofbeheer | Medewerker ziet eigen aanvragen, beheerder ziet beheerpagina |
| Urenrapportage | Alleen beheerder |
| Settings | Iedereen |

- De rolindicator (Beheerder / Medewerker) is zichtbaar onderaan de sidebar
- Op mobiel: sidebar is verborgen achter een hamburger-knop; sluitbaar met Escape of buitenklick

### Header
- Hamburger-knop voor mobiele sidebar
- Logo / naam van de applicatie
- Notificatiemenu (klokkicoontje) met in-app meldingen
- Avatar-cirkel van de ingelogde gebruiker

### AI-assistent knop (Timy)
- Vaste zweefknop rechtsonder op elke pagina (na inloggen)
- Opent het Timy chatvenster

---

## 4. Dashboard — Medewerker

**URL:** `/dashboard`

### Snapshot-kaarten (bovenaan)
Vier compacte tellerkaarten:
- **Openstaande acties** — totaal aantal dingen dat aandacht vereist
- **Uren deze week** — totaal geregistreerde minuten omgezet naar uren
- **Openstaande verlofaanvragen** — eigen aanvragen in behandeling
- **Open verlofdagen** — resterende verlofdagen dit jaar

### Actielijst (Inbox)
Toont wat de medewerker nog moet doen:
- **Timesheets te verwerken** — aantal dagregistraties dat nog goedgekeurd moet worden (met link naar timesheets)
- **Verlofaanvragen in behandeling** — eigen open aanvragen
- **Weekstatus herinnering** — als de weekstatus van de lopende week nog niet ingevuld is

### Week-sectie
- **Uren overzicht:** grafische weergave van geregistreerde uren t.o.v. verwachte werkuren; verlof van die week wordt apart gemarkeerd
- **Weekstatus:** knop om weekstatus in te vullen (met rode badge als herinnering open staat)
- **Vandaag:** lijst van teamleden met verlof vandaag + eigen taakbeschikbaarheidsstatus (vrij voor taken / bezig)
- **Desktop tracker-banner:** verschijnt als de tracker nog niet verbonden is

### Notificatiepaneel
- Toont de vijf meest recente in-app meldingen van TimeTraq (weekstatus, goedkeuringen, etc.)

---

## 5. Dashboard — Beheerder

**URL:** `/admin/dashboard` (herschreven naar `/dashboard` voor beheerders)

### Snapshot-kaarten
- **Medewerkers** — totaal aantal leden in de organisatie
- **Teams** — totaal aantal teams
- **Openstaande acties** — som van alle openstaande acties (verlof + lidmaatschappen + uitnodigingen + werkuren-setup)
- **Getrackte uren deze week** — organisatietotaal van alle geregistreerde uren deze week

### Actielijst (Inbox)
- **Verlofaanvragen:** lijst van openstaande aanvragen met naam, periode en goedkeur/afwijsknop per rij (direct uitvoerbaar vanuit het dashboard)
- **Lidmaatschapsaanvragen:** medewerkers die zichzelf hebben aangemeld voor een team
- **Werkurensetup:** medewerkers die nog geen werkurenprofiel of maatwerkinstellingen hebben
- **Openstaande uitnodigingen:** aantal uitnodigingen dat nog niet geaccepteerd is

### Vandaag en deze week
- **Aanwezigheidsoverzicht (teaser):** compacte samenvatting (aanwezig / afwezig / verlof / ziek) met link naar volledig overzicht
- **Weekafwezigheid:** overzicht van wie er deze week afwezig is (verlof / ziek)

---

## 6. Timesheets

**URL:** `/timesheets`

De tijdregistratie is de kernfunctionaliteit van TimeTraq.

### Kalenderweergaven
De timesheet toont een kalender in drie weergaven die de gebruiker zelf kiest:

| Weergave | Beschrijving |
|---|---|
| **Week** | Alle 5 werkdagen naast elkaar als kolommen; standaardweergave |
| **Dag** | Één werkdag als kolom; handig op smal scherm of voor detailwerk |
| **Maand** | Maandoverzicht per dag met dagtellingen |

- Navigeren tussen weken/maanden met pijlknoppen of swipe
- "Vandaag"-knop om direct naar de huidige week te springen
- Weeknummer en datumbereik worden altijd getoond

### Tijdblokken (entries)
Elk geregistreerd uur is een gekleurde blok in de kalender:
- **Titel** van de activiteit
- **Projectkoppeling** (optioneel)
- **Tijdslot** (starttijd – eindtijd)
- **Kleur** naar keuze (uit een vaste palet)
- **Beschrijving** (optioneel)

### Tijdblok aanmaken
- Klik op een leeg tijdslot in de kalender → formulier-popup opent
- Formulier bevat: titel, beschrijving, project, datum, starttijd, eindtijd, kleur
- Tijden kunnen worden ingetypt of aangepast via +/- knoppen
- Validatie op overlap, weekenddagen en ongeldige tijden

### Tijdblok bewerken
- Klik op een bestaand blok → formulier-popup opent met huidige waarden
- Alle velden aanpasbaar
- Verwijderknop beschikbaar in het formulier

### Drag-and-drop
- Tijdblokken kunnen binnen de kalender gesleept worden naar een ander tijdslot of andere dag
- Formaat aanpassen door te slepen aan de boven- of onderkant van een blok (resize)
- Drempelafstand voorkomt per ongeluk verplaatsen bij klikken

### Displaybereik aanpassen
- De zichtbare tijdspanne van de kalender (bijv. 07:00–20:00) is instelbaar
- Instelling wordt opgeslagen in localStorage en blijft bewaard na pagina vernieuwen

### Projectselectie in formulier
- Dropdown met eigen projecten; zoekveld voor snel filteren
- Toont projectnaam en klantnaam

### Kleurenkiezer
- Keuze uit een vaste set kleuren voor het tijdblok
- Kleur is puur visueel en heeft geen verdere betekenis

### Now-lijn
- Horizontale rode lijn in de kalender die de huidige tijd aangeeft
- Wordt automatisch bijgewerkt elke minuut

### AI-voorstellen & activiteitpaneel
Panel boven de kalender met twee secties:

**AI-voorstellen (proposals):**
- Gegenereerde tijdregistratievoorstellen op basis van desktop tracker-activiteit
- Per voorstel: titel, tijdslot, gekoppeld project, beschrijving
- Acties per voorstel:
  - **Aanpassen** — inlinebewerkingsformulier om titel, beschrijving, project, datum en tijden aan te passen
  - **Goedkeuren** — voorstel wordt een echte tijdblok in de kalender
  - **Verwijderen** — voorstel wordt verwijderd
- Knop "Genereer voor vandaag" — vraagt de AI om nieuwe voorstellen te genereren op basis van desktop-activiteit

**Recent:**
- Lijst van de meest recent bewerkte/aangemaakte tijdregistraties
- Per rij: titel, dag, tijdslot, tijdstip van bewerken
- Knoppen om te bewerken (navigeert naar correcte week) of te verwijderen

### Vensterhistorie (Tracker Window Titles)
- In het tijdformulier beschikbaar als de desktop tracker actief is
- Toont een lijst van geopende applicaties/venstertitels op het betreffende moment
- Helpt de gebruiker herinneren wat hij/zij op een bepaald moment deed

---

## 7. Projecten

**URL:** `/projects`

### Overzichtspagina

**Statistieken (3 kaarten):**
- Totaal actieve projecten
- Getrackte uren deze maand
- Budgetbenutting (% van urenbudget dat al gebruikt is)

**Filters:**
- Zoekbalk op projectnaam, klantnaam, teamleden
- Typefilter: Alle / Extern (klant) / Intern

**Projectkaarten:**
Elke kaart toont: naam, type, status, klant (indien extern), gekoppelde teams, avatar-stack van leden, en budgetvoortgang.

### Projectdetailpagina

**URL:** `/projects/{id}`

- Projectlogo of eerste letter als fallback
- Naam, type (Extern/Intern), klantnaam
- Statusbadge (In behandeling / Voltooid / On hold / etc.)
- Knop "Uren boeken" → navigeert direct naar timesheets met het project voorgeselecteerd

**Statistieken:**
- Totaal getrackte uren (beheerder ziet organisatietotaal, medewerker ziet eigen uren)
- Budgetvoortgang-balk met percentage (rood als over budget)

**Teams gekoppeld aan project:** lijst van betrokken teams met link

**Leden:** avatar-stack met naam en e-mail

**Recente activiteit:** laatste tijdregistraties op dit project

**Openstaande voorstellen:** AI-voorstellen die nog goedgekeurd moeten worden

### Admin vs. Medewerker — Projecten

| Functie | Medewerker | Beheerder |
|---|---|---|
| Projecten zien | Alleen projecten waar lid van | Alle projecten |
| Nieuw project aanmaken | Alleen als creator-rechten zijn verleend | Altijd |
| Project bewerken | Alleen als creator-rechten zijn verleend | Altijd |
| Project verwijderen | Alleen als creator-rechten zijn verleend | Altijd |
| Urenstat. inzien | Eigen uren | Organisatietotaal |
| Rechten-paneel | ❌ | ✅ |
| Weekstatus-debrief knop | ❌ (eigen weekstatus formulier) | Link naar debrief-pagina |

### Project aanmaken / bewerken (multistap formulier)
Stap 1 — **Basis:** naam + logo-upload + logo verwijderen
Stap 2 — **Type:** Extern (klant + klantnaam verplicht) of Intern
Stap 3 — **Planning:** status, urenbudget, gekoppelde teams

### Rechten-paneel (admin only)
Beheert wie projecten mag aanmaken:
- Lijst van alle medewerkers
- Per medewerker een toggle om creator-rechten aan of uit te zetten

### Weekstatus (medewerker)
- Knop verschijnt in de projectenlijst als de weekstatus actief is
- Rode badge als de status nog ingevuld moet worden of de herinnering vervallen is
- Opent een formulier (multistap):
  - Stap 1: Wat was er moeilijk deze week?
  - Stap 2: Wat ga je volgende week doen?
  - Optie "Vul voorstel in" als AI-draft beschikbaar is (genereert antwoorden op basis van geregistreerde uren)

---

## 8. Teams

**URL:** `/teams`

### Overzichtspagina

**Statistieken (admin):**
- Totaal teams
- Actieve leden

**Statistieken (medewerker):**
- Jouw teams
- Collega's in teams

**Zoekbalk:** filtert op teamnaam, afdeling en ledennamen

**Teamkaarten:** naam, afdeling, avatar-stack van maximaal 4 leden, ledenaantal, beheerder-acties

### Tabbladen (admin only)
Beheerders zien twee tabbladen:
- **Teams** — standaard teamoverzicht
- **Medewerkers** — aanwezigheidsoverzicht van alle medewerkers

### Openstaande lidmaatschapsaanvragen (admin)
Boven de teamkaarten als er aanvragen zijn:
- Naam en e-mail van de medewerker
- Naam van het gevraagde team
- Knoppen: Goedkeuren / Afwijzen

### Team aanmaken (admin)
Multistap formulier:
- Stap 1: Teamnaam + afdeling
- Stap 2: Leden selecteren via zoekbare picker

### Teamdetailpagina

**URL:** `/teams/{id}`

- Teamnaam en afdeling
- Ledenaantal
- Knop "Bewerken" (admin en teammanager)
- Knop "Team verlaten" (voor eigen goedgekeurd lidmaatschap)

**Secties:**
- **Leden:** lijst met avatar, naam en e-mail
- **Open aanvragen (admin):** lidmaatschapsaanvragen voor dit team met goedkeur/afwijs knoppen
- **Projecten:** gekoppelde projecten met links
- **Verlof van teamleden:** goedgekeurd verlof in de komende 4 weken

### Medewerkers-tab (admin only)
Toont een kaartenoverzicht van alle medewerkers met per kaart:
- Naam, e-mail, teams
- Aanwezigheidsstatus van vandaag (In kantoor / Niet aanwezig / Verlof / Ziek / Overig verlof) met kleurcodering
- Taakbeschikbaarheid (Vrij voor taken / Bezig)
- Datum tot wanneer verlof duurt (als van toepassing)
- Actiemenu:
  - Beheerder maken
  - Uit bedrijf halen

### Organisatie-instellingen (admin)
- Knop in de teams-header
- Opent een panel voor organisatienaam en andere basisgegevens
- Bij lege organisatie getoond als uitgelicht formulier op de pagina zelf

---

## 9. Verlofaanvragen — Medewerker

**URL:** `/leave-requests`

### Overzichtskaarten
- **Open verlofdagen** — resterend dit jaar
- **Aanvragen in behandeling** — eigen open aanvragen
- **Komend goedgekeurd verlof** — goedgekeurde toekomstige periodes

### Verlofbalans
- Jaarbudget, gebruikt, in behandeling, resterend

### Teamverlof komende periode
- Overzicht van goedgekeurd verlof van directe teamleden de komende weken

### Eigen aanvragenlijst
Filterbare lijst (Alle / In behandeling / Goedgekeurd / Afgewezen) met per aanvraag:
- Type verlof (Vakantie / Ziekte / Overig)
- Periode en aantal dagen
- Status-badge (amber = in behandeling, groen = goedgekeurd, rood = afgewezen)
- Actieknop: bewerken (als nog in behandeling)
- Afwijzingsreden (indien afgewezen)
- Link naar bijlage (doktersbrief bij ziekte)

### Nieuwe verlofaanvraag
Multistap formulier:
- Stap 1: **Type** — Vakantie / Ziekte / Overig (visuele radiobuttons met iconen)
- Stap 2: **Periode** — van/tot datum
- Stap 3: **Extra** — opmerking (optioneel) + doktersbrief bij ziekte (PDF/JPG/PNG, max 5 MB)

---

## 10. Verlofbeheer — Beheerder

**URL:** `/admin/leave-requests`

### Zoeken en filteren
- Zoekbalk op naam of e-mail van medewerker
- Statusfilter: Alle / In behandeling / Goedgekeurd / Afgewezen
- Type-filter: Alle / Vakantie / Ziekte / Overig

### Aanvragenlijst
Tabelweergave (desktop) + kaartweergave (mobiel) met per aanvraag:
- Medewerker naam + avatar
- Type verlof met icoon
- Periode en dagaantal
- Status-badge (kleurgecodeerd)
- Indiendatum
- Link naar doktersbrief (indien aanwezig)
- Afwijzingsreden (indien afgewezen)

### Acties per aanvraag
Via een actie-dropdown:
- **Goedkeuren** — status wordt goedgekeurd, medewerker wordt genotificeerd
- **Afwijzen** — vraagt om een reden (verplicht tekstveld), medewerker wordt genotificeerd
- **Bewerken** — zelfde multistap formulier als medewerker

### Bulk goedkeuren
- Checkboxes naast aanvragen
- "Alles selecteren" optie
- Bulk goedkeur-knop voor alle geselecteerde aanvragen tegelijk

---

## 11. Urenrapportage — Beheerder

**URL:** `/admin/timesheet-report`

### Filters
- **Periode:** van/tot datum
- **Medewerker:** dropdown van alle medewerkers (optioneel)
- **Project:** dropdown van alle projecten (optioneel)
- **Team:** dropdown van alle teams (optioneel)

### Rapporttabel
Per rij: medewerker, project, datum, titel, tijdslot, duur in uren

### Paginering
Instelbaar aantal rijen per pagina: 10, 25, 50 of Alle

### Exporteren
- **CSV-export** — download van gefilterde data als spreadsheet
- **PDF-export** — download van gefilterde data als PDF

Exportbestand bevat dezelfde filters als het huidige rapportscherm.

---

## 12. Weekstatus & Debrief

### Weekstatus invullen (medewerker)
Beschikbaar via de projectenpagina (knop "Weekstatus"):
- Stap 1: Wat was er moeilijk deze week?
- Stap 2: Wat ga je volgende week doen?
- AI-voorstel beschikbaar als de gebruiker voldoende uren heeft geregistreerd: genereert automatisch een concept op basis van timesheet-data
- Herinnering-badge als de deadline nadert

### Weekly Debrief (beheerder)

**URL:** `/admin/weekly-debrief`

- Navigeerbaar per week (vorige / volgende week)
- Toont ingediende weekstatussen van alle medewerkers
- Per medewerker: naam, avatar, antwoorden op beide vragen
- Teller hoeveel medewerkers hebben ingediend

**AI-samenvatting:**
- Als AI geconfigureerd is: knop "Samenvatting genereren"
- Toont een door AI gegenereerde samenvatting van alle weekstatussen
- Samenvatting geparsed als markdown met secties (## koppen)
- Tijdstip van generatie wordt getoond

---

## 13. Instellingen

**URL:** `/settings`

### Account (iedereen)
- **Profielfoto:** upload (JPEG, PNG, WebP, GIF, max 2 MB); verwijderen als foto aanwezig is; bij geen foto worden initialen getoond
- **Gebruikersnaam:** optioneel, letters/cijfers/streepjes/underscores, min. 3 tekens
- **E-mailadres:** leesbaar getoond (niet bewerkbaar via dit scherm)
- **Uitloggen:** rode knop die direct uitlogt

### Web Push Notificaties (iedereen)
- In/uitschakelen van browsermeldingen voor TimeTraq-events
- Vraagt browsertoestemming bij inschakelen

### Desktop Tracker (iedereen)
Verschijnt als de organisatie de tracker heeft geactiveerd:
- Verbindingsstatus tonen
- API-sleutel/token zichtbaar voor koppeling met de desktop app
- Instellingen voor welke activiteiten worden bijgehouden

### Kantooraanwezigheid (iedereen)
Verschijnt als aanwezigheidsregistratie is ingeschakeld:
- Lijst van IP-adressen die als "op kantoor" worden beschouwd
- Eigen aanwezigheidsstatus zichtbaar

### Werkuren & Verlofbeleid (admin only)

**Organisatiestandaarden:**
- Standaard wekelijkse werkuren instellen
- Standaard jaarlijkse verlofdagen instellen

**Profielen:**
- Aanmaken van herbruikbare werkurenprofielen (naam + uren + verlofdagen)
- Bewerken en verwijderen van profielen
- Maximum aantal profielen instelbaar

**Per medewerker aanpassen:**
- Zoekbalk op naam of e-mail
- Selecteer een medewerker → kies modus:
  - Organisatiestandaard
  - Een profiel toewijzen
  - Maatwerk (eigen uren en verlofdagen)
- Opgeslagen instelling per medewerker zichtbaar

**Medewerkers uitnodigen (admin):**
- E-mailadres invoeren → uitnodigingsmail verstuurd
- Uitnodigingslink geeft toegang tot de organisatie

**Kantoor-IP-adressen (admin):**
- Lijst van IP-adressen die het kantoornetwerk representeren
- Aanwezigheid wordt automatisch geregistreerd als gebruiker inlogt vanaf kantoor-IP

**Organisatie aanmaken (eerste keer):**
- Formulier voor organisatienaam
- Beschikbaar als de beheerder nog geen organisatie heeft

---

## 14. AI-assistent (Timy)

Timy is de ingebouwde AI-chatassistent, beschikbaar op elke pagina via een zweefknop.

### Openen en sluiten
- Zweefknop rechtsonder met Timy-avatar/icoon
- Klik om het chatpaneel te openen; opnieuw klikken of kruisje om te sluiten
- Animatie bij openen/sluiten

### Gesprekken
- Timy houdt meerdere gesprekken bij per gebruiker
- Bestaande gesprekken worden geladen (lijst van vorige sessies)
- Nieuw gesprek starten via knop

### Berichten sturen
- Tekstveld onderaan het paneel
- Enter of verzendknop om te sturen
- Laad-indicator terwijl Timy antwoord verwerkt

### Context-suggesties (chips)
- Timy herkent de huidige pagina en biedt relevante snelstartberichten aan
- Bijv. op de timesheets-pagina: "Hoe registreer ik uren?" of "Leg uit hoe voorstellen werken"

### Pending actions
- Timy kan acties voorstellen (bijv. een verlofaanvraag aanmaken)
- Voorstel-banner verschijnt boven het invoerveld
- Gebruiker kan actie bevestigen of afwijzen

### Tips
- Timy toont contextgevoelige tips als er geen actief gesprek is
- Tips worden geladen op basis van de huidige pagina

### AI-configuratie
- Als de AI niet geconfigureerd is op de server, meldt Timy dit transparant

---

## 15. Desktop Tracker

De TimeTraq Desktop Tracker is een aparte desktopapplicatie die koppelt met TimeTraq.

### Verbinden
- Gebruiker genereert een token in instellingen
- Desktop app gebruikt dit token voor authenticatie via API

### Wat het bijhoudt
- Actieve venstertitels en applicatienamen gedurende de werkdag
- Data wordt in bulk gestuurd naar de server

### Gebruik in timesheets
- Venstertitels zijn zichtbaar in het tijdregistratieformulier
- De AI-voorstelfunctie gebruikt tracker-data om tijdregistraties te genereren

### Verbindingsstatus
- Dashboard toont een banner als de tracker nog niet verbonden is
- Instellingenpagina toont de verbindingsstatus

---

## 16. Realtime & Notificaties

### Realtime timesheet updates
- Via WebSockets (Laravel Broadcasting / Pusher/Reverb)
- Als een tijdregistratie verandert op de server (bijv. via desktop tracker), wordt de timesheetpagina automatisch bijgewerkt
- Debounce van 250ms om snel opeenvolgende updates te batchen

### In-app notificaties
- Realtime meldingen via een private WebSocket-kanaal per gebruiker
- Zichtbaar via het klokkicoontje in de header
- Laatste 5 meldingen zichtbaar op het medewerkersdashboard
- Typen van meldingen: weekstatus-herinnering, goedgekeurde/afgewezen verlofaanvragen, teamwijzigingen

### Web Push notificaties
- Opt-in via instellingen (vraagt browsertoestemming)
- Meldingen ook als de browser niet actief open staat

---

## 17. Aanwezigheid (Presence)

### Automatische registratie
- Aanwezigheid wordt automatisch geregistreerd via middleware bij elke paginalading
- Gebaseerd op IP-adres: als het IP overeenkomt met een kantoor-IP, status = "In kantoor"
- Anders: "Niet aanwezig"

### Aanwezigheidsstatussen

| Status | Beschrijving |
|---|---|
| `in_office` | Ingelogd vanaf kantoor-IP |
| `out_of_office` | Ingelogd, maar niet vanaf kantoor |
| `vacation` | Goedgekeurd vakantieverlof actief |
| `sick` | Goedgekeurd ziekteverlof actief |
| `other_leave` | Goedgekeurd overig verlof actief |

### Taakbeschikbaarheid
Medewerkers kunnen zelf aangeven of ze beschikbaar zijn voor nieuwe taken:
- **Vrij voor taken** — blauw indicator
- **Bezig** — grijs indicator
- Toggle beschikbaar op het medewerkersdashboard en via de API

### Aanwezigheidsoverzicht (admin)
Op de teams-pagina onder het tabblad "Medewerkers":
- Kaart per medewerker met kleurgecodeerde aanwezigheidsstatus
- Overzichtsteller bovenaan: X in kantoor, Y niet aanwezig, Z verlof, etc.
- Verlofeinddatum indien van toepassing

### Compact overzicht op admin dashboard
- Samenvatting van de aanwezigheidsstatus van de gehele organisatie als teaser
- Getallen per categorie met link naar het volledige overzicht

---

## Technische opbouw (overzicht)

| Laag | Technologie |
|---|---|
| Backend | Laravel (PHP) |
| Frontend | React + TypeScript via Inertia.js |
| Styling | Tailwind CSS |
| Realtime | Laravel Broadcasting (Pusher/Reverb) |
| AI | OpenAI API (voor voorstellen en weekstatus-drafts) |
| Opslag | Eloquent ORM + relationele database |
| Authenticatie | Laravel Sanctum + Google OAuth |
| Desktop app | Separate tracker-app via REST API |
| Push notifications | Web Push API (VAPID) |
