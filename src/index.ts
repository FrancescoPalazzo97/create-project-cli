import { Command } from 'commander';
import { promptProjectConfig } from './prompts/index.js';
import { generateProject } from './generators/index.js';
import {
    logger,
    directoryExists,
    isDirectoryEmpty,
    initGit,
    installDependencies,
    ASCII_BANNER
} from './utils/index.js';
import type { CliOptions } from './types/index.js';

const program = new Command();

program
    .name('create-project')
    .description('CLI per scaffolding di progetti React, Astro, Next.js e Express')
    .version('0.1.0');

program
    .command('create')
    .description('Crea un nuovo progetto')
    .argument('[nome-progetto]', 'Nome del progetto da creare')
    .option('-f, --framework <framework>', 'Framework da utilizzare (react, astro, next, express)')
    .option('-d, --directory <directory>', 'Directory di destinazione')
    .option('--no-git', 'Non inizializzare un repository Git')
    .option('--no-install', 'Non installare le dipendenze automaticamente')
    .action(async (nomeProgetto: string | undefined, options: CliOptions) => {
        try {
            // Banner iniziale
            logger.banner(ASCII_BANNER);

            const config = await promptProjectConfig(nomeProgetto, options);

            // Verifica se la directory esiste già
            if (await directoryExists(config.directory)) {
                if (!(await isDirectoryEmpty(config.directory))) {
                    logger.error(`La directory "${config.directory}" esiste già e non è vuota`);
                    process.exit(1);
                }
            }

            logger.newLine();
            logger.divider();
            logger.info(`Creazione progetto ${config.framework.toUpperCase()}...`);
            logger.divider();
            logger.newLine();

            // 1. Genera il progetto
            await generateProject(config);

            // 2. Installa le dipendenze (se richiesto)
            if (config.installDeps) {
                logger.newLine();
                await installDependencies(config.directory, config.packageManager);
            }

            // 3. Inizializza Git (se richiesto)
            if (config.initGit) {
                logger.newLine();
                await initGit(config.directory);
            }

            // Messaggio finale
            logger.celebrate('✨ Progetto creato con successo! ✨');

            // Box con istruzioni
            const instructions = [
                `cd ${config.directory}`,
                ...(config.installDeps ? [] : [`${config.packageManager} install`]),
                `${config.packageManager} run dev`
            ].join('\n');

            logger.box(instructions, '🎯 Prossimi passi');

        } catch (error) {
            if (error instanceof Error && error.name === 'ExitPromptError') {
                logger.newLine();
                logger.warn('Operazione annullata');
                process.exit(0);
            }
            throw error;
        }
    });

program.parse();