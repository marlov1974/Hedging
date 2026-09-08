# P0038 — Lokal hybridprototyp i Hedging

Datum: 2026-09-08  
Mottagare: Codex på användarens Mac  
Repository: `marlov1974/Hedging`  
Status: implementeringsuppdrag; ingen implementation ingår i detta dokument.  
Paket-ID: `P0038`.

## 1. Uppdrag och arbetsfördelning

Bygg, kör och demonstrera prototypen **på Macen i det befintliga Hedging-projektet**.
ChatGPT kravställer. Codex implementerar, verifierar och startar lösningen lokalt.

Utveckla det befintliga projektet och återanvänd dess komponentmodell, beräkningar,
databas, rapportfunktioner och UI där de passar. Bygg inte en fristående ersättningsapp.
Den tidigare framtagna HTML-prototypen och Python-experimentet är experiment, inte
kravkällor eller implementationsfacit. Deras förenklade ekonomiska regler ska inte
ärvas utan prövning mot detta paket och repositoryts källmodell.

Användaren ska kunna göra ändringar själv och förstå vad som händer i systemet.
Leveransen får inte bestå av enbart skärmbilder, hårdkodade rapporter eller en
presentation av förberäknade resultat.

## 2. Bootstrap och genomförande

1. Hitta och synkronisera rätt lokala checkout utan att skriva över användarens
   ocommittade arbete. Använd en isolerad arbetsgren vid behov.
2. Följ `README.md`, `AGENTS.md` och hela `memory/bootstrap-manifest.json`.
3. Läs aktuell pakethistorik och `REPOSITORY_FILES.md`.
4. Arbeta enligt detta paket, `requirements/packages/P0038-resource-hybrid-local-prototype.md`.
5. Inspektera relevanta befintliga implementationer och tester innan ombyggnad.
6. Skriv en kort konsistensgranskning under `requirements/package-runs/<ID>/` före kodändringar.
7. Implementera paketet, uppdatera filindex och dokumentation, kör tester och
   verifiera de begärda flödena i den lokala webbläsaren.
8. Starta appen på Macen och lämna användaren en fungerande lokal adress och en
   konkret genomgång. Slutför utan att stanna vid en plan.

Inspekterat startkommando är `npm run hedging:tool`; verifiera det mot aktuell
`package.json`. Behåll fungerande startflöde och dokumentera eventuella ändringar.
Återställ inte databasen vid normal start. Ett separat, tydligt demo-reset får finnas.

Relevanta källor efter ordinarie bootstrap:

- `docs/hedging/component_catalog.md`
- `docs/hedging/canonical_component_model.md`
- `docs/hedging/modern_projected_model.md`
- `docs/hedging/modern_projection_base_peak_rules.md`
- `docs/hedging/classic_projection_peak_offpeak_rules.md`
- `docs/hedging/classic_projection_price_rules.md`
- `docs/hedging/position_report.md`
- `docs/hedging/financial_settlement.md`
- `docs/market-derivation/q_factor_model.md`
- motsvarande kod under `src/database/`, `src/hedging/`, `src/settlement/` och deras tester.

## 3. Beslutad gemensam modell

Följande är styrande krav, inte alternativa arkitekturförslag:

**K-01. Gemensam händelse- och journalmodell.** B2C och B2B använder samma kärna.
Produktkomponenter och avtalsregler styr skillnaderna. B2C fastpris kräver inte
att kunden kan byta erbjudande.

**K-02. Kundben på resursnivå.** Prognos, kundvillkor, affärsbidrag och ekonomisk
attribution är spårbara per resurs. Marknadsbenet aggregeras per kompatibelt
portfölj-/leveransområde. Rådgivaren fattar ett samlat avropsbeslut.

**K-03. En grundmodell.** Avrop bokförs i grundmodellen. Modern och Classic är
härledda presentationer av samma kundaffärer och samma avräkning. Växling av vy
ska aldrig skapa affärer, ändra villkor eller skriva om lagrad ekonomi.

**K-04. Tre skilda begrepp.** Håll isär kundens fysiska leveransvolym, finansiella
prisdimensioner såsom Sys/EPAD och marknadens säkringsekvivalenter. Summera inte
Sys och EPAD som dubbla fysiska volymer. Allokeringskomponenter är inte extra energi.

