# PRONA — demo istituzionale

Dimostrazione navigabile di una piattaforma nazionale per la tutela dell'acquirente
di immobili venduti sulla carta: conti vincolati (escrow), verifica dell'avanzamento
lavori da parte di un ingegnere indipendente, registrazione dei contratti, portale
del cittadino.

**Non è un prodotto in produzione.** È una demo con dati fittizi, pensata per essere
proiettata in una riunione. Funziona completamente offline: nessuna chiave API,
nessun servizio esterno.

---

## Avviare la demo

Aprire il Terminale, entrare nella cartella del progetto e lanciare:

```bash
npm run demo
```

Il comando installa tutto, prepara il database, lo popola con i dati e avvia
l'applicazione. Al termine compare una riga tipo `Local: http://localhost:3100`.

Aprire nel browser: **http://localhost:3100**

Per fermare la demo: tornare al Terminale e premere `Ctrl` + `C`.

## Rimettere i dati come all'inizio

Dopo aver provato la demo (o dopo che qualcuno ci ha messo le mani), per tornare
alla situazione di partenza:

```bash
npm run reset
```

Si può lanciare **anche mentre la demo è aperta**: basta ricaricare la pagina del
browser subito dopo. Non serve chiudere nulla.

## Modalità kiosk (prima della riunione)

Azzera i dati e riavvia l'applicazione in un colpo solo:

```bash
npm run kiosk
```

Da usare come ultimo comando prima di entrare in sala.

## Azzerare senza toccare il Terminale

In basso a destra, in ogni schermata, c'è **«Rivendos demonstrimin»**. Due clic —
uno per aprire, uno per confermare — e i dati tornano com'erano. Serve se qualcosa
va storto a metà presentazione: non deve chiudere né riavviare niente.

## Il copione della presentazione

Il file **DEMO.md**, in questa stessa cartella, contiene il copione completo:
cosa cliccare, in che ordine, cosa dire a ogni passaggio, con i tempi per stare nei
venti minuti e le indicazioni su cosa tagliare se resta poco tempo.

---

## Come si usa

In alto a destra ci sono due menu a tendina:

- **Gjuha / Lingua** — albanese (predefinito), inglese, italiano
- **Roli / Ruolo** — cambia il punto di vista: Cittadino, Sviluppatore,
  Certificatore, Banca, Agenzia PRONA

Cambiando ruolo cambiano immediatamente il menu e le schermate disponibili.
Non serve nessuna password: è voluto, è una demo.

### Chi vede cosa

Il sistema non mostra tutto a tutti. È voluto, ed è uno dei punti da far notare
in riunione:

| | Avanzamento e foto | Conti del progetto | Ordini di svincolo | Fascicolo tecnico | Ispezioni |
|---|---|---|---|---|---|
| Cittadino | sì | solo i propri soldi | no | no | no |
| Sviluppatore | sì | sì (suoi progetti) | sì | sì | no |
| Certificatore | sì | **no** | no | sì | no |
| Banca | sì | sì | sì | no | no |
| Agenzia PRONA | sì | sì | sì | sì | sì |

L'Agenzia ha in più il **Registro delle attività**: ogni azione del sistema — chi,
cosa, quando — filtrabile per ruolo. Le azioni fatte durante la demo ci finiscono
in tempo reale.

Dove un dato è nascosto, al suo posto compare la ragione. Il caso più forte è il
certificatore: non vede nessun importo, perché la verifica tecnica non deve essere
influenzata da quanto denaro dipende dalla sua firma.

### Foto delle verifiche e allegati

Le foto di cantiere sono **generate dal programma stesso**, senza scaricare nulla:
la stessa verifica mostra sempre la stessa foto, con data, coordinate GPS, codice
del progetto e impronta digitale impressi sull'immagine. Non sono fotografie reali:
servono a mostrare come si presenta la prova di un sopralluogo.

Nelle schermate dello sviluppatore, del certificatore e dell'Agenzia si possono
caricare documenti veri (permessi, relazioni, prove di laboratorio) fino a 8 MB.
Restano nel database della demo e spariscono con `npm run reset`.

---

## Se qualcosa non funziona

**«command not found: npm»**
Node.js non è installato o non è nel percorso. Installare Node.js versione 20 o
superiore da nodejs.org e riprovare.

**«Port 3100 is already in use»**
Un'altra copia della demo è già aperta. Chiudere l'altra finestra del Terminale,
oppure aprire direttamente http://localhost:3100 — probabilmente sta già girando.

**La pagina è bianca o mostra un errore rosso**
Fermare con `Ctrl` + `C`, poi:

```bash
npm run kiosk
```

**I dati sembrano sbagliati o mancanti**

```bash
npm run reset
```

e ricaricare la pagina del browser.

**Ultima spiaggia: rimettere tutto a nuovo**

```bash
npm run reset:hard
```

Cancella fisicamente il database e lo ricostruisce da zero.

---

## Nota tecnica

Next.js + TypeScript + Tailwind CSS, database SQLite locale gestito con Prisma.
I dati stanno nel file `prisma/dev.db`. Il file `prisma/seed.ts` contiene tutti i
dati della demo (sviluppatori, progetti, unità, contratti, pagamenti): è il posto
dove intervenire se servono nomi o cifre diversi.
