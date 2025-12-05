import { input, select, confirm, checkbox } from '@inquirer/prompts';
import { logger } from '../utils/logger.js';
import type {
	Framework,
	PackageManager,
	ProjectConfig,
	CliOptions,
	ReactOptions,
	NextOptions,
	AstroOptions,
	ExpressOptions,
	Database,
} from '../types/index.js';

// Validazione del nome progetto
function validateProjectName(name: string): true | string {
	if (!name.trim()) {
		return 'Il nome del progetto non può essere vuoto';
	}

	const validNameRegex = /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/;

	if (!validNameRegex.test(name)) {
		return 'Nome non valido. Usa solo lettere minuscole, numeri e trattini';
	}

	return true;
}

// Prompt per opzioni React
async function promptReactOptions(): Promise<ReactOptions> {
	const choices = [
		{ name: 'Tailwind CSS', value: 'tailwind' },
		{ name: 'React Router', value: 'reactRouter' },
		{ name: 'Zustand (State Management)', value: 'zustand' },
		{ name: 'GitHub Actions (CI/CD)', value: 'githubActions' },
	];

	const selected = await checkbox({
		message: 'Quali funzionalità vuoi aggiungere?',
		choices,
	});

	return {
		tailwind: selected.includes('tailwind'),
		reactRouter: selected.includes('reactRouter'),
		zustand: selected.includes('zustand'),
		githubActions: selected.includes('githubActions'),
	};
}

// Prompt per opzioni Next.js
async function promptNextOptions(): Promise<NextOptions> {
	const choices = [
		{ name: 'Tailwind CSS', value: 'tailwind' },
		{ name: 'Zustand (State Management)', value: 'zustand' },
		{ name: 'GitHub Actions (CI/CD)', value: 'githubActions' },
	];

	const selected = await checkbox({
		message: 'Quali funzionalità vuoi aggiungere?',
		choices,
	});

	return {
		tailwind: selected.includes('tailwind'),
		zustand: selected.includes('zustand'),
		githubActions: selected.includes('githubActions'),
	};
}

// Prompt per opzioni Astro
async function promptAstroOptions(): Promise<AstroOptions> {
	const choices = [
		{ name: 'Tailwind CSS', value: 'tailwind' },
		{ name: 'GitHub Actions (CI/CD)', value: 'githubActions' },
	];

	const selected = await checkbox({
		message: 'Quali funzionalità vuoi aggiungere?',
		choices,
	});

	return {
		tailwind: selected.includes('tailwind'),
		githubActions: selected.includes('githubActions'),
	};
}

// Prompt per opzioni Express
async function promptExpressOptions(): Promise<ExpressOptions> {
	const database = await select<Database>({
		message: 'Quale database vuoi utilizzare?',
		choices: [
			{ value: 'none', name: 'Nessuno (aggiungerò dopo)' },
			{ value: 'mongodb', name: 'MongoDB (con Mongoose)' },
			{ value: 'postgresql', name: 'PostgreSQL (con Prisma)' },
		],
	});

	let authentication = false;
	let swagger = false;
	let docker = false;

	if (database !== 'none') {
		authentication = await confirm({
			message: 'Vuoi aggiungere autenticazione JWT?',
			default: true,
		});

		docker = await confirm({
			message: 'Vuoi aggiungere Docker Compose per il database?',
			default: true,
		});
	}

	swagger = await confirm({
		message: 'Vuoi aggiungere Swagger per la documentazione API?',
		default: true,
	});

	const githubActions = await confirm({
		message: 'Vuoi aggiungere GitHub Actions (CI/CD)?',
		default: false,
	});

	return { database, authentication, swagger, docker, githubActions };
}

export async function promptProjectConfig(
	nomeProgetto: string | undefined,
	options: CliOptions
): Promise<ProjectConfig> {
	let name: string;

	if (nomeProgetto) {
		const validation = validateProjectName(nomeProgetto);
		if (validation !== true) {
			logger.error(validation);
			process.exit(1);
		}
		name = nomeProgetto;
	} else {
		name = await input({
			message: 'Come vuoi chiamare il progetto?',
			validate: validateProjectName,
		});
	}

	const framework =
		options.framework ||
		(await select<Framework>({
			message: 'Quale framework vuoi utilizzare?',
			choices: [
				{ value: 'react', name: 'React + Vite' },
				{ value: 'astro', name: 'Astro' },
				{ value: 'next', name: 'Next.js' },
				{ value: 'express', name: 'Express.js' },
			],
		}));

	const directory = options.directory || `./${name}`;

	// Opzioni specifiche per framework
	let reactOptions: ReactOptions | undefined;
	let nextOptions: NextOptions | undefined;
	let astroOptions: AstroOptions | undefined;
	let expressOptions: ExpressOptions | undefined;

	if (framework === 'react') {
		reactOptions = await promptReactOptions();
	} else if (framework === 'next') {
		nextOptions = await promptNextOptions();
	} else if (framework === 'astro') {
		astroOptions = await promptAstroOptions();
	} else if (framework === 'express') {
		expressOptions = await promptExpressOptions();
	}

	const packageManager = await select<PackageManager>({
		message: 'Quale package manager vuoi utilizzare?',
		choices: [
			{ value: 'npm', name: 'npm' },
			{ value: 'pnpm', name: 'pnpm' },
			{ value: 'yarn', name: 'yarn' },
		],
	});

	const initGit =
		options.git ??
		(await confirm({
			message: 'Vuoi inizializzare un repository Git?',
			default: true,
		}));

	const installDeps =
		options.install ??
		(await confirm({
			message: 'Vuoi installare le dipendenze automaticamente?',
			default: true,
		}));

	return {
		name,
		framework,
		directory,
		packageManager,
		initGit,
		installDeps,
		reactOptions,
		nextOptions,
		astroOptions,
		expressOptions,
	};
}