**K-05. Händelsen anger riskorsaken.** En volymändring kan orsaka både bas- och
profilhandel; båda hänförs då till volymhändelsen. En q-ändring hänförs till
profilrisk även om handeln sker i baseload. Riskbärare är ett separat begrepp från
den resurs som historiken tillhör.

**K-06. Historik bevaras.** Ursprungliga affärer ändras eller tas inte bort för att
stänga en position. Skapa motaffärer. Avslutad resurs får noll framtida prognos och
döljs i normal aktiv resursvy, men behåller affärer och resultat i ekonomiska totaler.

**K-07. Fullt marknadsåtagande.** Marknadsmotparten accepterar hela åtagandet.
Likviditetsbegränsade delavslut får inte portioneras tillbaka till kundresurser.
Teknisk väntan/fel kan visas separat från det fulla affärsåtagandet.

**K-08. Intern matchning.** Kompatibla ökningar och minskningar matchas före extern
nettoorder. Båda resursernas poster bevaras och använder samma överföringspris.
Period, område, valuta och instrumentekvivalens måste stämma. Olika riskorsaker får
inte försvinna vid nettning. Den exakta prisreferensen ska dokumenteras som demoregel.

**K-09. Resurs utan POD är möjlig.** Inga obligatoriska POD-relationer får byggas
in i den gemensamma kärnan. En framtida återförsäljarresurs kan använda en identifierad
aggregatserie och profil. Extern import av sådana serier ingår inte i detta paket.

## 4. Demodata

Skapa reproducerbar, neutral seeddata. Inga verkliga kunder, interna produktnamn,
företagsuppgifter, verkliga priser eller bifogade strategitexter får kopieras in.

### 4.1 B2B-kund

En kund med en rådgivarportfölj och exakt tio aktiva resurser i huvudscenariot.
Resurserna ska ha olika månadsprognoser, lastprofiler och profilparametrar.
Minst två resursgrupper ska kunna visas, exempelvis två anläggningar.
Resurser och residualer ska vara disjunkta volymdelar.

Följande tabell är en **syntetisk acceptansfixture**, inte kommersiella standardvärden.
Här avser w hela månadsvolymens baseloadmultiplikator. Mappa den inte blint till
äldre komponenters q-faktorer med andra beräkningsbaser.

| Resurs | Månadsprognos MWh | w |
|---|---:|---:|
| R01 Process A | 180 | 1,20 |
| R02 Process B | 140 | 1,14 |
| R03 Ventilation | 45 | 1,23 |
| R04 Värme | 90 | 1,18 |
| R05 Kyla | 65 | 1,21 |
| R06 Laddning | 35 | 1,05 |
| R07 Belysning | 25 | 1,25 |
| R08 Lager | 50 | 1,08 |
| R09 Kontor | 40 | 1,26 |
| R10 Residual | 80 | 1,09 |
| **Totalt** | **750** | beräkna resursvis |

Använd minst tre leveransmånader för att visa periodavgränsning. Tabellen gäller
en av dem. Ge övriga månader egna prognoser. En ändring i en vald månad ska inte
skriva om de andra månaderna. Använd befintlig kalenderfunktion och dokumentera
dess tidszon, peakdefinition, helgdagar och timbas. Tidsstämplar ska lagras i UTC;
marknadskalenderns lokala tidszon är en separat, versionsbestämd parameter.

### 4.2 B2C

Ett försäljningsfönster och minst två syntetiska fastpriskontrakt med resurser:
ett normalt leveransförlopp och ett förlopp med ånger/avslut. Separata grenar ska
kunna återställas eller återspelas utan att ändra historiska fakta.

Tillhandahåll syntetiska mätvärden och prisserier för avräkning, inklusive ett
förlopp där verklig volym och profil avviker från prognosen. Märk prognos, simulerat
utfall och avräknat utfall tydligt. Skapa inte actual genom att kopiera prognosen.

## 5. B2C:s eventhantering

**B-01.** Användaren ska kunna utlösa och följa:

