export type Framework = 'react' | 'astro' | 'next' | 'express';

export type PackageManager = 'npm' | 'yarn' | 'pnpm';

export type Database = 'mongodb' | 'postgresql' | 'none';

// Opzioni specifiche per React
export interface ReactOptions {
    tailwind: boolean;
    reactRouter: boolean;
    zustand: boolean;
    githubActions: boolean;
}

// Opzioni specifiche per Next.js
export interface NextOptions {
    tailwind: boolean;
    zustand: boolean;
    githubActions: boolean;
}

// Opzioni specifiche per Astro
export interface AstroOptions {
    tailwind: boolean;
    githubActions: boolean;
}

// Opzioni specifiche per Express
export interface ExpressOptions {
    database: Database;
    authentication: boolean;
    swagger: boolean;
    docker: boolean;
    githubActions: boolean;
}

export interface ProjectConfig {
    name: string;
    framework: Framework;
    directory: string;
    packageManager: PackageManager;
    initGit: boolean;
    installDeps: boolean;
    reactOptions?: ReactOptions;
    nextOptions?: NextOptions;
    astroOptions?: AstroOptions;
    expressOptions?: ExpressOptions;
}

// Opzioni che arrivano da Commander
export interface CliOptions {
    framework?: Framework;
    directory?: string;
    git?: boolean;
    install?: boolean;
}