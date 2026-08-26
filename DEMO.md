# PRONA — copione della dimostrazione

Venti minuti, cinque scenari, cinque ruoli. Ogni riga dice **cosa cliccare** e
**cosa dire**. I tempi sono cumulativi: se a metà è in ritardo, il paragrafo
«Se resta poco tempo» in fondo dice cosa tagliare.

---

## Cinque minuti prima di entrare in sala

Nel Terminale, dalla cartella del progetto:

```bash
npm run kiosk
```

Azzera i dati e avvia l'applicazione. Poi apra **http://localhost:3100** nel
browser, a schermo intero (`F11` su Windows, `Ctrl`+`Cmd`+`F` su Mac).

Controlli tre cose prima di cominciare:

1. In alto a destra il ruolo è **Agjencia PRONA** e la lingua è **SQ**.
2. La home mostra 8 progetti e i quattro riquadri con le cifre.
3. La barra in basso mostra «Mjedis demonstrimi — të dhëna fiktive».

**Se qualcuno ha già toccato qualcosa**, in basso a destra c'è
«Rivendos demonstrimin»: due clic e i dati tornano com'erano, senza chiudere nulla.

**Come si cambia ruolo.** Non ci sono più i pulsanti dei ruoli in alto: il
sistema si presenta come un vero accesso. Clicchi sul nome in alto a destra
(es. «Arta Ndreu — Cittadino») → **Cambia ruolo**. Si apre una schermata di
accesso: scelga la scheda del ruolo, l'account dalla lista (la password non
serve, va bene qualunque cosa) e clicchi **Accedi**. Da quel momento in poi,
ogni «Ruolo → X» in questo copione significa questo percorso. Per cambiare
solo l'account **restando nello stesso ruolo** (es. da un cittadino all'altro)
basta il menu del nome in alto a destra, senza passare dalla schermata di accesso.

---

## 0:00 — Apertura (1 minuto e mezzo)

**Schermata:** home, ruolo Agjencia PRONA.

> «Questo è il registro pubblico dei progetti immobiliari. Otto progetti, quattro
> città. Per ognuno: un codice pubblico, una percentuale di avanzamento e una
> cifra di fondi ancora bloccati.»

Indichi la frase in alto:

> «Tutto il sistema serve a dimostrare una cosa sola: **i soldi dell'acquirente si
> sbloccano solo quando il cantiere avanza davvero, e chiunque può verificarlo.**»

Indichi la riga **Shkodra Green Park**, stato «I ndalur»:

> «Questo cantiere è fermo. Ci torniamo fra un quarto d'ora — è il caso che oggi
> in Albania non ha soluzione.»

---

## 1:30 — Scenario 1A: la catena parte (4 minuti)

**Ruolo → Zhvillues** (Sviluppatore). Clicchi **Zona e zhvilluesit**.

> «Sono un'impresa di costruzioni. Ho due progetti a registro.»

Clicchi **Regjistro projekt të ri**. I campi sono già compilati.

> «Registro un progetto nuovo: nome, comune, permesso di costruire, quindici unità,
> superficie media, prezzo al metro quadro, banca depositaria. Posso allegare il
> permesso e il cronoprogramma.»

Clicchi **Paraqit për regjistrim**.

**Questo è il primo punto da far vedere bene.** Indichi il pulsante grigio
«Vër në shitje» e la frase accanto:

> «Il progetto esiste, ma **non posso venderlo**. Il pulsante è spento e il sistema
> mi dice perché: non è registrato e il conto vincolato non è attivo. Sopra, i
> cinque controlli di conformità: licenza attiva, permesso depositato, elenco unità,
> conto aperto, cronoprogramma valido.»

Clicchi **Paraqit për regjistrim** (il pulsante scuro in fondo).

> «Ora il progetto ha un codice pubblico — **PRONA-DR-2026-0007** — e il conto
> vincolato è attivo, con il suo IBAN. **Solo adesso** posso vendere.»

Nel riquadro «Regjistrim i shitjes» clicchi **Regjistro kontratën**.

> «Vendo l'unità A-1-1 a Endrit Kola. Il contratto va in registrazione catastale e
> l'unità passa da libera a impegnata.»

Nel riquadro accanto clicchi **Regjistro pagesë**.

