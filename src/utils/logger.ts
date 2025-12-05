import chalk from 'chalk';
import gradient from 'gradient-string';
import boxen from 'boxen';
import figures from 'figures';

// Gradienti personalizzati
const titleGradient = gradient(['#ff6b6b', '#4ecdc4', '#45b7d1']);
const successGradient = gradient(['#11998e', '#38ef7d']);

export const logger = {
	// Banner iniziale con gradiente
	banner: (text: string) => {
		console.log();
		console.log(titleGradient.multiline(text));
		console.log();
	},

	// Box decorativo per messaggi importanti
	box: (message: string, title?: string) => {
		console.log(
			boxen(message, {
				padding: 1,
				margin: 1,
				borderStyle: 'round',
				borderColor: 'cyan',
				title: title,
				titleAlignment: 'center',
			})
		);
	},

	// Messaggi informativi
	info: (message: string) => {
		console.log(chalk.blue(figures.info), message);
	},

	// Successo
	success: (message: string) => {
		console.log(chalk.green(figures.tick), chalk.green(message));
	},

	// Warning
	warn: (message: string) => {
		console.log(chalk.yellow(figures.warning), chalk.yellow(message));
	},

	// Errori
	error: (message: string) => {
		console.log(chalk.red(figures.cross), chalk.red(message));
	},

	// Step di un processo
	step: (step: number, total: number, message: string) => {
		const progress = chalk.dim(`[${step}/${total}]`);
		const icon = chalk.cyan(figures.pointer);
		console.log(`${progress} ${icon} ${message}`);
	},

	// Titolo/header
	title: (message: string) => {
		console.log();
		console.log(chalk.bold.underline(message));
		console.log();
	},

	// Messaggio con gradiente per successo finale
	celebrate: (message: string) => {
		console.log();
		console.log(successGradient(message));
		console.log();
	},

	// Lista di comandi suggeriti
	commands: (commands: string[]) => {
		commands.forEach((cmd) => {
			console.log(`  ${chalk.cyan(figures.pointer)} ${chalk.white(cmd)}`);
		});
	},

	// Messaggio semplice
	log: (message: string) => {
		console.log(message);
	},

	// Linea vuota
	newLine: () => {
		console.log();
	},

	// Divisore
	divider: () => {
		console.log(chalk.dim('─'.repeat(50)));
	},
};
