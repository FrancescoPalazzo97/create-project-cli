import fs from 'node:fs/promises';
import path from 'node:path';

// Verifica se una directory esiste
export async function directoryExists(dirPath: string): Promise<boolean> {
	try {
		const stats = await fs.stat(dirPath);
		return stats.isDirectory();
	} catch {
		return false;
	}
}

// Verifica se una directory è vuota
export async function isDirectoryEmpty(dirPath: string): Promise<boolean> {
	try {
		const files = await fs.readdir(dirPath);
		return files.length === 0;
	} catch {
		return true;
	}
}

// Crea una directory (ricorsivamente)
export async function createDirectory(dirPath: string): Promise<void> {
	await fs.mkdir(dirPath, { recursive: true });
}

// Scrive un file creando le directory parent se necessario
export async function writeFile(filePath: string, content: string): Promise<void> {
	const dir = path.dirname(filePath);
	await createDirectory(dir);
	await fs.writeFile(filePath, content, 'utf-8');
}

// Copia un file
export async function copyFile(source: string, destination: string): Promise<void> {
	const dir = path.dirname(destination);
	await createDirectory(dir);
	await fs.copyFile(source, destination);
}

// Legge un file come stringa
export async function readFile(filePath: string): Promise<string> {
	return fs.readFile(filePath, 'utf-8');
}

// Scrive un oggetto come JSON formattato
export async function writeJsonFile(filePath: string, data: object): Promise<void> {
	const content = JSON.stringify(data, null, 2);
	await writeFile(filePath, content);
}
