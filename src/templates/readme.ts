/**
 * Template centralizzato per la generazione di file README.md
 *
 * Questo modulo fornisce un sistema unificato per generare README
 * consistenti per tutti i framework supportati.
 */

import type { PackageManager } from '../types/index.js';

/**
 * Rappresenta una sezione custom del README
 */
export interface ReadmeSection {
	title: string;
	content: string;
}

/**
 * Rappresenta un comando con la sua descrizione
 */
export interface ReadmeCommand {
	name: string;
	description: string;
}

/**
 * Opzioni per la generazione del README
 */
export interface ReadmeOptions {
	/** Nome del progetto */
	projectName: string;

	/** Descrizione breve del progetto */
	description: string;

	/** Lista delle funzionalità principali */
	features: string[];

	/** Package manager utilizzato */
	packageManager: PackageManager;

	/** Comandi disponibili */
	commands: ReadmeCommand[];

	/** Sezioni custom opzionali (es: struttura progetto, setup specifici) */
	sections?: ReadmeSection[];

	/** Contenuto addizionale da aggiungere alla fine */
	additionalContent?: string;
}

/**
 * Genera il contenuto completo del README.md
 *
 * @param options - Opzioni di configurazione per il README
 * @returns Contenuto del file README.md come stringa
 *
 * @example
 * ```typescript
 * const readme = generateReadme({
 *   projectName: 'my-app',
 *   description: 'Un progetto React moderno',
 *   features: ['React 19', 'TypeScript', 'Vite'],
 *   packageManager: 'npm',
 *   commands: [
 *     { name: 'run dev', description: 'Avvia il server di sviluppo' }
 *   ]
 * });
 * ```
 */
export function generateReadme(options: ReadmeOptions): string {
	const {
		projectName,
		description,
		features,
		packageManager,
		commands,
		sections = [],
		additionalContent = '',
	} = options;

	// Header
	let readme = `# ${projectName}\n\n${description}\n`;

	// Funzionalità
	readme += `\n## Funzionalità\n\n${features.map((f) => `- ${f}`).join('\n')}\n`;

	// Sezioni custom (struttura progetto, setup, etc.)
	for (const section of sections) {
		readme += `\n## ${section.title}\n\n${section.content}\n`;
	}

	// Comandi disponibili
	readme += `\n## Comandi disponibili\n\n\`\`\`bash\n`;
	readme += commands
		.map((cmd) => `# ${cmd.description}\n${packageManager} ${cmd.name}`)
		.join('\n\n');
	readme += '\n```\n';

	// Contenuto addizionale
	if (additionalContent) {
		readme += `\n${additionalContent}\n`;
	}

	return readme;
}

/**
 * Helper per i comandi comuni per ogni framework
 *
 * @example
 * ```typescript
 * const commands = commonCommands.vite('npm');
 * // Restituisce i comandi standard per progetti Vite
 * ```
 */
export const commonCommands = {
	/**
	 * Comandi per progetti Vite (React + Vite)
	 */
	vite: (pm: PackageManager): ReadmeCommand[] => [
		{ name: 'run dev', description: 'Avvia il server di sviluppo' },
		{ name: 'run build', description: 'Build per produzione' },
		{ name: 'run preview', description: 'Preview della build' },
		{ name: 'run lint', description: 'Lint del codice' },
	],

	/**
	 * Comandi per progetti Next.js
	 */
	next: (pm: PackageManager): ReadmeCommand[] => [
		{ name: 'run dev', description: 'Avvia il server di sviluppo' },
		{ name: 'run build', description: 'Build per produzione' },
		{ name: 'start', description: 'Avvia il server di produzione' },
		{ name: 'run lint', description: 'Lint del codice' },
	],

	/**
	 * Comandi per progetti Astro
	 */
	astro: (pm: PackageManager): ReadmeCommand[] => [
		{ name: 'run dev', description: 'Avvia il server di sviluppo' },
		{ name: 'run build', description: 'Build per produzione' },
		{ name: 'run preview', description: 'Preview della build' },
	],

	/**
	 * Comandi per progetti Express
	 */
	express: (pm: PackageManager, includeDatabase: boolean = false): ReadmeCommand[] => {
		const baseCommands = [
			{ name: 'run dev', description: 'Sviluppo con hot reload' },
			{ name: 'run build', description: 'Build TypeScript' },
			{ name: 'start', description: 'Avvia versione compilata' },
			{ name: 'run lint', description: 'Lint del codice' },
		];

		if (includeDatabase) {
			baseCommands.push(
				{ name: 'run db:generate', description: 'Genera Prisma Client (solo PostgreSQL)' },
				{ name: 'run db:push', description: 'Push schema al database (solo PostgreSQL)' },
				{ name: 'run db:migrate', description: 'Esegui migrazioni (solo PostgreSQL)' },
				{ name: 'run db:studio', description: 'Apri Prisma Studio (solo PostgreSQL)' }
			);
		}

		return baseCommands;
	},
};

/**
 * Helper per generare la sezione "Struttura del progetto"
 */
export const projectStructureSections = {
	/**
	 * Struttura per progetti React + Vite
	 */
	react: (opts: { reactRouter: boolean; zustand: boolean }): ReadmeSection => ({
		title: 'Struttura del progetto',
		content: `\`\`\`
src/
├── components/    # Componenti React riutilizzabili
├── hooks/         # Custom React Hooks
├── utils/         # Funzioni utility
├── types/         # Tipi TypeScript
${opts.reactRouter ? '├── pages/         # Pagine (React Router)\n' : ''}${opts.zustand ? '├── store/         # Store Zustand\n' : ''}├── App.tsx        # Componente principale
├── main.tsx       # Entry point
└── index.css      # Stili globali
public/            # File statici
\`\`\`
  `,
	}),

	/**
	 * Struttura per progetti Astro
	 */
	astro: (): ReadmeSection => ({
		title: 'Struttura del progetto',
		content: `\`\`\`
src/
├── components/    # Componenti Astro/React
├── layouts/       # Layout per le pagine
├── pages/         # Pagine (file-based routing)
│   └── index.astro
└── styles/        # Stili globali
public/            # File statici
\`\`\`
`,
	}),

	/**
	 * Struttura per progetti Next.js
	 */
	next: (opts: { zustand: boolean }): ReadmeSection => ({
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
\`\`\`
`,
	}),

	/**
	 * Struttura per progetti Express
	 */
	express: (opts: { database: boolean; auth: boolean }): ReadmeSection => ({
		title: 'Struttura del progetto',
		content: `\`\`\`
src/
├── config/        # Configurazione e variabili d'ambiente
├── controllers/   # Gestori delle richieste
├── middlewares/   # Middleware Express${opts.auth ? ' (incluso auth)' : ''}
├── routes/        # Definizione delle route
├── services/      # Logica di business
${opts.database ? '├── models/        # Model del database\n' : ''}├── types/         # Tipi TypeScript
├── utils/         # Funzioni di utilità
├── app.ts         # Configurazione Express
└── server.ts      # Entry point
${opts.database ? 'prisma/\n└── schema.prisma  # Schema Prisma (solo PostgreSQL)\n' : ''}\`\`\`
`,
	}),
};