| Händelse | Vad som ska bli synligt |
|---|---|
| Försäljningsprognos/fönster etableras | Förkontraktuellt hedgebehov och separat fönsterekonomi |
| Erbjudande skapas/accepteras | Kommersiellt åtagande och versionerade regler för när exponering uppstår |
| Avtal signeras | Kundvillkor, resurskoppling och eventuell övergång från fönster |
| Kredit-/migreringskontroll godkänns eller fallerar | Förändrad relevant osäkerhet eller avslut enligt demoregel |
| Ångerfrist löper ut eller ånger registreras | Reservändring respektive motaffärsbehov |
| Leverans startar | Aktiv leveransstatus och återstående risker |
| Prognos ändras | Ny volymexponering och hänförliga säkringsdeltan |
| Q-/w-faktor ändras | Ny profilriskexponering och hänförliga säkringsdeltan |
| Avtal avslutas | Noll framtida prognos, motaffärer och bevarat resultat |

**B-02.** Visa före, förändring och efter för bruttovolym, osäkerhetsreserv,
nettoexponering, basbehov, profilbehov, innehav och ny order. Visa vilken regel och
parameter som gav effekten. Separata riskorsaker ska kunna särskiljas även om de
beräknas av samma funktion.

**B-03.** Förkontraktssäkring tillhör fönstret, inte påhittade kundkontrakt. Övergången
till verkligt kontrakt ska atomiskt minska relevant förväntad fönstervolym och öka
resursens exponering. Dokumentera om överföringen avser brutto eller förväntad volym.
Samma exponering får inte samtidigt räknas i båda. Befintlig fönstervinst/-förlust
ska inte skrivas om till kundens historiska ekonomi.

**B-04.** Fastpriset och avtalad q-term ska inte ändras av en intern omhedgning.
Skilj pris från belopp: ändrad faktisk leverans kan ändra kundens fakturabelopp
enligt fastprisavtalet även när enhetspriset ligger fast.

**B-05.** Saknas exakta sannolikhets-/reservregler i repositoryt får Codex välja
enkla konfigurerbara syntetiska demovärden, märka dem som sådana och dokumentera
deras sammansättning. Multiplicera inte flera redan överlappande riskreserver.
Otillåtna statusövergångar ska avvisas utan delvis bokföring.

## 6. Rådgivarens avrop

**A-01.** Rådgivaren väljer kunden, leveransperioden och omfattningen, ser total
prognos samt befintlig position och gör **ett** avrop. Kundval filtrerar resursval.
Huvudflödet omfattar samtliga tio resurser; tio manuella avrop uppfyller inte kravet.

**A-02.** Visa en förhandsgranskning av resursbidragen: prognosversion, avropsvolym,
profil-/q-version, baspris, q-term, andra tillämpliga komponenter, kundbelopp och
marknadsbehov. Vid bekräftelse ska dessa underlag låsas. En inaktuell förhandsgranskning
ska upptäckas och räknas om eller avvisas före bokföring.

**A-03.** Samma avrops-ID ska länka rådgivarbeslutet, de tio resursberäkningarna,
kundtransaktionerna, journalposterna och marknadsåtagandet. Utfallet ska summera
från resurserna; ersätt inte individuella parametrar med ett ovägt portföljmedel.

**A-04.** Affärens mängder, priser och versioner ska vara oförändrade vid senare
prognos-/parameterändring. Nya avrop använder det nya giltiga underlaget.
Visa om en procent avser ytterligare prognosandel eller en målposition; välj och
dokumentera en entydig semantik och hantera redan avropad volym därefter.

**A-05.** Stöd ytterligare avrop och en explicit motaffär/återföring av ett avrop
utan att ta bort originalet. Tekniska återföringar och avtalsenliga kundaffärer
ska skiljas från rena interna riskåtgärder.

## 7. Rapporter i Modern och Classic

Varje rapport ska ha eget perspektivval. Valet får inte byta kund, period eller
underliggande dataset. Använd de befintliga definitionerna:

- **Classic:** Peak/Offpeak, där Peak är kundens hela peaknivå.
- **Modern:** Base över hela månaden på offpeaknivån, plus extra Peak-lager.
- **Grundmodell:** lagrade komponenter, inte `modern.*` eller `classic.*` som nya affärer.

### R-01. Transaktionslista

Visa datum, avrops-ID, period, resurs eller summerad kundnivå, lager, MWh,
enhetspris, belopp, status och möjlighet att öppna underlaget. Köp, motaffärer och
korrigeringar ska behålla sina tecken och länkar. Intern q-omhedgning ska inte synas
som en ny kundaffär. Visa q-term som inkluderad eller separat enligt komponentregeln,
aldrig både inkluderad och pålagd igen.

