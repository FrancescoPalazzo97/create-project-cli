import { Command } from 'commander';
import { promptProjectConfig } from './prompts/index.js';
import { generateProject } from './generators/index.js';
import {
    logger,
    directoryExists,
    isDirectoryEmpty,
    initGit,
    installDependencies
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
            logger.title('🚀 Create Project CLI');

            const config = await promptProjectConfig(nomeProgetto, options);

            // Verifica se la directory esiste già
            if (await directoryExists(config.directory)) {
                if (!(await isDirectoryEmpty(config.directory))) {
                    logger.error(`La directory "${config.directory}" esiste già e non è vuota`);
                    process.exit(1);
                }
            }

            logger.newLine();
            logger.info(`Creazione progetto ${config.framework.toUpperCase()}...`);
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
            logger.newLine();
            logger.success('Progetto creato con successo!');
            logger.newLine();

            // Istruzioni finali
            logger.log('Prossimi passi:');
            logger.newLine();
            logger.log(`  cd ${config.directory}`);
            if (!config.installDeps) {
                logger.log(`  ${config.packageManager} install`);
            }
            logger.log(`  ${config.packageManager} run dev`);
            logger.newLine();

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