> «L'acquirente versa l'acconto: 21.475 euro. Non arrivano a me — arrivano sul
> conto vincolato, e il sistema li abbina da solo all'unità. Guardi in fondo alla
> tabella: accanto ad A-1-1 ora c'è la cifra versata.»

---

## 5:30 — Scenario 1B: il cantiere avanza (4 minuti)

**Ruolo → Certifikues.**

> «Cambio persona. Sono un ingegnere indipendente. Ho tre verifiche assegnate — e
> qui c'è la seconda cosa importante: **le ho ricevute dal sistema.** Il costruttore
> non sceglie chi gli controlla il cantiere.»

Apra **Tirana Riverside · Çatia** con **Hap verifikimin**.

> «Questa è l'app che uso in cantiere.»

Spunti i quattro punti della lista di controllo, uno alla volta.

Clicchi **Bëj foto** tre volte.

> «Tre foto. Guardi cosa c'è impresso sopra: **data e ora di adesso, coordinate GPS
> diverse per ogni scatto, codice del progetto, numero d'albo mio, impronta digitale
> del file.** Non è una foto che si può rifare in ufficio.»

Scenda in fondo e clicchi **Nënshkruaj dhe dërgo**.

> «Firmo. La firma lega il mio nome e il mio numero d'albo a questa verifica.»

**Ruolo → Agjencia PRONA.** La pagina si apre sulla vigilanza.

> «Sono l'Agenzia. Mi è arrivata la richiesta di svincolo: 194.816 euro, fase
> copertura, firmata dall'ingegner Basha, porta l'avanzamento al 60%.»

Clicchi **Autorizo shlyerjen**.

> «Autorizzo.»

**Ruolo → Bankë depozitare.**

> «Sono la banca. Ho l'ordine autorizzato. La banca non decide: esegue quello che
> l'Agenzia ha autorizzato sulla base di una verifica firmata.»

Clicchi **Ekzekuto shlyerjen**.

> «Fatto. I fondi passano al costruttore. Tre persone diverse, tre passaggi, e
> nessuno dei tre può fare da solo il lavoro degli altri.»

---

## 9:30 — Scenario 1C: il cittadino (2 minuti)

**Ruolo → Qytetar.** Clicchi **Dosja ime**.

> «Adesso sono la signora Arta Ndreu, che ha comprato l'appartamento A-1-1.»

Indichi, in quest'ordine:

> «Il mio appartamento, il progetto, il costruttore, il riferimento catastale, e un
> codice di verifica che lega la mia pratica al registro pubblico.»

> «**Sessanta per cento certificato**, verificato tre minuti fa dall'ingegner Basha.
> E qui sotto ci sono le sue foto: le stesse che ha scattato in cantiere.»

> «I miei soldi: ho versato 58.240 euro. Di questi, **34.944 sono andati al
> costruttore** perché il cantiere è arrivato al 60%. **23.296 sono ancora bloccati
> in banca.** Se il cantiere si ferma domani, quei soldi non si muovono.»

> «E in fondo: il piano dei pagamenti, con le rate già versate e quelle che
> scatteranno solo alle prossime certificazioni. Più i miei documenti.»

---

## 11:30 — Scenario 2: il sistema dice no (1 minuto e mezzo)

**Ruolo → Zhvillues.** Apra il progetto **Rezidenca Adriatik Park**.

> «Torno a essere il costruttore. Provo a rivendere la stessa unità A-1-1 a una
> seconda persona. È la truffa più comune: lo stesso appartamento venduto due volte.»

Clicchi **Regjistro kontratën** senza cambiare nulla.

Faccia una pausa. Lasci leggere il riquadro rosso.

> «Il sistema rifiuta. E non dice solo "no": mi mostra **il contratto che già esiste**,
> il nome dell'acquirente, la data della firma e il riferimento catastale. La doppia
> vendita non è più una questione di buona fede: è tecnicamente impossibile.»

---

## 13:00 — Scenario 3: incassare prima di registrare (30 secondi)

> «Stessa logica sui soldi: se provo a incassare un acconto su un progetto non
> ancora registrato, il sistema blocca e mi dice la conseguenza giuridica —
> **ogni somma incassata prima della registrazione è nulla e torna all'acquirente.**»