### R-02. Positionsrapport

Visa prognos, kundposition, tillämplig säkringsgrad, kvarvarande exponering och
ekonomiskt värde per period och lager. Skilj kundposition från marknadsposition och
fastprisleveransskyldighet från ett fast finansiellt volymavrop. Om nettopositionen
är noll men restvärdet inte är noll ska restvärdet fortfarande visas.

### R-03. Avräkningsrapport

Använd faktiska/syntetiska utfallsserier och den aktuella avtalade komponentbaserade
avräkningsregeln. Visa faktisk energi, referenspriser, hedgeavräkning, tillämpliga
pris-/riskkomponenter, kundbelopp och korrigeringar. Skilj förhandsberäkning från
fastställd demoavräkning. En reviderad mätserie ska ge spårbar ny version eller
korrigeringsdifferens, inte en tyst överskrivning av fastställda belopp.

### R-04. Matematisk likhet

För samma kund, period, komponentomfattning och rapportversion ska båda vyerna ge
samma totala fysiska MWh, avtalsvärde och kundavräkning. Bevara både mängd och värde
över delaffärer och negativa positioner. Vid noll nämnare ska pris vara tomt/ej
definierat; ett restbelopp får inte försvinna eller omvandlas till ett oändligt pris.

Värdebevarande vid affärstillfället räcker inte som bevis för korrekt avräkning:
även utfallsindex och deras timbas måste transformeras så att samma kassaflöde fås.

## 8. Kundben, marknadsben och journal

**L-01. Kundben.** Visa resursens prognos/version, tjänstekomponenter, kundvillkor,
ursprungliga och återförda affärer, kundposition samt kundens ekonomiska konsekvens.
Man ska kunna jämföra före/efter en vald händelse utan att ändra aktuell bokföring.

**L-02. Marknadsben.** Visa totalbehov, innehav, väntande åtaganden, nettodelta,
interna matchningar och marknadsorder. Visa bas och extra profilbidrag separat
även när de exekveras med samma instrument. En order ska gå att borra ned till
orsakande händelser och resursbidrag.

**L-03. Händelsekedja.** Klick på en händelse visar dess ursprung, korrelations-ID,
beräkningsunderlag, journalposter, ändrade positioner och resulterande order.
Skilj användarkommando, konstaterad affärshändelse och begärd marknadsåtgärd.

**L-04. Journal.** Minsta spårbarhet: event-ID, korrelation/orsak, resurs, kontrakt
eller fönster, portfölj, leveransperiod, riskorsak, riskbärare, komponent, enhet,
volym/belopp, pris och relevanta versionsreferenser. Motposter ska balansera per
relevant bok/enhet/valuta. MWh ska inte balanseras mot EUR eller MW utan timbas.

**L-05. Beständighet.** Omstart av lokal app ska bevara affärer och historik.
Dubbelklick/återsändning av samma kommando får inte dubblera bokföring eller order.
Samma ID med annat innehåll ska avvisas. Fel ska vara atomiska. Väntande åtaganden
ska ingå när nytt nettobehov räknas. Återuppspelning ska återskapa samma ekonomiska
tillstånd från sparade fakta utan nya marknadsanrop.

## 9. Q-/w-faktor och q-term

**Q-01. Begrepp.** UI och modell ska skilja dimensionslös faktor från påslag i
valuta/MWh. Varje faktor ska ange sin beräkningsbas: totalvolym, peakvolym eller
annan definierad komponentbas. Användarens w=1,2 avser 20 % extra baseload på hela
månadsvolymen. En enda sådan faktor bestämmer inte entydigt kundens peakandel.
Bevara därför den profil-/allokeringsinformation som projektionen faktiskt behöver.

**Q-02. Säkringsbehov.** För den totalvolymbaserade varianten:

```
basbehov = säkringsgrund V
extra profilbehov = (w − 1) × V
totalt baseloadekvivalent behov = w × V
```

V är den volym som tjänsten skyddar enligt avtalet, inte automatiskt all fysisk
prognos för varje B2B-produkt. För en given komponent kan V vara avropad referensvolym;
för fastpris kan den vara riskjusterad förväntad leverans. Bestäm per komponent.

