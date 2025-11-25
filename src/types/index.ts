export type Framework = 'react' | 'astro' | 'next' | 'express';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export interface ProjectConfig {
    name: string;
    framework: Framework;
    directory: string;
    packageManager: PackageManager;
    initGit: boolean;
    installDeps: boolean;
}

// Opzioni che arrivano da Commander (possono essere undefined)
export interface CliOptions {
    framework?: Framework;
    directory?: string;
    git?: boolean;
    install?: boolean;
}