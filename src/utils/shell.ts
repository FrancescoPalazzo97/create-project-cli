import { execa } from 'execa';
import ora from 'ora';
import type { PackageManager } from '../types/index.js';

// Inizializza un repository Git
export async function initGit(directory: string): Promise<boolean> {
	const spinner = ora('Inizializzazione repository Git...').start();

	try {
		await execa('git', ['init'], { cwd: directory });
		await execa('git', ['add', '.'], { cwd: directory });
		await execa('git', ['commit', '-m', 'Initial commit'], { cwd: directory });

		spinner.succeed('Repository Git inizializzato');
		return true;
	} catch {
		spinner.fail('Impossibile inizializzare Git (è installato?)');
		return false;
	}
}

// Installa le dipendenze
export async function installDependencies(
	directory: string,
	packageManager: PackageManager
): Promise<boolean> {
	const spinner = ora(`Installazione dipendenze con ${packageManager}...`).start();

	try {
		await execa(packageManager, ['install'], { cwd: directory });

		spinner.succeed('Dipendenze installate');
		return true;
	} catch {
		spinner.fail(`Impossibile installare le dipendenze con ${packageManager}`);
		return false;
	}
}

// Verifica se un comando è disponibile nel sistema
export async function commandExists(command: string): Promise<boolean> {
	try {
		await execa('which', [command]);
		return true;
	} catch {
		return false;
	}
}