**Q-03. Ändring.** Användaren väljer resurs, period och ny faktor. Visa gammalt/nytt
värde, version, kundvillkor, säkringsbehov och beräknat handelsdelta före bekräftelse.
Efter bekräftelse ska en orsakskedja motsvarande följande kunna följas:

```
parameter uppdaterad → profilriskbehov ändrat → nettobehov beräknat
→ intern matchning och/eller marknadsåtagande → position/journal uppdaterad
```

Exakta eventnamn anpassas till befintlig kod. Kundens redan avtalade q-term och gamla
affärsversioner får inte skrivas om. Om deltat är noll ska ingen onödig order skapas.

**Q-04. Q-term vid avrop.** Påslaget härleds från den prissatta profiltjänsten.
För den enkla testvarianten med en hedge och inget annat påslag gäller
`q-term = (w − 1) × hedgepris`. Vid flera komponenter/priser ska deras verkliga
prissatta bidrag användas; ett ovägt genomsnitt duger inte.

## 10. Avräkning och risk: regler som inte får förloras

Detta paket ska återanvända och komplettera avtalets avräkning, inte ersätta den
med en generell formel från HTML-experimentet. Profilskydd och volymskydd är olika
tjänster. Profilskydd utan volymskydd får inte implicit ge obegränsat volymskydd.
Om volymtolerans används ska den beräknas på avtalad aggregeringsnivå, normalt
månadsvis på kontrakt/portfölj, inte automatiskt separat på de tio resurserna.

För interna riskrapporter är den beslutade principen:

```
delta volymriskutfall = totalt volymriskutfall − fakturerad V-term i pengar
delta profilriskutfall = totalt profilriskutfall − fakturerad q-term i pengar
```

Fakturerat belopp avser samma period/omfattning och ska inkludera krediteringar.
Subtrahera inte enhetspriset direkt från ett penningbelopp. Bruttoutfallet får
inte redan innehålla samma premieintäkt som sedan dras av igen.

Kontrollerat profilriskexempel vid oförändrad månadsvolym och en baseloadreferens:

```
V = 100 MWh, w = 1,2, hedgepris F = 50 EUR/MWh
extra hedge = 20 MWh, avtalad q-term = 10 EUR/MWh
utfallets baseloadspot S = 80 EUR/MWh
faktisk profilerad energikostnad = 9 600 EUR
profilkostnad mot flat referens = 9 600 − 100 × 80 = 1 600 EUR
profilehedgens payoff = 20 × (80 − 50) = 600 EUR
totalt profilriskutfall, kostnadstecken = 1 600 − 600 = 1 000 EUR
fakturerad q-term = 100 × 10 = 1 000 EUR
delta profilriskutfall = 0 EUR
```

Detta exempel gäller inte automatiskt när även volymen ändras. För samtidiga
volym-/profiländringar måste referens, samverkanseffekt och hedgeattribution
fördelas en gång. Händelseorsakad förändring i total marginal får inte utan vidare
kallas totalt volymriskutfall. Fullständig ny riskresultatpanel är inte en separat
leverans i detta paket; rapporter som faktiskt visar dessa mått måste följa reglerna.

## 11. Konsistensfrågor som Codex måste hantera före berörd kod

Skriv i paketets `design.md` hur följande förenas med befintlig kod:

1. Ny resursbaserad kundjournal och äldre kanoniska komponenter/MW-lagring.
2. En månadsprognos med versionsbestämt profilunderlag och behovet av peakallokering
   i äldre projektioner. Två oberoende forecast-sanningar får inte skapas.
3. Den nya q-tjänstens prissatta bidrag och de äldre Modern/Classic-prisformlerna.
   Visa ett räknebevis för både affärsvärde och avräkning. Att lägga hela q-kostnaden
   i ett Peak-lager är inte beslutat bara för att HTML-experimentet gjorde det.
4. Vilken volym-/profiltjänst huvudscenariot använder och dess avräkningsfunktion.
   Gör inte månadsvis volymtolerans och fast andel till samma produkt av bekvämlighet.
5. Försäljningsfönstrets övergång och risktillhörighet utan dubbelräkning.

