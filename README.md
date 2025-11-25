# Create Project CLI

> CLI per scaffolding rapido di progetti React, Astro, Next.js e Express con TypeScript

## Descrizione

**Create Project CLI** è uno strumento da riga di comando che permette di creare rapidamente nuovi progetti web con configurazioni pre-impostate e best practices integrate. Supporta i framework più popolari con setup TypeScript, linting, e strutture di progetto ottimizzate.

## Caratteristiche

- 🚀 **Scaffolding veloce** - Crea progetti completi in pochi secondi
- 🎯 **4 Framework supportati** - React, Astro, Next.js, Express
- 📦 **Package manager flessibile** - Scegli tra npm, yarn o pnpm
- ⚙️ **TypeScript integrato** - Tutti i progetti sono configurati con TypeScript
- 🎨 **Prompts interattivi** - Interfaccia user-friendly con validazione
- 🔧 **Git ready** - Inizializzazione automatica del repository
- 📝 **Template completi** - Codice di esempio e strutture best-practice

## Installazione

```bash
# Installazione globale
npm install -g create-project-cli

# Oppure usa direttamente con npx
npx create-project-cli create my-app
```

## Utilizzo

### Modalità Interattiva

```bash
create-project create
```

Il CLI ti guiderà attraverso una serie di domande:
- Nome del progetto
- Framework da utilizzare (React, Astro, Next.js, Express)
- Funzionalità aggiuntive specifiche per framework:
  - **React**: Tailwind CSS, React Router, Zustand
  - **Next.js**: Tailwind CSS, Zustand
  - **Astro**: Tailwind CSS
  - **Express**: Nessuna opzione aggiuntiva al momento
- Package manager (npm, yarn, pnpm)
- Inizializzare repository Git
- Installare le dipendenze automaticamente

### Modalità con Opzioni

```bash
# Crea un progetto React con nome specifico
create-project create my-react-app

# Specifica il framework
create-project create my-app --framework react

# Directory personalizzata
create-project create my-app --directory ./projects/my-app

# Salta l'inizializzazione Git
create-project create my-app --no-git

# Salta l'installazione delle dipendenze
create-project create my-app --no-install

# Combinazione di opzioni
create-project create my-app --framework next --no-git
```

### Opzioni Disponibili

| Opzione | Alias | Descrizione |
|---------|-------|-------------|
| `--framework <framework>` | `-f` | Framework da utilizzare (`react`, `astro`, `next`, `express`) |
| `--directory <directory>` | `-d` | Directory di destinazione |
| `--no-git` | | Non inizializzare un repository Git |
| `--no-install` | | Non installare le dipendenze automaticamente |

## Framework Supportati

### React + Vite

Setup completo con:
- React 19 + TypeScript
- Vite per build veloce e HMR
- ESLint con plugin React
- Struttura cartelle organizzata (`components/`, `hooks/`, `utils/`, `types/`)
- CSS di base con stili moderni

**Opzioni aggiuntive:**
- **Tailwind CSS**: Configurazione completa con PostCSS e file di configurazione
- **React Router**: Routing client-side con setup di esempio
- **Zustand**: State management leggero e moderno

**Comandi disponibili:**
```bash
npm run dev      # Server di sviluppo
npm run build    # Build per produzione
npm run preview  # Preview della build
npm run lint     # Lint del codice
```

### Astro

Setup completo con:
- Astro 5 + TypeScript
- Layouts e componenti di esempio
- File-based routing
- Path aliases configurati (`@components/*`, `@layouts/*`, `@styles/*`)
- Stili globali e CSS-scoped

**Opzioni aggiuntive:**
- **Tailwind CSS**: Integrazione Astro con configurazione ottimizzata

**Comandi disponibili:**
```bash
npm run dev      # Server di sviluppo
npm run build    # Build per produzione
npm run preview  # Preview della build
```

### Next.js

Setup completo con:
- Next.js 15 + TypeScript
- App Router (non Pages Router)
- React 19 + React Server Components
- CSS Modules + stili globali
- Dark mode ready
- Path aliases configurati (`@/*`)

**Opzioni aggiuntive:**
- **Tailwind CSS**: Configurazione Next.js ottimizzata con supporto App Router
- **Zustand**: State management con supporto Server Components

**Comandi disponibili:**
```bash
npm run dev      # Server di sviluppo
npm run build    # Build per produzione
npm start        # Server di produzione
npm run lint     # Lint del codice
```

### Express.js

Setup completo con:
- Express 5 + TypeScript
- Architettura MVC (controllers, routes, middlewares, services)
- Validazione ambiente con Zod
- Gestione errori centralizzata
- CORS e Helmet per sicurezza
- Hot reload con tsx watch

**Struttura progetto:**
```
src/
├── config/        # Configurazione e variabili d'ambiente
├── controllers/   # Gestori delle richieste
├── middlewares/   # Middleware Express
├── routes/        # Definizione delle route
├── services/      # Logica di business
├── types/         # Tipi TypeScript
├── utils/         # Funzioni di utilità
├── app.ts         # Configurazione Express
└── server.ts      # Entry point
```

