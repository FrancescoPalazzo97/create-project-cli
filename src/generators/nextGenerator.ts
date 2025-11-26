import path from 'node:path';
import { writeFile, writeJsonFile, createDirectory } from '../utils/fileSystem.js';
import { logger } from '../utils/logger.js';
import type { ProjectConfig, NextOptions } from '../types/index.js';
import { generateNextWorkflow } from './githubActionsGenerator.js';
import { gitignorePresets } from '../templates/gitignore.js';
import { generateCounterStore } from '../templates/zustand.js';
import { generateReadme as generateReadmeTemplate, commonCommands, projectStructureSections } from '../templates/readme.js';

export async function generateNextProject(config: ProjectConfig): Promise<void> {
  const projectPath = path.resolve(config.directory);
  const opts: NextOptions = config.nextOptions || {
    tailwind: false,
    zustand: false,
    githubActions: false
  };

  logger.step(1, 5, 'Creazione struttura cartelle...');

  await createDirectoryStructure(projectPath, opts);

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

async function createDirectoryStructure(
  projectPath: string,
  opts: NextOptions
): Promise<void> {
  await createDirectory(path.join(projectPath, 'src', 'app'));
  await createDirectory(path.join(projectPath, 'src', 'components'));
  await createDirectory(path.join(projectPath, 'src', 'lib'));
  await createDirectory(path.join(projectPath, 'src', 'types'));
  await createDirectory(path.join(projectPath, 'public'));

  if (opts.zustand) {
    await createDirectory(path.join(projectPath, 'src', 'store'));
  }
}

// ============================================
// PACKAGE.JSON
// ============================================

async function generatePackageJson(
  projectPath: string,
  projectName: string,
  opts: NextOptions
): Promise<void> {
  const dependencies: Record<string, string> = {
    'next': '^15.3.2',
    'react': '^19.1.0',
    'react-dom': '^19.1.0'
  };

  const devDependencies: Record<string, string> = {
    '@types/node': '^22.15.21',
    '@types/react': '^19.1.2',
    '@types/react-dom': '^19.1.2',
    'typescript': '^5.8.3',
    'eslint': '^9.27.0',
    'eslint-config-next': '^15.3.2'
  };

  if (opts.zustand) {
    dependencies['zustand'] = '^5.0.4';
  }

  if (opts.tailwind) {
    devDependencies['tailwindcss'] = '^4.1.6';
    devDependencies['@tailwindcss/postcss'] = '^4.1.6';
  }

  const packageJson = {
    name: projectName,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'next dev',
      build: 'next build',
      start: 'next start',
      lint: 'next lint'
    },
    dependencies,
    devDependencies
  };

  await writeJsonFile(path.join(projectPath, 'package.json'), packageJson);
}

// ============================================
// CONFIG FILES
// ============================================

async function generateConfigFiles(
  projectPath: string,
  opts: NextOptions
): Promise<void> {
  // next.config.ts
  const nextConfig = `import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // La tua configurazione Next.js
};

export default nextConfig;
`;

  await writeFile(path.join(projectPath, 'next.config.ts'), nextConfig);

  // tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      plugins: [{ name: 'next' }],
      paths: {
        '@/*': ['./src/*']
      }
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules']
  };

  await writeJsonFile(path.join(projectPath, 'tsconfig.json'), tsconfig);

  // postcss.config.mjs (per Tailwind)
  if (opts.tailwind) {
    const postcssConfig = `const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
`;
    await writeFile(path.join(projectPath, 'postcss.config.mjs'), postcssConfig);
  }

  // next-env.d.ts
  const nextEnv = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
`;

  await writeFile(path.join(projectPath, 'next-env.d.ts'), nextEnv);

  // .gitignore
  await writeFile(path.join(projectPath, '.gitignore'), gitignorePresets.next());
}

// ============================================
// SOURCE FILES
// ============================================

async function generateSourceFiles(
  projectPath: string,
  config: ProjectConfig,
  opts: NextOptions
): Promise<void> {
  // Zustand store
  if (opts.zustand) {
    await generateZustandStore(projectPath);
  }

  // App files
  await generateAppFiles(projectPath, config.name, opts);

  // Public assets
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="16" fill="#0070f3"/>
  <text x="18" y="24" text-anchor="middle" font-size="18" fill="white">N</text>
</svg>
`;

  await writeFile(path.join(projectPath, 'public', 'favicon.svg'), faviconSvg);

  // GitHub Actions
  if (opts.githubActions) {
    await generateNextWorkflow(projectPath, config);
  }
}

