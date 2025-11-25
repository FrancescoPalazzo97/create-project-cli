import path from 'node:path';
import { writeFile, writeJsonFile, createDirectory } from '../utils/fileSystem.js';
import { logger } from '../utils/logger.js';
import type { ProjectConfig } from '../types/index.js';

export async function generateNextProject(config: ProjectConfig): Promise<void> {
    const projectPath = path.resolve(config.directory);

    logger.step(1, 5, 'Creazione struttura cartelle...');

    // Crea le directory (struttura con src/ e App Router)
    await createDirectory(path.join(projectPath, 'src', 'app'));
    await createDirectory(path.join(projectPath, 'src', 'components'));
    await createDirectory(path.join(projectPath, 'src', 'lib'));
    await createDirectory(path.join(projectPath, 'src', 'types'));
    await createDirectory(path.join(projectPath, 'public'));

    logger.step(2, 5, 'Generazione package.json...');

    const packageJson = {
        name: config.name,
        version: '0.1.0',
        private: true,
        scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint'
        },
        dependencies: {
            next: '^15.3.2',
            react: '^19.1.0',
            'react-dom': '^19.1.0'
        },
        devDependencies: {
            '@types/node': '^22.15.21',
            '@types/react': '^19.1.2',
            '@types/react-dom': '^19.1.2',
            typescript: '^5.8.3',
            eslint: '^9.27.0',
            'eslint-config-next': '^15.3.2'
        }
    };

    await writeJsonFile(path.join(projectPath, 'package.json'), packageJson);

    logger.step(3, 5, 'Generazione file di configurazione...');

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

    // next-env.d.ts
    const nextEnv = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
`;

    await writeFile(path.join(projectPath, 'next-env.d.ts'), nextEnv);

    // .gitignore
    const gitignore = `# Dependencies
node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# Build
/.next/
/out/
/build

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts

# OS
.DS_Store
`;

    await writeFile(path.join(projectPath, '.gitignore'), gitignore);

    logger.step(4, 5, 'Generazione file sorgente...');

    // src/app/globals.css
    const globalsCss = `:root {
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

    await writeFile(path.join(projectPath, 'src', 'app', 'globals.css'), globalsCss);

    // src/app/layout.tsx
    const layoutTsx = `import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: '${config.name}',
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

    // src/app/page.tsx
    const pageTsx = `import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>${config.name}</h1>
      <p className={styles.description}>
        Il tuo progetto Next.js è pronto.
      </p>
      <p className={styles.hint}>
        Modifica <code>src/app/page.tsx</code> per iniziare.
      </p>
    </main>
  );
}
`;

    await writeFile(path.join(projectPath, 'src', 'app', 'page.tsx'), pageTsx);

    // src/app/page.module.css
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
  margin-bottom: 1rem;
}

.hint {
  color: #888;
}

.hint code {
  background-color: #f4f4f4;
  padding: 0.2rem 0.5rem;
  border-radius: 4px;
  font-size: 0.9rem;
}

@media (prefers-color-scheme: dark) {
  .description {
    color: #888;
  }

  .hint {
    color: #666;
  }

  .hint code {
    background-color: #222;
  }
}
`;

    await writeFile(path.join(projectPath, 'src', 'app', 'page.module.css'), pageModuleCss);

    // src/components/Button.tsx (componente di esempio)
    const buttonComponent = `interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
}

export function Button({ children, onClick, variant = 'primary' }: ButtonProps) {
  const baseStyles = {
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    transition: 'background-color 0.2s',
  };

  const variants = {
    primary: {
      backgroundColor: '#0070f3',
      color: 'white',
    },
    secondary: {
      backgroundColor: 'transparent',
      color: '#0070f3',
      border: '1px solid #0070f3',
    },
  };

  return (
    <button
      onClick={onClick}
      style={{ ...baseStyles, ...variants[variant] }}
    >
      {children}
    </button>
  );
}
`;

    await writeFile(path.join(projectPath, 'src', 'components', 'Button.tsx'), buttonComponent);

    // public/favicon.ico placeholder (file vuoto, Next.js lo gestisce)
    const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 36 36">
  <circle cx="18" cy="18" r="16" fill="#0070f3"/>
  <text x="18" y="24" text-anchor="middle" font-size="18" fill="white">N</text>
</svg>
`;

    await writeFile(path.join(projectPath, 'public', 'favicon.svg'), faviconSvg);

    logger.step(5, 5, 'Generazione README...');

    // README.md
    const readme = `# ${config.name}

Progetto Next.js + TypeScript creato con Create Project CLI.

## Struttura del progetto

\`\`\`
src/
├── app/           # App Router (pages, layouts, routes)
│   ├── layout.tsx # Layout principale
│   ├── page.tsx   # Homepage
│   └── globals.css
├── components/    # Componenti React riutilizzabili
├── lib/           # Utility e funzioni condivise
└── types/         # Tipi TypeScript
public/            # Asset statici
\`\`\`

## Comandi disponibili

\`\`\`bash
# Avvia il server di sviluppo
${config.packageManager} run dev

# Build per produzione
${config.packageManager} run build

# Avvia il server di produzione
${config.packageManager} start

# Lint del codice
${config.packageManager} run lint
\`\`\`

## Risorse utili

- [Documentazione Next.js](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)
- [Next.js su GitHub](https://github.com/vercel/next.js)
`;

    await writeFile(path.join(projectPath, 'README.md'), readme);
}