**Comandi disponibili:**
```bash
npm run dev      # Sviluppo con hot reload
npm run build    # Build TypeScript
npm start        # Avvia versione compilata
npm run lint     # Lint del codice
```

## Validazione Nome Progetto

Il CLI valida il nome del progetto secondo le convenzioni npm:
- Solo lettere minuscole, numeri, trattini
- Supporta scoped packages (`@scope/package-name`)
- Non può essere vuoto o contenere spazi
- Regex: `/^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/`

## Architettura del Progetto

### Flusso di Esecuzione

1. **Entry Point** ([src/index.ts](src/index.ts))
   - Parsing degli argomenti CLI con Commander.js
   - Gestione comando `create`
   - Orchestrazione delle fasi di creazione

2. **Prompts Interattivi** ([src/prompts/index.ts](src/prompts/index.ts))
   - Raccolta input utente con @inquirer/prompts
   - Validazione del nome progetto
   - Merge opzioni CLI con prompts interattivi

3. **Generazione Progetto** ([src/generators/](src/generators/))
   - Router che seleziona il generator appropriato
   - Ogni generator segue pattern a 5 fasi:
     1. Creazione struttura cartelle
     2. Generazione package.json
     3. Generazione file di configurazione
     4. Generazione file sorgente
     5. Generazione README

4. **Post-Processing**
   - Installazione dipendenze (opzionale)
   - Inizializzazione Git (opzionale)

### Utilità Principali

**File System** ([src/utils/fileSystem.ts](src/utils/fileSystem.ts))
- Creazione directory ricorsive
- Scrittura file con creazione directory parent automatica
- Verifica esistenza e stato directory
- Scrittura JSON formattata

**Shell** ([src/utils/shell.ts](src/utils/shell.ts))
- Esecuzione comandi Git
- Installazione dipendenze con package manager
- Spinner progress con ora
- Gestione errori comandi shell

**Logger** ([src/utils/logger.ts](src/utils/logger.ts))
- Output colorato con chalk
- Indicatori di progresso (`[1/5]`, `[2/5]`, ...)
- Icone per successo (✔), errori (✖), warning (⚠), info (ℹ)

## Sviluppo

### Prerequisiti

- Node.js 18+
- npm/yarn/pnpm

### Setup Locale

```bash
# Clona il repository
git clone <repository-url>
cd create-project-cli

# Installa le dipendenze
npm install

# Build del progetto
npm run build

# Sviluppo con watch mode
npm run dev
```

### Testing Locale

```bash
# Dopo il build, testa il CLI
npm start

# Oppure usa il binary direttamente
node dist/index.js create test-project

# Oppure installa globalmente in modalità link
npm link
create-project create test-project
```

### Struttura Codebase

```
src/
├── generators/          # Generator per ogni framework
│   ├── index.ts        # Router dei generator
│   ├── reactGenerator.ts
│   ├── astroGenerator.ts
│   ├── nextGenerator.ts
│   └── expressGenerator.ts
├── prompts/
│   └── index.ts        # Prompts interattivi
├── types/
│   └── index.ts        # Type definitions
├── utils/
│   ├── fileSystem.ts   # Operazioni file system
│   ├── shell.ts        # Comandi shell
│   ├── logger.ts       # Logging colorato
│   └── index.ts        # Re-exports
└── index.ts            # Entry point CLI
```

### Aggiungere un Nuovo Framework

1. Crea un nuovo generator in [src/generators/](src/generators/)
```typescript
// src/generators/vueGenerator.ts
import type { ProjectConfig } from '../types/index.js';

export async function generateVueProject(config: ProjectConfig): Promise<void> {
    logger.step(1, 5, 'Creazione struttura cartelle...');
    // ... implementazione
}
```

2. Aggiorna il tipo Framework in [src/types/index.ts](src/types/index.ts)
```typescript
export type Framework = 'react' | 'astro' | 'next' | 'express' | 'vue';
```

3. Aggiungi il case nello switch in [src/generators/index.ts](src/generators/index.ts)
```typescript
case 'vue':
    await generateVueProject(config);
    break;
```

4. Aggiungi l'opzione nei prompts in [src/prompts/index.ts](src/prompts/index.ts)
```typescript
choices: [
    // ... existing choices
    { value: 'vue', name: 'Vue + Vite' }
]
```

## Build e Distribuzione

Il progetto usa [tsup](https://tsup.egoist.dev/) per il bundling:

```bash
# Build per produzione
npm run build
```

Configurazione in [tsup.config.ts](tsup.config.ts):
- Output: ESM format
- Shebang automatico per esecuzione CLI
- Type declarations generate
- Clean build directory

## Tecnologie Utilizzate

- **TypeScript** - Type safety e developer experience
- **Commander.js** - Parsing argomenti CLI
- **@inquirer/prompts** - Prompts interattivi
- **chalk** - Output colorato nel terminale
- **ora** - Spinner per operazioni lunghe
- **execa** - Esecuzione comandi shell cross-platform
- **tsup** - Bundling TypeScript veloce

## License

MIT

## Autore

Francesco

---

Per maggiori informazioni sulla struttura interna del progetto, consulta [CLAUDE.md](CLAUDE.md).
