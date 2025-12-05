/**
 * Template centralizzato per la generazione di file .gitignore
 *
 * Questo modulo fornisce una funzione per generare file .gitignore
 * personalizzati in base alle esigenze di ogni framework.
 */

export interface GitignoreOptions {
	/** Directory di build da ignorare (es: ['dist', '.next']) */
	buildDirs?: string[];

	/** File e directory di dipendenze (es: ['node_modules', '.pnp']) */
	dependencies?: string[];

	/** File e directory specifici del framework */
	frameworkSpecific?: string[];

	/** File di environment aggiuntivi oltre ai comuni */
	additionalEnvFiles?: string[];
}

/**
 * Genera il contenuto del file .gitignore
 *
 * @param options - Opzioni di configurazione per personalizzare il gitignore
 * @returns Contenuto del file .gitignore come stringa
 *
 * @example
 * ```typescript
 * // Per React/Vite
 * const gitignore = generateGitignore({
 *   buildDirs: ['dist', 'dist-ssr']
 * });
 *
 * // Per Next.js
 * const gitignore = generateGitignore({
 *   buildDirs: ['/.next/', '/out/', '/build'],
 *   dependencies: ['node_modules', '/.pnp', '.pnp.*', '.yarn/*'],
 *   frameworkSpecific: ['*.tsbuildinfo', 'next-env.d.ts', '.vercel']
 * });
 * ```
 */
export function generateGitignore(options: GitignoreOptions = {}): string {
	const {
		buildDirs = ['dist'],
		dependencies = ['node_modules'],
		frameworkSpecific = [],
		additionalEnvFiles = [],
	} = options;

	// Costruisce le sezioni del gitignore
	const sections: string[] = [];

	// Sezione Dependencies
	if (dependencies.length > 0) {
		sections.push(`# Dependencies\n${dependencies.join('\n')}`);
	}

	// Sezione Build
	if (buildDirs.length > 0) {
		sections.push(`# Build\n${buildDirs.join('\n')}`);
	}

	// Sezione Environment
	const envFiles = ['.env', '.env.local', '.env.*.local', ...additionalEnvFiles];
	sections.push(`# Environment\n${envFiles.join('\n')}`);

	// Sezione Editor
	sections.push(`# Editor
.vscode/*
!.vscode/extensions.json
.idea`);

	// Sezione Logs
	sections.push(`# Logs
*.log
npm-debug.log*`);

	// Sezione OS
	sections.push(`# OS
.DS_Store`);

	// Sezione Framework Specific (se presente)
	if (frameworkSpecific.length > 0) {
		sections.push(`# Framework specific\n${frameworkSpecific.join('\n')}`);
	}

	// Unisce tutte le sezioni con doppio newline
	return sections.join('\n\n') + '\n';
}

/**
 * Preset predefiniti per i framework supportati
 */
export const gitignorePresets = {
	/**
	 * Preset per progetti React + Vite
	 */
	react: (): string =>
		generateGitignore({
			buildDirs: ['dist', 'dist-ssr'],
			dependencies: ['node_modules'],
		}),

	/**
	 * Preset per progetti Astro
	 */
	astro: (): string =>
		generateGitignore({
			buildDirs: ['dist/', '.astro/'],
			dependencies: ['node_modules/'],
			additionalEnvFiles: ['.env.production'],
		}),

	/**
	 * Preset per progetti Next.js
	 */
	next: (): string =>
		generateGitignore({
			buildDirs: ['/.next/', '/out/', '/build'],
			dependencies: ['node_modules', '/.pnp', '.pnp.*', '.yarn/*'],
			frameworkSpecific: ['*.tsbuildinfo', 'next-env.d.ts', '.vercel'],
			additionalEnvFiles: ['.env.development.local', '.env.test.local', '.env.production.local'],
		}),

	/**
	 * Preset per progetti Express
	 */
	express: (): string =>
		generateGitignore({
			buildDirs: ['dist/', 'build/'],
			dependencies: ['node_modules/'],
			additionalEnvFiles: ['.env.development', '.env.production', '.env.test'],
		}),
};
