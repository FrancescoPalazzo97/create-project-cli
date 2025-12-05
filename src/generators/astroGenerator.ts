import path from 'node:path';
import { writeFile, writeJsonFile, createDirectory } from '../utils/fileSystem.js';
import { logger } from '../utils/logger.js';
import type { ProjectConfig, AstroOptions } from '../types/index.js';
import { generateAstroWorkflow } from './githubActionsGenerator.js';
import { gitignorePresets } from '../templates/gitignore.js';
import {
	generateReadme as generateReadmeTemplate,
	commonCommands,
	projectStructureSections,
} from '../templates/readme.js';

export async function generateAstroProject(config: ProjectConfig): Promise<void> {
	const projectPath = path.resolve(config.directory);
	const opts: AstroOptions = config.astroOptions || {
		tailwind: false,
		githubActions: false,
	};

	logger.step(1, 5, 'Creazione struttura cartelle...');

	await createDirectoryStructure(projectPath);

	logger.step(2, 5, 'Generazione package.json...');

	await generatePackageJson(projectPath, config.name, opts);

	logger.step(3, 5, 'Generazione file di configurazione...');

	await generateConfigFiles(projectPath, opts);

	logger.step(4, 5, 'Generazione file sorgente...');

	await generateSourceFiles(projectPath, config, opts);

	logger.step(5, 5, 'Generazione README...');

	await generateReadme(projectPath, config, opts);
}

// ============================================
// DIRECTORY STRUCTURE
// ============================================

async function createDirectoryStructure(projectPath: string): Promise<void> {
	await createDirectory(path.join(projectPath, 'src', 'components'));
	await createDirectory(path.join(projectPath, 'src', 'layouts'));
	await createDirectory(path.join(projectPath, 'src', 'pages'));
	await createDirectory(path.join(projectPath, 'src', 'styles'));
	await createDirectory(path.join(projectPath, 'public'));
}

// ============================================
// PACKAGE.JSON
// ============================================

async function generatePackageJson(
	projectPath: string,
	projectName: string,
	opts: AstroOptions
): Promise<void> {
	const dependencies: Record<string, string> = {
		astro: '^5.7.13',
	};

	const devDependencies: Record<string, string> = {
		'@astrojs/check': '^0.9.4',
		typescript: '^5.8.3',
	};

	if (opts.tailwind) {
		dependencies['@astrojs/tailwind'] = '^6.0.2';
		dependencies['tailwindcss'] = '^3.4.17';
	}

	const packageJson = {
		name: projectName,
		type: 'module',
		version: '0.1.0',
		scripts: {
			dev: 'astro dev',
			build: 'astro build',
			preview: 'astro preview',
			astro: 'astro',
		},
		dependencies,
		devDependencies,
	};

	await writeJsonFile(path.join(projectPath, 'package.json'), packageJson);
}

// ============================================
// CONFIG FILES
// ============================================