Tekniska val och tydligt märkta syntetiska demoparametrar får Codex lösa själv.
Om ett olöst val ändrar kundens rättigheter, pris eller avräkningsbelopp ska Codex
redovisa ett konkret räkneexempel och ställa den avgränsade verksamhetsfrågan. Fortsätt
under tiden med övriga delar. Göm inte ett sådant val som ett implementationsantagande.

## 12. Acceptanstester

| ID | Förlopp | Godkänt när |
|---|---|---|
| T01 | Ett 50 %-avrop på fixturemånadens tio resurser | Ett avrops-ID, tio resursbidrag, 375 MWh fysisk kundvolym |
| T02 | Totalvolymbaserad profilsäkring för T01 | Extra profilbehov 62,7 MWh; totalt 437,7 MWh ekvivalenter, räknat resursvis |
| T03 | Kombinerat syntetiskt hedgepris 50 i T02, inga övriga påslag | Basbelopp 18 750 EUR + q-belopp 3 135 EUR = 21 885 EUR; q räknas en gång |
| T04 | R01 w 1,20 → 1,30 efter accepterat 50 %-avrop | Bas 90 MWh oförändrad, profilbehov 18 → 27 MWh, nytt netto +9; inga ändrade kundaffärer |
| T05 | Nytt avrop efter T04 | Nya villkor/versioner på nya affären; gamla affären kvar med sin ursprungliga version |
| T06 | Faktor minskar eller motsatta resursbehov uppstår | Motaffärer och kompatibel intern matchning; båda sidor och deras värden består |
| T07 | B2C normalt förlopp | Synliga status-/reserv-/behovseffekter med spårbara regler och oförändrat avtalat enhetspris |
| T08 | Fönster → kontrakt | Samma förväntade exponering lämnar fönstret och tillkommer resursen; historiskt resultat bevaras |
| T09 | B2C avslut | Framtida prognos noll; affärer och restresultat kvar; normal aktiv vy döljer resursen |
| T10 | Modern ↔ Classic i alla tre rapporterna | Samma omfattning, total MWh, värde och avräknat kundbelopp; ingen mutation |
| T11 | Noll/negativt lager eller nettoposition noll med restvärde | Inga oändliga priser eller förlorade belopp; negativa giltiga lager bevaras |
| T12 | Marknadsacceptans och upprepad nettning | Full acceptans, inga delallokeringar till kunder, väntande order räknas en gång |
| T13 | Dubbelklick, återförsök, ogiltig övergång, inaktuell förhandsgranskning | Ingen dubbel eller partiell bokföring; begripligt fel eller ny förhandsgranskning |
| T14 | Omstart och återuppspelning | Samma fakta, positioner, belopp och länkar utan nya externa sidoeffekter |
| T15 | Ändring i en av tre månader | Övriga månader och historiska villkor oförändrade |
| T16 | Utfallsdata och korrigerad serie | Avtalsenlig avräkning; revidering kan spåras och totalsummor avstämmas i båda vyerna |
| T17 | Genomgång i webbläsaren på Macen | Alla begärda användarflöden går att utföra; inga döda knappar eller hårdkodade resultat |

T01–T03 gäller den explicit definierade testvarianten. Om befintlig komponentmodell
har fler kostnader ska dessa redovisas separat, inte användas för att ändra facit.
Testerna ska innehålla oberoende räkneexempel, inte enbart jämföra två funktioner
som använder samma beräkningskod. Verifiera befintliga rapporter mot regression.

## 13. Leverans och demonstration

Leverera i befintligt repository:

- Implementerad lokal app med alla sex efterfrågade områden.
- Reproducerbar seed och möjlighet att starta om ett demo uttryckligen.
- Beständiga händelser/affärer, rapporter och spårbarhet.
- Paketets design, konsistensgranskning, testresultat och en kort körinstruktion.
- Uppdaterat `REPOSITORY_FILES.md` och relevanta källdokument.

Avsluta med en **faktiskt genomförd** demonstration på Macen:
rådgivaravrop → resursbidrag → marknadsåtagande → Modern/Classic-rapporter →
q-ändring och oförändrade kundvillkor → B2C-förlopp → avräkning.

Rapportera lokal adress, exakt startkommando, vad som har verifierats, kvarstående
verksamhetsfrågor och eventuella materiella begränsningar. Kräv inte publik hosting,
externa marknadsanslutningar eller molninfrastruktur för denna leverans.
