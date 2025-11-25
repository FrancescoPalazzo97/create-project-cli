import { generateReactProject } from './reactGenerator.js';
import { generateExpressProject } from './expressGenerator.js';
import { generateAstroProject } from './astroGenerator.js';
import { generateNextProject } from './nextGenerator.js';
import type { ProjectConfig } from '../types/index.js';

export async function generateProject(config: ProjectConfig): Promise<void> {
    switch (config.framework) {
        case 'react':
            await generateReactProject(config);
            break;
        case 'express':
            await generateExpressProject(config);
            break;
        case 'astro':
            await generateAstroProject(config);
            break;
        case 'next':
            await generateNextProject(config);
            break;
    }
}