*(Se il tempo stringe, questo scenario si può solo raccontare: è gemello del
precedente.)*

---

## 13:30 — Scenario 4: il cantiere fermo (2 minuti e mezzo)

**Ruolo → Agjencia PRONA → Mbikëqyrja.** Scenda a «Kantiere në vëzhgim» e clicchi
**Dosja e kantierit** su **Shkodra Green Park**.

> «Torniamo al cantiere fermo di Scutari. Nessuna attività da febbraio. Nove
> famiglie hanno comprato. Avanzamento fermo al 25%.»

> «**269.550 euro sono ancora sul conto vincolato.** Nel sistema di oggi quei soldi
> sarebbero già stati incassati dal costruttore e le dieci famiglie farebbero causa.»

Clicchi **Ngrij shlyerjet**.

> «Un clic. Gli svincoli sono congelati: da questo conto non esce più niente, e le
> richieste già in corsa si fermano.»

Indichi la tabella. Sono visibili solo le prime cinque righe: clicchi **Mostra altri**
per aprire l'elenco completo.

> «E questa è la risposta che oggi nessuno sa dare a un acquirente: **nome per nome,
> quanto ha versato e quanto gli tornerebbe.** Agron Zeka ha versato 62.040 euro,
> gliene tornano 46.530. E così per tutti e dieci. La somma chiude esattamente sul
> residuo, nella riga di totale sempre visibile in fondo alla tabella.»

---

## 16:00 — Scenario 5: chi controlla i controllori (2 minuti e mezzo)

Torni a **Mbikëqyrja**. Nella tabella «Verifikime të certifikuara», la prima riga è
**Tirana Riverside · Çatia** — la verifica firmata dieci minuti fa davanti a loro.
Clicchi **Rikontrollo**.

> «L'obiezione che sento sempre: e se l'ingegnere che certifica è d'accordo con il
> costruttore? Ecco la risposta.»

> «L'Agenzia rifà a campione una verifica già certificata. A sinistra la verifica
> originale: chi l'ha firmata, quando, le sue foto, e il suo tasso di difformità
> attuale.»

Spunti un punto qualsiasi della lista — il secondo va bene.

**Non clicchi ancora.** Indichi il riquadro rosso che è appena comparso.

> «Prima ancora di registrare, il sistema mi dice cosa succederà: il certificatore
> viene **sospeso dal registro**, le sue **cinque verifiche aperte** passano a un
> altro ingegnere, la fase viene revocata, e il suo tasso di difformità sale da
> **1,4 a 1,9 per cento**. Nel suo fascicolo pubblico.»

Clicchi **Regjistro rikontrollin**.

> «Fatto. Lo Stato non controlla solo i cantieri: **controlla i controllori.** E chi
> firma sa che il suo nome ha un numero attaccato, visibile a tutti.»

---

## 18:30 — Chiusura (1 minuto e mezzo)

Clicchi **Regjistri i veprimeve**.

> «Ogni cosa che abbiamo fatto in questi venti minuti è qui: chi, cosa, quando. Il
> registro non si cancella e non si modifica. Può filtrare per ruolo.»

Clicchi il filtro **Certifikues**.

> «Tutto quello che hanno fatto gli ingegneri verificatori. Poi la banca. Poi
> l'Agenzia.»

Cambi lingua su **EN**, poi su **IT**.

> «Il sistema è in albanese, inglese e italiano.»

Chiusura, tornando alla home:

> «Riassumo. Il costruttore non può vendere prima di essere registrato. Non può
> vendere due volte. Non può incassare fuori dal conto vincolato. Non sceglie chi lo
> verifica. E prende i soldi solo quando un ingegnere indipendente ha certificato di
> persona che il cantiere è arrivato dove dice. L'acquirente vede tutto quello che lo
> riguarda. Lo Stato vede tutto, e risponde di quello che vede.»

---

## Chi vede cosa — se glielo chiedono

Vale la pena mostrarlo: mette in evidenza che il sistema non è una vetrina.

Con ruolo **Certifikues**, apra un progetto qualsiasi. Dove ci sarebbe il conto
vincolato compare la spiegazione:

> «Il certificatore **non vede nessun importo.** Da nessuna parte. La verifica
> tecnica non deve essere influenzata da quanto denaro dipende dalla sua firma.»

Con ruolo **Qytetar**, sullo stesso progetto: l'acquirente vede l'avanzamento e le
foto, non i conti del costruttore né gli altri acquirenti.

---

## Il portale pubblico — se c'è tempo o se lo chiedono

Oltre ai cinque scenari, PRONA è anche un portale territoriale pubblico, in stile
dubailand.gov.ae. Non fa parte del copione cronometrato, ma vale la pena aprirlo se
la sala chiede «e per un cittadino qualunque, senza pratiche in corso?».

Dal menu in alto: **Shërbime** è il catalogo di tutti i servizi, pubblici e per
ruolo. **Kërko** filtra per comune, zona, tipologia, prezzo e mette in evidenza il
filtro più importante — solo progetti con conto vincolato attivo. **Zonat** mostra
statistiche e un indice di prezzo per zona urbana su otto trimestri. Da lì si
possono selezionare fino a tre progetti e aprire **Krahaso** per un confronto
fianco a fianco.

Le mappe sono vere mappe navigabili — non immagini fisse: si trascinano, e cliccando
un segnaposto si apre il link al progetto. Restano offline: le tile OpenStreetMap
sono scaricate una volta sola in fase di preparazione, Leaflet è incluso nel
pacchetto, a runtime non parte nessuna richiesta di rete.

Nella galleria di un progetto, la prima immagine è un render a colori generato
localmente — non una foto vera, ma in stile rendering immobiliare — seguito dagli
elaborati tecnici monocromatici (prospetto, planimetria, sezione, inquadramento).

In fondo a ogni pagina, **Si funksionon PRONA** spiega il meccanismo in cinque passi
per un pubblico non tecnico, e **Baza ligjore** presenta la cornice normativa
illustrativa su cui si basa la demo. Dal registro pubblico dei progetti si può
scaricare l'intero elenco in CSV — dati aperti, non solo consultazione a schermo.

Infine, il ciclo si chiude davvero: quando un progetto è dorëzuar (consegnato), il
costruttore può segnare la consegna delle chiavi unità per unità, e la pratica del
cittadino mostra un certificato di consegna con codice di verifica.

**Nota sugli elenchi lunghi:** ogni tabella o elenco con più di cinque righe mostra
solo le prime cinque; il resto si apre con un clic su «Mostra altri». Vale anche
per il registro attività e per la tabella degli acquirenti dello Scenario 4.

---

## Se resta poco tempo

Tagli in quest'ordine:

1. **Scenario 3** (30 secondi) — si racconta a parole.
2. **La chiusura sul registro attività** (1 minuto) — si mostra solo se chiedono
   della tracciabilità.
3. **Scenario 1A**, la parte di registrazione del progetto nuovo (2 minuti) — si può
   partire da un progetto già registrato e cominciare dalla vendita.

**Non tagli mai** lo Scenario 4 e lo Scenario 5: sono i due che rispondono alle
domande che i funzionari hanno davvero in testa.

---

## Domande probabili, risposte brevi

**«E se il costruttore fallisce?»**
I fondi non ancora svincolati sono sul conto vincolato, non nel patrimonio
dell'impresa. La tabella dello Scenario 4 mostra esattamente quanto torna a ciascuno.

**«Chi paga il certificatore?»**
Nella demo il punto è un altro: chi lo *sceglie*. Lo assegna il sistema, non
l'impresa. Il modello di remunerazione è una decisione politica, non tecnica.

**«Quanto rallenta il mercato?»**
Nulla è aggiunto al percorso: permesso, catasto e banca esistono già. Cambia che
diventano condizioni verificate invece di adempimenti dichiarati.

**«La fase è revocata: la percentuale del progetto torna indietro?»**
No, resta ferma finché un altro ingegnere non rifà la verifica. Il punto è un altro:
i soldi di quella fase erano già usciti. Ed è esattamente il motivo per cui la
ripetizione a campione deve esistere — e per cui il certificatore ne risponde
personalmente.

**«È un vero prodotto?»**
No, e va detto. È una dimostrazione funzionante costruita per mostrare il
meccanismo. I dati sono inventati, l'impianto è reale.
