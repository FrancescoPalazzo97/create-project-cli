export type Framework = 'react' | 'astro' | 'next' | 'express';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

// Opzioni specifiche per React
export interface ReactOptions {
    tailwind: boolean;
    reactRouter: boolean;
    zustand: boolean;
}

// Opzioni specifiche per Next.js
export interface NextOptions {
    tailwind: boolean;
    zustand: boolean;
}

// Opzioni specifiche per Astro
export interface AstroOptions {
    tailwind: boolean;
}

// Opzioni specifiche per Express
export interface ExpressOptions {
    // Per ora vuoto, potremo aggiungere database, auth, etc.
}

export interface ProjectConfig {
    name: string;
    framework: Framework;
    directory: string;
    packageManager: PackageManager;
    initGit: boolean;
    installDeps: boolean;
    // Opzioni specifiche per framework
    reactOptions?: ReactOptions;
    nextOptions?: NextOptions;
    astroOptions?: AstroOptions;
    expressOptions?: ExpressOptions;
}

// Opzioni che arrivano da Commander (possono essere undefined)
export interface CliOptions {
    framework?: Framework;
    directory?: string;
    git?: boolean;
    install?: boolean;
}