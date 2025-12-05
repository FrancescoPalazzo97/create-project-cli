# Piano di Refactoring - Create Project CLI

> **Documento di contesto per il refactoring del codebase**
> Data: 2025-01-26
> Versione: 1.0

---

## 📋 Indice

1. [Panoramica](#panoramica)
2. [Analisi Stato Attuale](#analisi-stato-attuale)
3. [Obiettivi del Refactoring](#obiettivi-del-refactoring)
4. [Opportunità Identificate](#opportunità-identificate)
5. [Piano di Implementazione](#piano-di-implementazione)
6. [Metriche di Successo](#metriche-di-successo)
7. [Rischi e Mitigazioni](#rischi-e-mitigazioni)

---

## 📊 Panoramica

### Contesto

Il progetto **Create Project CLI** è un tool per scaffolding di progetti web che supporta 4 framework:
- React + Vite
- Astro
- Next.js
- Express.js

Dopo un primo refactoring che ha modularizzato i generator in funzioni separate, è emersa l'opportunità di ulteriori miglioramenti per ridurre la duplicazione del codice e migliorare la manutenibilità.

### Stato Attuale Post-Refactoring Iniziale

✅ **Completato:**
- Suddivisione dei generator in funzioni separate
- Pattern consistente tra tutti i generator
- Miglioramento della leggibilità

🔄 **Da Migliorare:**
- Codice duplicato tra generator (~340-500 linee)
- Template strings ripetuti
- Logica condizionale complessa
- Gestione dipendenze non uniforme

---

## 🔍 Analisi Stato Attuale

### Struttura File Generator

```
src/generators/
├── index.ts                    # Router dei generator
├── reactGenerator.ts           # ~400 righe
├── astroGenerator.ts           # ~700 righe
├── nextGenerator.ts            # ~580 righe
├── expressGenerator.ts         # ~800 righe
└── githubActionsGenerator.ts   # ~290 righe
```

### Codice Duplicato Identificato

| Pattern | File Coinvolti | Righe Duplicate | Impatto |
|---------|----------------|-----------------|---------|
| `.gitignore` generation | Tutti i 4 generator | ~100 | Alto |
| Zustand store | React, Next | ~40 | Alto |
| README generation | Tutti i 4 generator | ~200 | Alto |
| `tsconfig.json` | Tutti i 4 generator | ~80 | Medio |
| Tailwind config | React, Next, Astro | ~60 | Medio |
| Package.json logic | Tutti i 4 generator | ~120 | Medio |

**Totale stimato:** ~600 righe di codice duplicato

---

## 🎯 Obiettivi del Refactoring

### Obiettivi Primari

1. **Ridurre Duplicazione:** Eliminare almeno il 70% del codice duplicato
2. **Migliorare Manutenibilità:** Modifiche ai template in un unico posto
3. **Aumentare Consistenza:** Template uniformi tra i vari framework
4. **Facilitare Testing:** Funzioni isolate più facili da testare

### Obiettivi Secondari

5. **Migliorare Leggibilità:** Codice più dichiarativo e meno procedurale
6. **Preparare Scalabilità:** Struttura che faciliti l'aggiunta di nuovi framework
7. **Documentazione:** Template autodocumentanti e chiari

---

## 💡 Opportunità Identificate

### 🔴 PRIORITÀ ALTA

#### 1. Centralizzazione Template `.gitignore`

**Problema:**
Ogni generator ha una versione quasi identica del file `.gitignore` con contenuti ripetitivi.

**Soluzione Proposta:**

```typescript
// src/templates/gitignore.ts
export interface GitignoreOptions {
  includeBuild?: string[];
  includeDependencies?: string[];
  includeFramework?: string[];
}

export function generateGitignore(options: GitignoreOptions = {}): string {
  const {
    includeBuild = ['dist'],
    includeDependencies = ['node_modules'],
    includeFramework = []
  } = options;

  return `# Dependencies
${includeDependencies.join('\n')}

# Build
${includeBuild.join('\n')}

# Environment
.env
.env.local
.env.*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
${includeFramework.length > 0 ? '\n# Framework specific\n' + includeFramework.join('\n') : ''}
`;
}
```

**Utilizzo:**

```typescript
// reactGenerator.ts
import { generateGitignore } from '../templates/gitignore.js';

await writeFile(
  path.join(projectPath, '.gitignore'),
  generateGitignore({
    includeBuild: ['dist', 'dist-ssr']
  })
);

// nextGenerator.ts
await writeFile(
  path.join(projectPath, '.gitignore'),
  generateGitignore({
    includeBuild: ['/.next/', '/out/', '/build'],
    includeDependencies: ['node_modules', '/.pnp', '.pnp.*'],
    includeFramework: ['*.tsbuildinfo', 'next-env.d.ts', '.vercel']
  })
);
```

**Benefici:**
- ✅ Riduzione: ~100 righe duplicate
- ✅ Single source of truth per gitignore
- ✅ Facilita modifiche future
- ✅ Consistenza garantita

**Effort:** 2-3 ore

---

#### 2. Template Condiviso Zustand Store

**Problema:**
Il codice per generare lo Zustand store è identico in `reactGenerator.ts` e `nextGenerator.ts`.

**Posizioni attuali:**
- `reactGenerator.ts`: righe 348-366
- `nextGenerator.ts`: righe 244-261

**Soluzione Proposta:**

```typescript
// src/templates/zustand.ts
export function generateCounterStore(): string {
  return `import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 })
}));
`;
}

// Possibile estensione futura per store personalizzati
export function generateCustomStore(storeName: string, stateInterface: string): string {
  // Template parametrico per store diversi
}
```

**Utilizzo:**

```typescript
// reactGenerator.ts e nextGenerator.ts
import { generateCounterStore } from '../templates/zustand.js';

if (opts.zustand) {
  await writeFile(
    path.join(projectPath, 'src', 'store', 'counterStore.ts'),
    generateCounterStore()
  );
}
```

**Benefici:**
- ✅ Riduzione: ~40 righe duplicate
- ✅ DRY principle applicato
- ✅ Modifiche allo store in un solo posto
- ✅ Estendibile per altri tipi di store

**Effort:** 1 ora

---

#### 3. Sistema Unificato Generazione README

**Problema:**
Ogni generator ha logica quasi identica per generare README con struttura simile ma contenuti leggermente diversi.

**Soluzione Proposta:**

```typescript
// src/templates/readme.ts
import type { PackageManager } from '../types/index.js';

export interface ReadmeSection {
  title: string;
  content: string;
}

export interface ReadmeCommand {
  name: string;
  description: string;
}

export interface ReadmeOptions {
  projectName: string;
  description: string;
  features: string[];
  packageManager: PackageManager;
  commands: ReadmeCommand[];
  sections?: ReadmeSection[];
  additionalContent?: string;
}

export function generateReadme(options: ReadmeOptions): string {
  const {
    projectName,
    description,
    features,
    packageManager,
    commands,
    sections = [],
    additionalContent = ''
  } = options;

  let readme = `# ${projectName}

${description}

## Funzionalità

${features.map(f => `- ${f}`).join('\n')}
`;

  // Sezioni custom (struttura progetto, setup, etc.)
  for (const section of sections) {
    readme += `
## ${section.title}

${section.content}
`;
  }

  // Comandi
  readme += `
## Comandi disponibili

\`\`\`bash
${commands.map(cmd => `# ${cmd.description}\n${packageManager} ${cmd.name}`).join('\n\n')}
\`\`\`
`;

  if (additionalContent) {
    readme += `\n${additionalContent}\n`;
  }

  return readme;
}

// Helper per comandi comuni
export const commonCommands = {
  vite: (pm: PackageManager): ReadmeCommand[] => [
    { name: 'run dev', description: 'Avvia il server di sviluppo' },
    { name: 'run build', description: 'Build per produzione' },
    { name: 'run preview', description: 'Preview della build' },
    { name: 'run lint', description: 'Lint del codice' }
  ],
  next: (pm: PackageManager): ReadmeCommand[] => [
    { name: 'run dev', description: 'Avvia il server di sviluppo' },
    { name: 'run build', description: 'Build per produzione' },
    { name: 'start', description: 'Avvia il server di produzione' },
    { name: 'run lint', description: 'Lint del codice' }
  ],
  astro: (pm: PackageManager): ReadmeCommand[] => [
    { name: 'run dev', description: 'Avvia il server di sviluppo' },
    { name: 'run build', description: 'Build per produzione' },
    { name: 'run preview', description: 'Preview della build' }
  ],
  express: (pm: PackageManager): ReadmeCommand[] => [
    { name: 'run dev', description: 'Sviluppo con hot reload' },
    { name: 'run build', description: 'Build TypeScript' },
    { name: 'start', description: 'Avvia versione compilata' },
    { name: 'run lint', description: 'Lint del codice' }
  ]
};
```

**Utilizzo:**

```typescript
// reactGenerator.ts
import { generateReadme, commonCommands } from '../templates/readme.js';

await writeFile(
  path.join(projectPath, 'README.md'),
  generateReadme({
    projectName: config.name,
    description: 'Progetto React + TypeScript creato con Create Project CLI.',
    features: [
      'React 19',
      'TypeScript',
      'Vite',
      ...(opts.tailwind ? ['Tailwind CSS'] : []),
      ...(opts.reactRouter ? ['React Router'] : []),
      ...(opts.zustand ? ['Zustand'] : []),
      ...(opts.githubActions ? ['GitHub Actions CI/CD'] : [])
    ],
    packageManager: config.packageManager,
    commands: commonCommands.vite(config.packageManager)
  })
);

// nextGenerator.ts con sezioni custom
await writeFile(
  path.join(projectPath, 'README.md'),
  generateReadme({
    projectName: config.name,
    description: 'Progetto Next.js + TypeScript creato con Create Project CLI.',
    features: [
      'Next.js 15',
      'React 19',
      'TypeScript',
      'App Router',
      ...(opts.tailwind ? ['Tailwind CSS'] : []),
      ...(opts.zustand ? ['Zustand'] : []),
      ...(opts.githubActions ? ['GitHub Actions CI/CD'] : [])
    ],
    packageManager: config.packageManager,
    commands: commonCommands.next(config.packageManager),
    sections: [
      {
        title: 'Struttura del progetto',
        content: `\`\`\`
src/
├── app/           # App Router (pages, layouts, routes)
│   ├── layout.tsx # Layout principale
│   ├── page.tsx   # Homepage
│   └── globals.css
├── components/    # Componenti React riutilizzabili
├── lib/           # Utility e funzioni condivise
${opts.zustand ? '├── store/         # Store Zustand\n' : ''}└── types/         # Tipi TypeScript
\`\`\``
      }
    ]
  })
);
```

**Benefici:**
- ✅ Riduzione: ~200 righe duplicate
- ✅ Formato README consistente
- ✅ Facilità di modifica del template
- ✅ Estendibile per nuove sezioni

**Effort:** 3-4 ore

---

### 🟡 PRIORITÀ MEDIA

#### 4. Dependency Manager Pattern

**Problema:**
Ogni generator gestisce le dipendenze con logica simile ma sparsa nel codice.

**Soluzione Proposta:**

```typescript
// src/utils/dependencies.ts
export interface DependencySet {
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
}

export class DependencyManager {
  private deps: Record<string, string> = {};
  private devDeps: Record<string, string> = {};

  add(name: string, version: string): this {
    this.deps[name] = version;
    return this;
  }

  addDev(name: string, version: string): this {
    this.devDeps[name] = version;
    return this;
  }

  addMultiple(deps: Record<string, string>): this {
    Object.assign(this.deps, deps);
    return this;
  }

  addMultipleDev(deps: Record<string, string>): this {
    Object.assign(this.devDeps, deps);
    return this;
  }

  addIf(condition: boolean, name: string, version: string): this {
    if (condition) this.add(name, version);
    return this;
  }

  addDevIf(condition: boolean, name: string, version: string): this {
    if (condition) this.addDev(name, version);
    return this;
  }

  build(): DependencySet {
    return {
      dependencies: { ...this.deps },
      devDependencies: { ...this.devDeps }
    };
  }
}
```

**Utilizzo:**

```typescript
// reactGenerator.ts
import { DependencyManager } from '../utils/dependencies.js';

const deps = new DependencyManager()
  .add('react', '^19.1.0')
  .add('react-dom', '^19.1.0')
  .addDev('@eslint/js', '^9.25.0')
  .addDev('@types/react', '^19.1.2')
  .addDev('typescript', '~5.8.3')
  .addDev('vite', '^6.3.5')
  .addIf(opts.reactRouter, 'react-router-dom', '^7.6.0')
  .addIf(opts.zustand, 'zustand', '^5.0.4')
  .addDevIf(opts.tailwind, 'tailwindcss', '^4.1.6')
  .addDevIf(opts.tailwind, '@tailwindcss/vite', '^4.1.6')
  .build();

const packageJson = {
  name: projectName,
  version: '0.1.0',
  type: 'module',
  scripts: {
    dev: 'vite',
    build: 'tsc -b && vite build',
    lint: 'eslint .',
    preview: 'vite preview'
  },
  ...deps
};
```

**Benefici:**
- ✅ Codice più leggibile e dichiarativo
- ✅ Gestione condizionale chiara
- ✅ Riutilizzabile in tutti i generator
- ✅ Facilita testing delle dipendenze

**Effort:** 2-3 ore

---

#### 5. Template Helper per Tailwind

**Problema:**
La logica condizionale per Tailwind è ripetuta con pattern simili.

**Soluzione Proposta:**

```typescript
// src/templates/tailwind.ts
export type TailwindFramework = 'react' | 'next' | 'astro';

export function generateTailwindImport(framework: TailwindFramework): string {
  switch (framework) {
    case 'react':
    case 'next':
      return '@import "tailwindcss";';
    case 'astro':
      return `@tailwind base;
@tailwind components;
@tailwind utilities;`;
  }
}

export function generateViteConfigWithTailwind(): string {
  return `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`;
}

export function generatePostCSSConfig(): string {
  return `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`;
}

export function generateTailwindConfig(framework: string, contentPaths: string[]): string {
  return `/** @type {import('tailwindcss').Config} */
export default {
  content: ${JSON.stringify(contentPaths, null, 2)},
  theme: {
    extend: {},
  },
  plugins: [],
};
`;
}

// Helper per dependencies Tailwind
export const tailwindDependencies = {
  react: {
    dev: {
      'tailwindcss': '^4.1.6',
      '@tailwindcss/vite': '^4.1.6'
    }
  },
  next: {
    dev: {
      'tailwindcss': '^4.1.6',
      '@tailwindcss/postcss': '^4.1.6'
    }
  },
  astro: {
    prod: {
      '@astrojs/tailwind': '^6.0.2',
      'tailwindcss': '^3.4.17'
    }
  }
};
```

**Benefici:**
- ✅ Riduzione duplicazione pattern Tailwind
- ✅ Gestione centralizzata versioni
- ✅ Facilita aggiornamenti

**Effort:** 2 ore

---

#### 6. Package.json Generation Helper

**Problema:**
Ogni generator ha una funzione `generatePackageJson` con struttura simile.

**Soluzione Proposta:**

```typescript
// src/templates/packageJson.ts
export interface PackageJsonOptions {
  name: string;
  version?: string;
  type?: 'module' | 'commonjs';
  private?: boolean;
  scripts: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export function generatePackageJson(options: PackageJsonOptions): object {
  return {
    name: options.name,
    version: options.version || '0.1.0',
    ...(options.type && { type: options.type }),
    ...(options.private !== undefined && { private: options.private }),
    scripts: options.scripts,
    dependencies: options.dependencies || {},
    devDependencies: options.devDependencies || {}
  };
}

// Scripts comuni
export const commonScripts = {
  vite: {
    dev: 'vite',
    build: 'tsc -b && vite build',
    lint: 'eslint .',
    preview: 'vite preview'
  },
  next: {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
    lint: 'next lint'
  },
  astro: {
    dev: 'astro dev',
    build: 'astro build',
    preview: 'astro preview',
    astro: 'astro'
  },
  express: {
    dev: 'tsx watch src/server.ts',
    build: 'tsc',
    start: 'node dist/server.js',
    lint: 'eslint src/'
  }
};
```

**Benefici:**
- ✅ Consistenza nella struttura
- ✅ Scripts centralizzati
- ✅ Facilita modifiche

**Effort:** 2 ore

---

### 🟢 PRIORITÀ BASSA

#### 7. Directory Structure Helper

**Soluzione Proposta:**

```typescript
// src/utils/directoryStructure.ts
import path from 'node:path';
import { createDirectory } from './fileSystem.js';

export interface DirectoryTree {
  [key: string]: DirectoryTree | null;
}

export async function createDirectoryTree(
  basePath: string,
  tree: DirectoryTree
): Promise<void> {
  for (const [name, subtree] of Object.entries(tree)) {
    const dirPath = path.join(basePath, name);
    await createDirectory(dirPath);

    if (subtree !== null) {
      await createDirectoryTree(dirPath, subtree);
    }
  }
}

// Strutture predefinite
export const directoryStructures = {
  react: (opts: { reactRouter: boolean; zustand: boolean }): DirectoryTree => ({
    src: {
      components: null,
      hooks: null,
      utils: null,
      types: null,
      ...(opts.reactRouter && { pages: null }),
      ...(opts.zustand && { store: null })
    },
    public: null
  }),
  // ... altri framework
};
```

**Benefici:**
- ✅ Più elegante e dichiarativo
- ✅ Facilita visualizzazione struttura

**Effort:** 3 ore

---

## 📅 Piano di Implementazione

### Fase 1: Priorità Alta (1 settimana)

**Settimana 1:**
1. **Giorno 1-2:** Template Gitignore
   - Creare `src/templates/gitignore.ts`
   - Aggiornare tutti i generator
   - Test di integrazione

2. **Giorno 3:** Template Zustand
   - Creare `src/templates/zustand.ts`
   - Aggiornare React e Next generator
   - Test

3. **Giorno 4-5:** Sistema README
   - Creare `src/templates/readme.ts`
   - Aggiornare tutti i generator
   - Test e validazione output

**Deliverable Fase 1:**
- ✅ ~340 righe di codice duplicate eliminate
- ✅ 3 nuovi file template
- ✅ Test passano
- ✅ Build funzionante

### Fase 2: Priorità Media (1 settimana)

**Settimana 2:**
1. **Giorno 1-2:** Dependency Manager
   - Implementare classe DependencyManager
   - Aggiornare generator uno alla volta
   - Test unitari

2. **Giorno 3:** Template Tailwind
   - Centralizzare logica Tailwind
   - Aggiornare generator interessati

3. **Giorno 4-5:** Package.json Helper
   - Implementare helper
   - Refactoring generator
   - Validazione

**Deliverable Fase 2:**
- ✅ Codice più leggibile e manutenibile
- ✅ Pattern consistenti
- ✅ Test coverage aumentato

### Fase 3: Priorità Bassa (Opzionale)

**Da valutare:**
- Directory Structure Helper
- Template Builder avanzato
- Altri miglioramenti identificati

---

## 📊 Metriche di Successo

### Metriche Quantitative

| Metrica | Valore Attuale | Target | Metodo Misurazione |
|---------|----------------|--------|-------------------|
| Righe di codice duplicate | ~600 | <150 | Code analysis tools |
| Numero di template files | 0 | 6-8 | File count |
| Test coverage | N/A | >80% | Jest/Vitest |
| Build time | ~860ms | <1000ms | npm run build |
| Generator file size | 400-800 righe | 200-400 righe | LOC count |

### Metriche Qualitative

- ✅ **Leggibilità:** Codice più dichiarativo e meno procedurale
- ✅ **Manutenibilità:** Modifiche ai template in un solo file
- ✅ **Consistenza:** Output uniforme tra framework
- ✅ **Testabilità:** Funzioni isolate più facili da testare
- ✅ **Documentazione:** Template autodocumentanti

---

## ⚠️ Rischi e Mitigazioni

### Rischio 1: Breaking Changes

**Descrizione:** Il refactoring potrebbe introdurre regressioni nell'output generato.

**Probabilità:** Media
**Impatto:** Alto

**Mitigazione:**
- ✅ Test di confronto output prima/dopo
- ✅ Generare progetti di test per ogni framework
- ✅ Validare manualmente i progetti generati
- ✅ Commit incrementali con rollback facile

### Rischio 2: Complessità Aggiunta

**Descrizione:** L'astrazione potrebbe rendere il codice più complesso invece che semplificarlo.

**Probabilità:** Bassa
**Impatto:** Medio

**Mitigazione:**
- ✅ Mantenere template semplici e leggibili
- ✅ Documentare bene le nuove utility
- ✅ Evitare over-engineering
- ✅ Review del codice tra membri team

### Rischio 3: Effort Sottostimato

**Descrizione:** Il refactoring potrebbe richiedere più tempo del previsto.

**Probabilità:** Media
**Impatto:** Basso

**Mitigazione:**
- ✅ Approccio incrementale per priorità
- ✅ Timeboxing delle attività
- ✅ Focus su priorità alta prima
- ✅ Fase 3 completamente opzionale

---

## 🔄 Processo di Revisione

### Code Review Checklist

- [ ] Template genera output identico a versione precedente
- [ ] Tutti i test passano
- [ ] Build completa senza errori
- [ ] Documentazione aggiornata
- [ ] Nessuna regressione funzionale
- [ ] Codice più leggibile e manutenibile
- [ ] Metriche di successo raggiunte

### Testing Strategy

1. **Unit Tests:** Testare ogni template function isolatamente
2. **Integration Tests:** Generare progetti completi per ogni framework
3. **Regression Tests:** Confrontare output con versione precedente
4. **Manual Testing:** Validare progetti generati manualmente

---

## 📚 Risorse e Riferimenti

### File Principali Coinvolti

- `src/generators/reactGenerator.ts`
- `src/generators/astroGenerator.ts`
- `src/generators/nextGenerator.ts`
- `src/generators/expressGenerator.ts`
- `src/generators/githubActionsGenerator.ts`

### Nuovi File da Creare

```
src/
├── templates/
│   ├── gitignore.ts
│   ├── zustand.ts
│   ├── readme.ts
│   ├── tailwind.ts (opzionale)
│   └── packageJson.ts (opzionale)
└── utils/
    └── dependencies.ts (opzionale)
```

### Documentazione Correlata

- [CLAUDE.md](../CLAUDE.md) - Guida per Claude Code
- [README.md](../README.md) - Documentazione progetto
- Architecture overview (se esiste)

---

## 📝 Note Aggiuntive

### Considerazioni Future

1. **Estensibilità:** La struttura proposta facilita l'aggiunta di nuovi framework
2. **Plugin System:** Possibile evoluzione verso un sistema a plugin per template
3. **Configuration:** Template potrebbero essere configurabili tramite file esterni
4. **CLI Options:** Aggiungere opzioni CLI per personalizzare template

### Best Practices

- Mantenere template semplici e leggibili
- Documentare le funzioni template
- Usare TypeScript per type safety
- Evitare logica complessa nei template
- Preferire composizione a ereditarietà

---

## ✅ Approvazione e Sign-off

**Documento preparato da:** AI Assistant
**Data:** 2025-01-26
**Versione:** 1.0

**Revisioni:**
- [ ] Team Lead
- [ ] Architetto Software
- [ ] Developer

**Stato:** 🟡 In Review

---

**Fine del documento**
