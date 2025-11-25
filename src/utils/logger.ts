import chalk from 'chalk';

export const logger = {
    // Messaggi informativi
    info: (message: string) => {
        console.log(chalk.blue('ℹ'), message);
    },

    // Successo
    success: (message: string) => {
        console.log(chalk.green('✔'), message);
    },

    // Warning
    warn: (message: string) => {
        console.log(chalk.yellow('⚠'), message);
    },

    // Errori
    error: (message: string) => {
        console.log(chalk.red('✖'), message);
    },

    // Step di un processo (con numero)
    step: (step: number, total: number, message: string) => {
        console.log(chalk.cyan(`[${step}/${total}]`), message);
    },

    // Titolo/header
    title: (message: string) => {
        console.log();
        console.log(chalk.bold.underline(message));
        console.log();
    },

    // Messaggio semplice senza icona
    log: (message: string) => {
        console.log(message);
    },

    // Linea vuota
    newLine: () => {
        console.log();
    }
};