async function generateZustandStore(projectPath: string): Promise<void> {
  await writeFile(
    path.join(projectPath, 'src', 'store', 'counterStore.ts'),
    generateCounterStore()
  );
}

async function generateAppFiles(
  projectPath: string,
  projectName: string,
  opts: NextOptions
): Promise<void> {
  // globals.css
  let globalsCss: string;

  if (opts.tailwind) {
    globalsCss = `@import "tailwindcss";
`;
  } else {
    globalsCss = `:root {
  --color-background: #ffffff;
  --color-foreground: #171717;
  --color-primary: #0070f3;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-background: #0a0a0a;
    --color-foreground: #ededed;
  }
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body {
  max-width: 100vw;
  overflow-x: hidden;
}

body {
  font-family: var(--font-sans);
  color: var(--color-foreground);
  background: var(--color-background);
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

  await writeFile(path.join(projectPath, 'src', 'app', 'globals.css'), globalsCss);

  // layout.tsx
  const layoutTsx = `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${projectName}',
  description: 'Progetto Next.js creato con Create Project CLI',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
`;

  await writeFile(path.join(projectPath, 'src', 'app', 'layout.tsx'), layoutTsx);

  // page.tsx
  let pageTsx: string;

  if (opts.zustand) {
    if (opts.tailwind) {
      pageTsx = `'use client';

import { useCounterStore } from '@/store/counterStore';

export default function Home() {
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">${projectName}</h1>
        <p className="text-gray-600 mb-8">Il tuo progetto Next.js è pronto!</p>

        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-2xl font-semibold mb-4">Contatore: {count}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={decrement}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              -
            </button>
            <button
              onClick={reset}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Reset
            </button>
            <button
              onClick={increment}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
`;
    } else {
      pageTsx = `'use client';

import { useCounterStore } from '@/store/counterStore';
import styles from './page.module.css';

export default function Home() {
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>${projectName}</h1>
      <p className={styles.description}>Il tuo progetto Next.js è pronto!</p>

      <div className={styles.card}>
        <p className={styles.count}>Contatore: {count}</p>
        <div className={styles.buttons}>
          <button onClick={decrement} className={styles.btnDanger}>-</button>
          <button onClick={reset} className={styles.btnSecondary}>Reset</button>
          <button onClick={increment} className={styles.btnSuccess}>+</button>
        </div>
      </div>
    </main>
  );
}
`;
    }
  } else {
    if (opts.tailwind) {
      pageTsx = `export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">${projectName}</h1>
        <p className="text-gray-600">Il tuo progetto Next.js è pronto!</p>
      </div>
    </main>
  );
}
`;
    } else {
      pageTsx = `import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>${projectName}</h1>
      <p className={styles.description}>Il tuo progetto Next.js è pronto!</p>
    </main>
  );
}
`;
    }
  }

  await writeFile(path.join(projectPath, 'src', 'app', 'page.tsx'), pageTsx);

  // page.module.css (solo se non usa Tailwind)
  if (!opts.tailwind) {
    const pageModuleCss = `.main {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
}

.title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.description {
  font-size: 1.25rem;
  color: #666;
  margin-bottom: 2rem;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.count {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

.buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.buttons button {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  color: white;
}

.btnDanger {
  background-color: #ef4444;
}

.btnDanger:hover {
  background-color: #dc2626;
}

.btnSecondary {
  background-color: #6b7280;
}

.btnSecondary:hover {
  background-color: #4b5563;
}

.btnSuccess {
  background-color: #22c55e;
}

.btnSuccess:hover {
  background-color: #16a34a;
}
`;
    await writeFile(path.join(projectPath, 'src', 'app', 'page.module.css'), pageModuleCss);
  }
}

// ============================================
// README
// ============================================

async function generateReadme(
  projectPath: string,
  config: ProjectConfig,
  opts: NextOptions
): Promise<void> {
  const features = [
    'Next.js 15',
    'React 19',
    'TypeScript',
    'App Router',
    ...(opts.tailwind ? ['Tailwind CSS'] : []),
    ...(opts.zustand ? ['Zustand'] : []),
    ...(opts.githubActions ? ['GitHub Actions CI/CD'] : [])
  ];

  const readme = generateReadmeTemplate({
    projectName: config.name,
    description: 'Progetto Next.js + TypeScript creato con Create Project CLI.',
    features,
    packageManager: config.packageManager,
    commands: commonCommands.next(config.packageManager),
    sections: [
      projectStructureSections.next({ zustand: opts.zustand })
    ]
  });

  await writeFile(path.join(projectPath, 'README.md'), readme);
}