async function generateConfigFiles(projectPath: string, opts: AstroOptions): Promise<void> {
	// astro.config.mjs
	let astroConfig: string;

	if (opts.tailwind) {
		astroConfig = `import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  integrations: [tailwind()],
});
`;
	} else {
		astroConfig = `import { defineConfig } from 'astro/config';

export default defineConfig({
  // La tua configurazione Astro
});
`;
	}

	await writeFile(path.join(projectPath, 'astro.config.mjs'), astroConfig);

	// tailwind.config.mjs (solo se usa Tailwind)
	if (opts.tailwind) {
		const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
`;
		await writeFile(path.join(projectPath, 'tailwind.config.mjs'), tailwindConfig);
	}

	// tsconfig.json
	const tsconfig = {
		extends: 'astro/tsconfigs/strict',
		compilerOptions: {
			baseUrl: '.',
			paths: {
				'@components/*': ['src/components/*'],
				'@layouts/*': ['src/layouts/*'],
				'@styles/*': ['src/styles/*'],
			},
		},
	};

	await writeJsonFile(path.join(projectPath, 'tsconfig.json'), tsconfig);

	// .gitignore
	await writeFile(path.join(projectPath, '.gitignore'), gitignorePresets.astro());
}

// ============================================
// SOURCE FILES
// ============================================

async function generateSourceFiles(
	projectPath: string,
	config: ProjectConfig,
	opts: AstroOptions
): Promise<void> {
	// Styles
	await generateStyles(projectPath, config.name, opts);

	// Layouts
	await generateLayouts(projectPath, config.name, opts);

	// Components
	await generateComponents(projectPath, config.name, opts);

	// Pages
	await generatePages(projectPath, config.name, opts);

	// Public assets
	const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="16" fill="#4f46e5"/>
  <text x="18" y="24" text-anchor="middle" font-size="20" fill="white">A</text>
</svg>
`;

	await writeFile(path.join(projectPath, 'public', 'favicon.svg'), favicon);

	// GitHub Actions
	if (opts.githubActions) {
		await generateAstroWorkflow(projectPath, config);
	}
}

async function generateStyles(
	projectPath: string,
	_projectName: string,
	opts: AstroOptions
): Promise<void> {
	let globalCss: string;

	if (opts.tailwind) {
		globalCss = `@tailwind base;
@tailwind components;
@tailwind utilities;
`;
	} else {
		globalCss = `:root {
  --color-text: #333;
  --color-background: #fff;
  --color-primary: #4f46e5;
  --font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html {
  font-family: var(--font-family);
  color: var(--color-text);
  background-color: var(--color-background);
}

body {
  min-height: 100vh;
}

a {
  color: var(--color-primary);
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}
`;
	}

	await writeFile(path.join(projectPath, 'src', 'styles', 'global.css'), globalCss);
}

async function generateLayouts(
	projectPath: string,
	projectName: string,
	opts: AstroOptions
): Promise<void> {
	let baseLayout: string;

	if (opts.tailwind) {
		baseLayout = `---
interface Props {
  title: string;
  description?: string;
}

const { title, description = '${projectName} - Sito creato con Astro' } = Astro.props;
---

<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body class="min-h-screen bg-gray-50">
    <slot />
  </body>
</html>

<style is:global>
  @import '../styles/global.css';
</style>
`;
	} else {
		baseLayout = `---
interface Props {
  title: string;
  description?: string;
}

const { title, description = '${projectName} - Sito creato con Astro' } = Astro.props;
---

<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body>
    <slot />
  </body>
</html>

<style is:global>
  @import '../styles/global.css';
</style>
`;
	}

	await writeFile(path.join(projectPath, 'src', 'layouts', 'BaseLayout.astro'), baseLayout);
}

async function generateComponents(
	projectPath: string,
	projectName: string,
	opts: AstroOptions
): Promise<void> {
	// Header component
	let headerComponent: string;

	if (opts.tailwind) {
		headerComponent = `---
interface Props {
  siteName?: string;
}

const { siteName = '${projectName}' } = Astro.props;
---

<header class="bg-white shadow-sm">
  <nav class="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
    <a href="/" class="text-xl font-bold text-indigo-600 hover:text-indigo-700">
      {siteName}
    </a>
    <ul class="flex gap-6">
      <li>
        <a href="/" class="text-gray-700 hover:text-indigo-600 font-medium">
          Home
        </a>
      </li>
      <li>
        <a href="/about" class="text-gray-700 hover:text-indigo-600 font-medium">
          About
        </a>
      </li>
    </ul>
  </nav>
</header>
`;
	} else {
		headerComponent = `---
interface Props {
  siteName?: string;
}

const { siteName = '${projectName}' } = Astro.props;
---

<header>
  <nav>
    <a href="/" class="logo">{siteName}</a>
    <ul>
      <li><a href="/">Home</a></li>
      <li><a href="/about">About</a></li>
    </ul>
  </nav>
</header>

<style>
  header {
    padding: 1rem 2rem;
    border-bottom: 1px solid #eee;
  }

  nav {
    max-width: 1200px;
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .logo {
    font-weight: 700;
    font-size: 1.25rem;
    color: var(--color-primary);
  }

  ul {
    display: flex;
    gap: 1.5rem;
    list-style: none;
  }

  a {
    color: var(--color-text);
    transition: color 0.2s;
  }

  a:hover {
    color: var(--color-primary);
    text-decoration: none;
  }
</style>
`;
	}

	await writeFile(path.join(projectPath, 'src', 'components', 'Header.astro'), headerComponent);

	// Footer component
	let footerComponent: string;

	if (opts.tailwind) {
		footerComponent = `---
const year = new Date().getFullYear();
---

<footer class="border-t border-gray-200 mt-auto py-8 text-center">
  <p class="text-gray-500 text-sm">
    &copy; {year} ${projectName}. Creato con Astro.
  </p>
</footer>
`;
	} else {
		footerComponent = `---
const year = new Date().getFullYear();
---

<footer>
  <p>&copy; {year} ${projectName}. Creato con Astro.</p>
</footer>

<style>
  footer {
    padding: 2rem;
    text-align: center;
    border-top: 1px solid #eee;
    margin-top: auto;
  }

  p {
    color: #666;
    font-size: 0.875rem;
  }
</style>
`;
	}

	await writeFile(path.join(projectPath, 'src', 'components', 'Footer.astro'), footerComponent);
}

async function generatePages(
	projectPath: string,
	projectName: string,
	opts: AstroOptions
): Promise<void> {
	// Index page
	let indexPage: string;

	if (opts.tailwind) {
		indexPage = `---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
---

<BaseLayout title="${projectName}">
  <Header />

  <main class="flex-1">
    <section class="max-w-3xl mx-auto px-4 py-16 text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        Benvenuto in ${projectName}
      </h1>
      <p class="text-xl text-gray-600 mb-8">
        Il tuo nuovo progetto Astro è pronto.
      </p>
      <a
        href="/about"
        class="inline-block px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
      >
        Scopri di più
      </a>
    </section>
  </main>

  <Footer />
</BaseLayout>
`;
	} else {
		indexPage = `---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
---

<BaseLayout title="${projectName}">
  <Header />

  <main>
    <section class="hero">
      <h1>Benvenuto in ${projectName}</h1>
      <p>Il tuo nuovo progetto Astro è pronto.</p>
      <a href="/about" class="button">Scopri di più</a>
    </section>
  </main>

  <Footer />
</BaseLayout>

<style>
  main {
    flex: 1;
  }

  .hero {
    max-width: 800px;
    margin: 0 auto;
    padding: 4rem 2rem;
    text-align: center;
  }

  h1 {
    font-size: 2.5rem;
    margin-bottom: 1rem;
  }

  p {
    font-size: 1.25rem;
    color: #666;
    margin-bottom: 2rem;
  }

  .button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background-color: var(--color-primary);
    color: white;
    border-radius: 8px;
    font-weight: 500;
    transition: background-color 0.2s;
  }

  .button:hover {
    background-color: #4338ca;
    text-decoration: none;
  }
</style>
`;
	}

	await writeFile(path.join(projectPath, 'src', 'pages', 'index.astro'), indexPage);

	// About page
	let aboutPage: string;

	if (opts.tailwind) {
		aboutPage = `---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
---

<BaseLayout title="About - ${projectName}">
  <Header />

  <main class="flex-1">
    <article class="max-w-2xl mx-auto px-4 py-12">
      <h1 class="text-3xl font-bold text-gray-900 mb-6">About</h1>
      <p class="text-gray-600 leading-relaxed mb-4">
        Questo è un progetto creato con <strong class="text-gray-900">Astro</strong> e
        <strong class="text-gray-900">TypeScript</strong> usando Create Project CLI.
      </p>
      <p class="text-gray-600 leading-relaxed mb-6">
        Astro è un framework moderno per costruire siti web veloci
        e content-focused con meno JavaScript.
      </p>
      <a href="/" class="text-indigo-600 hover:text-indigo-700 font-medium">
        ← Torna alla home
      </a>
    </article>
  </main>

  <Footer />
</BaseLayout>
`;
	} else {
		aboutPage = `---
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
---

<BaseLayout title="About - ${projectName}">
  <Header />

  <main>
    <article>
      <h1>About</h1>
      <p>
        Questo è un progetto creato con <strong>Astro</strong> e
        <strong>TypeScript</strong> usando Create Project CLI.
      </p>
      <p>
        Astro è un framework moderno per costruire siti web veloci
        e content-focused con meno JavaScript.
      </p>
      <a href="/">← Torna alla home</a>
    </article>
  </main>

  <Footer />
</BaseLayout>

<style>
  article {
    max-width: 700px;
    margin: 0 auto;
    padding: 3rem 2rem;
  }

  h1 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
  }

  p {
    line-height: 1.7;
    margin-bottom: 1rem;
    color: #444;
  }

  a {
    display: inline-block;
    margin-top: 1.5rem;
  }
</style>
`;
	}

	await writeFile(path.join(projectPath, 'src', 'pages', 'about.astro'), aboutPage);
}

// ============================================
// README
// ============================================

async function generateReadme(
	projectPath: string,
	config: ProjectConfig,
	opts: AstroOptions
): Promise<void> {
	const features = [
		'Astro 5',
		'TypeScript',
		...(opts.tailwind ? ['Tailwind CSS'] : []),
		...(opts.githubActions ? ['GitHub Actions CI/CD'] : []),
	];

	const additionalContent = `## Risorse utili

- [Documentazione Astro](https://docs.astro.build)
- [Astro Components](https://docs.astro.build/en/core-concepts/astro-components/)
${opts.tailwind ? '- [Tailwind CSS](https://tailwindcss.com/docs)\n' : ''}- [Astro Integrations](https://astro.build/integrations/)`;

	const readme = generateReadmeTemplate({
		projectName: config.name,
		description: 'Sito Astro + TypeScript creato con Create Project CLI.',
		features,
		packageManager: config.packageManager,
		commands: commonCommands.astro(config.packageManager),
		sections: [projectStructureSections.astro()],
		additionalContent,
	});

	await writeFile(path.join(projectPath, 'README.md'), readme);
}
