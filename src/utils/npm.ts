import https from 'node:https';

interface NpmPackageInfo {
	'dist-tags': {
		latest: string;
	};
}

// Cache per evitare richieste multiple allo stesso pacchetto
const versionCache = new Map<string, string>();

// Versioni di fallback (aggiornate manualmente periodicamente)
const fallbackVersions: Record<string, string> = {
	// React ecosystem
	react: '^19.1.0',
	'react-dom': '^19.1.0',
	'react-router-dom': '^7.6.0',
	zustand: '^5.0.4',
	'@vitejs/plugin-react': '^4.4.1',
	vite: '^6.3.5',

	// Next.js
	next: '^15.3.2',
	'eslint-config-next': '^15.3.2',

	// Astro
	astro: '^5.7.13',
	'@astrojs/check': '^0.9.4',
	'@astrojs/tailwind': '^6.0.2',

	// Express ecosystem
	express: '^5.1.0',
	cors: '^2.8.5',
	helmet: '^8.1.0',
	dotenv: '^16.5.0',
	zod: '^3.24.4',
	mongoose: '^8.14.1',
	'@prisma/client': '^6.6.0',
	prisma: '^6.6.0',
	bcrypt: '^5.1.1',
	jsonwebtoken: '^9.0.2',
	'swagger-ui-express': '^5.0.1',
	'swagger-jsdoc': '^6.2.8',

	// TypeScript & Linting
	typescript: '^5.8.3',
	'@types/node': '^22.15.21',
	'@types/react': '^19.1.2',
	'@types/react-dom': '^19.1.2',
	'@types/express': '^5.0.2',
	'@types/cors': '^2.8.18',
	'@types/bcrypt': '^5.0.2',
	'@types/jsonwebtoken': '^9.0.9',
	'@types/swagger-ui-express': '^4.1.8',
	'@types/swagger-jsdoc': '^6.0.4',
	eslint: '^9.27.0',
	'@eslint/js': '^9.25.0',
	'eslint-plugin-react-hooks': '^5.2.0',
	'eslint-plugin-react-refresh': '^0.4.19',
	'@typescript-eslint/eslint-plugin': '^8.32.1',
	'@typescript-eslint/parser': '^8.32.1',
	globals: '^16.0.0',
	'typescript-eslint': '^8.30.1',

	// Tailwind
	tailwindcss: '^4.1.6',
	'@tailwindcss/vite': '^4.1.6',
	'@tailwindcss/postcss': '^4.1.6',

	// Dev tools
	tsx: '^4.19.4',
};

// Timeout per le richieste HTTP (3 secondi)
const REQUEST_TIMEOUT = 3000;

export async function getLatestVersion(packageName: string): Promise<string> {
	// Controlla la cache
	if (versionCache.has(packageName)) {
		return versionCache.get(packageName)!;
	}

	return new Promise((resolve) => {
		const url = `https://registry.npmjs.org/${packageName}`;

		const request = https.get(url, (res) => {
			let data = '';

			res.on('data', (chunk) => {
				data += chunk;
			});

			res.on('end', () => {
				try {
					const json: NpmPackageInfo = JSON.parse(data);
					const version = `^${json['dist-tags'].latest}`;
					versionCache.set(packageName, version);
					resolve(version);
				} catch {
					// JSON parsing fallito, usa fallback
					resolve(getFallbackVersion(packageName));
				}
			});
		});

		// Timeout
		request.setTimeout(REQUEST_TIMEOUT, () => {
			request.destroy();
			resolve(getFallbackVersion(packageName));
		});

		// Errore di rete
		request.on('error', () => {
			resolve(getFallbackVersion(packageName));
		});
	});
}

// Restituisce la versione di fallback o 'latest'
function getFallbackVersion(packageName: string): string {
	if (fallbackVersions[packageName]) {
		return fallbackVersions[packageName];
	}
	// Se non abbiamo un fallback hardcoded, usa 'latest'
	return 'latest';
}

// Ottieni più versioni in parallelo
export async function getLatestVersions(packages: string[]): Promise<Record<string, string>> {
	const results: Record<string, string> = {};

	await Promise.all(
		packages.map(async (pkg) => {
			results[pkg] = await getLatestVersion(pkg);
		})
	);

	return results;
}

// Verifica se la rete è disponibile
export async function isNetworkAvailable(): Promise<boolean> {
	return new Promise((resolve) => {
		const request = https.get('https://registry.npmjs.org', (res) => {
			resolve(res.statusCode === 200);
		});

		request.setTimeout(REQUEST_TIMEOUT, () => {
			request.destroy();
			resolve(false);
		});

		request.on('error', () => {
			resolve(false);
		});
	});
}

// Ottieni versioni con indicazione se sono da fallback
export async function getVersionsWithStatus(
	packages: string[]
): Promise<{ versions: Record<string, string>; fromNetwork: boolean }> {
	const networkAvailable = await isNetworkAvailable();

	if (!networkAvailable) {
		// Usa direttamente i fallback senza tentare richieste
		const versions: Record<string, string> = {};
		for (const pkg of packages) {
			versions[pkg] = getFallbackVersion(pkg);
		}
		return { versions, fromNetwork: false };
	}

	const versions = await getLatestVersions(packages);
	return { versions, fromNetwork: true };
}
