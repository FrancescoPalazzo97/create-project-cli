import path from 'node:path';
import { writeFile, writeJsonFile, createDirectory, logger } from '../utils';
import type { ProjectConfig } from '../types/index.js';

export async function generateReactProject(config: ProjectConfig): Promise<void> {
    const projectPath = path.resolve(config.directory);

    logger.step(1, 5, 'Creazione struttura cartelle...');

    // Crea le directory
    await createDirectory(path.join(projectPath, 'src', 'components'));
    await createDirectory(path.join(projectPath, 'src', 'hooks'));
    await createDirectory(path.join(projectPath, 'src', 'utils'));
    await createDirectory(path.join(projectPath, 'src', 'types'));
    await createDirectory(path.join(projectPath, 'public'));

    logger.step(2, 5, 'Generazione package.json...');

    // package.json
    const packageJson = {
        name: config.name,
        private: true,
        version: '0.1.0',
        type: 'module',
        scripts: {
            dev: 'vite',
            build: 'tsc -b && vite build',
            lint: 'eslint .',
            preview: 'vite preview'
        },
        dependencies: {
            'react': '^19.1.0',
            'react-dom': '^19.1.0'
        },
        devDependencies: {
            '@eslint/js': '^9.25.0',
            '@types/react': '^19.1.2',
            '@types/react-dom': '^19.1.2',
            '@vitejs/plugin-react': '^4.4.1',
            'eslint': '^9.25.0',
            'eslint-plugin-react-hooks': '^5.2.0',
            'eslint-plugin-react-refresh': '^0.4.19',
            'globals': '^16.0.0',
            'typescript': '~5.8.3',
            'typescript-eslint': '^8.30.1',
            'vite': '^6.3.5'
        }
    };

    await writeJsonFile(path.join(projectPath, 'package.json'), packageJson);

    logger.step(3, 5, 'Generazione file di configurazione...');

    // tsconfig.json
    const tsconfig = {
        compilerOptions: {
            target: 'ES2022',
            useDefineForClassFields: true,
            lib: ['ES2022', 'DOM', 'DOM.Iterable'],
            module: 'ESNext',
            skipLibCheck: true,
            moduleResolution: 'bundler',
            allowImportingTsExtensions: true,
            isolatedModules: true,
            moduleDetection: 'force',
            noEmit: true,
            jsx: 'react-jsx',
            strict: true,
            noUnusedLocals: true,
            noUnusedParameters: true,
            noFallthroughCasesInSwitch: true,
            noUncheckedSideEffectImports: true
        },
        include: ['src']
    };

    await writeJsonFile(path.join(projectPath, 'tsconfig.json'), tsconfig);

    // vite.config.ts
    const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;

    await writeFile(path.join(projectPath, 'vite.config.ts'), viteConfig);

    // .gitignore
    const gitignore = `# Dependencies
node_modules

# Build
dist
dist-ssr

# Environment
.env
.env.local
.env.*.local

# Editor
.vscode/*
!.vscode/extensions.json
.idea

# Logs
*.log
npm-debug.log*

# OS
.DS_Store
`;

    await writeFile(path.join(projectPath, '.gitignore'), gitignore);

    logger.step(4, 5, 'Generazione file sorgente...');

    // index.html
    const indexHtml = `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${config.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

    await writeFile(path.join(projectPath, 'index.html'), indexHtml);

    // src/main.tsx
    const mainTsx = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
`;

    await writeFile(path.join(projectPath, 'src', 'main.tsx'), mainTsx);

    // src/App.tsx
    const appTsx = `import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <h1>${config.name}</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          Contatore: {count}
        </button>
      </div>
      <p>Modifica <code>src/App.tsx</code> e salva per vedere le modifiche.</p>
    </div>
  );
}

export default App;
`;

    await writeFile(path.join(projectPath, 'src', 'App.tsx'), appTsx);

    // src/index.css
    const indexCss = `:root {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: #213547;
  background-color: #ffffff;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.app {
  max-width: 600px;
  padding: 2rem;
  text-align: center;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1.5rem;
}

.card {
  padding: 2rem;
}

button {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 500;
  background-color: #646cff;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

button:hover {
  background-color: #535bf2;
}

p {
  margin-top: 1.5rem;
  color: #888;
}

code {
  background-color: #f4f4f4;
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-size: 0.9rem;
}
`;

    await writeFile(path.join(projectPath, 'src', 'index.css'), indexCss);

    // public/vite.svg
    const viteSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 257">
  <path fill="#646CFF" d="m128 0 128 44.5-20.8 171.2L128 257 21.2 215.7.4 44.5z"/>
  <path fill="#fff" d="M96 160V80l80 40z"/>
</svg>
`;

    await writeFile(path.join(projectPath, 'public', 'vite.svg'), viteSvg);

    logger.step(5, 5, 'Generazione README...');

    // README.md
    const readme = `# ${config.name}

Progetto React + TypeScript creato con Create Project CLI.

## Comandi disponibili

\`\`\`bash
# Avvia il server di sviluppo
${config.packageManager} run dev

# Build per produzione
${config.packageManager} run build

# Preview della build
${config.packageManager} run preview

# Lint del codice
${config.packageManager} run lint
\`\`\`
`;

    await writeFile(path.join(projectPath, 'README.md'), readme);
}