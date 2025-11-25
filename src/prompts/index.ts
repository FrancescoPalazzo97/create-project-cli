import { input, select, confirm } from '@inquirer/prompts';
import { logger } from '../utils/logger.js';
import type { Framework, PackageManager, ProjectConfig, CliOptions } from '../types/index.js';

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
            validate: validateProjectName
        });
    }

    const framework = options.framework || await select<Framework>({
        message: 'Quale framework vuoi utilizzare?',
        choices: [
            { value: 'react', name: 'React + Vite' },
            { value: 'astro', name: 'Astro' },
            { value: 'next', name: 'Next.js' },
            { value: 'express', name: 'Express.js' }
        ]
    });

    const directory = options.directory || `./${name}`;

    const packageManager = await select<PackageManager>({
        message: 'Quale package manager vuoi utilizzare?',
        choices: [
            { value: 'npm', name: 'npm' },
            { value: 'pnpm', name: 'pnpm' },
            { value: 'yarn', name: 'yarn' }
        ]
    });

    const initGit = options.git ?? await confirm({
        message: 'Vuoi inizializzare un repository Git?',
        default: true
    });

    const installDeps = options.install ?? await confirm({
        message: 'Vuoi installare le dipendenze automaticamente?',
        default: true
    });

    return {
        name,
        framework,
        directory,
        packageManager,
        initGit,
        installDeps
    };
}