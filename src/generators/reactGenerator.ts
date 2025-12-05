import path from 'node:path';
import { writeFile, writeJsonFile, createDirectory } from '../utils/fileSystem.js';
import { logger } from '../utils/logger.js';
import type { ProjectConfig } from '../types/index.js';
import { generateReactWorkflow } from './githubActionsGenerator.js';
import { gitignorePresets } from '../templates/gitignore.js';
import { generateCounterStore } from '../templates/zustand.js';
import {
	generateReadme as generateReadmeTemplate,
	commonCommands,
	projectStructureSections,
} from '../templates/readme.js';

export async function generateReactProject(config: ProjectConfig): Promise<void> {
	const projectPath = path.resolve(config.directory);
	const opts = config.reactOptions || {
		tailwind: false,
		reactRouter: false,
		zustand: false,
		githubActions: false,
	};

	logger.step(1, 5, 'Creazione struttura cartelle...');

	await createDirectoryStructure(projectPath, opts);

	logger.step(2, 5, 'Generazione package.json...');

	await generatePackageJson(projectPath, config.name, opts);

	logger.step(3, 5, 'Generazione file di configurazione...');

	await generateConfigFiles(projectPath, config.name, opts);

	logger.step(4, 5, 'Generazione file sorgente...');

	await generateSourceFiles(projectPath, config.name, config, opts);

	logger.step(5, 5, 'Generazione README...');

	await generateReadme(projectPath, config, opts);
}

// ============================================
// DIRECTORY STRUCTURE
// ============================================

async function createDirectoryStructure(
	projectPath: string,
	opts: { reactRouter: boolean; zustand: boolean }
): Promise<void> {
	await createDirectory(path.join(projectPath, 'src', 'components'));
	await createDirectory(path.join(projectPath, 'src', 'hooks'));
	await createDirectory(path.join(projectPath, 'src', 'utils'));
	await createDirectory(path.join(projectPath, 'src', 'types'));
	await createDirectory(path.join(projectPath, 'public'));

	if (opts.reactRouter) {
		await createDirectory(path.join(projectPath, 'src', 'pages'));
	}

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
	opts: { tailwind: boolean; reactRouter: boolean; zustand: boolean }
): Promise<void> {
	const dependencies: Record<string, string> = {
		react: '^19.1.0',
		'react-dom': '^19.1.0',
	};

	const devDependencies: Record<string, string> = {
		'@eslint/js': '^9.25.0',
		'@types/react': '^19.1.2',
		'@types/react-dom': '^19.1.2',
		'@vitejs/plugin-react': '^4.4.1',
		eslint: '^9.25.0',
		'eslint-plugin-react-hooks': '^5.2.0',
		'eslint-plugin-react-refresh': '^0.4.19',
		globals: '^16.0.0',
		typescript: '~5.8.3',
		'typescript-eslint': '^8.30.1',
		vite: '^6.3.5',
	};

	if (opts.reactRouter) {
		dependencies['react-router-dom'] = '^7.6.0';
	}

	if (opts.zustand) {
		dependencies['zustand'] = '^5.0.4';
	}

	if (opts.tailwind) {
		devDependencies['tailwindcss'] = '^4.1.6';
		devDependencies['@tailwindcss/vite'] = '^4.1.6';
	}

	const packageJson = {
		name: projectName,
		private: true,
		version: '0.1.0',
		type: 'module',
		scripts: {
			dev: 'vite',
			build: 'tsc -b && vite build',
			lint: 'eslint .',
			preview: 'vite preview',
		},
		dependencies,
		devDependencies,
	};

	await writeJsonFile(path.join(projectPath, 'package.json'), packageJson);
}

// ============================================
// CONFIG FILES
// ============================================

async function generateConfigFiles(
	projectPath: string,
	projectName: string,
	opts: { tailwind: boolean }
): Promise<void> {
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
			noUncheckedSideEffectImports: true,
		},
		include: ['src'],
	};

	await writeJsonFile(path.join(projectPath, 'tsconfig.json'), tsconfig);

	// vite.config.ts
	let viteConfig: string;

	if (opts.tailwind) {
		viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`;
	} else {
		viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
});
`;
	}

	await writeFile(path.join(projectPath, 'vite.config.ts'), viteConfig);

	// .gitignore
	await writeFile(path.join(projectPath, '.gitignore'), gitignorePresets.react());

	// vite-env.d.ts
	const viteEnv = `/// <reference types="vite/client" />

declare module '*.css' {
  const content: string;
  export default content;
}

declare module '*.scss' {
  const content: string;
  export default content;
}

declare module '*.sass' {
  const content: string;
  export default content;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}
`;

	await writeFile(path.join(projectPath, 'src', 'vite-env.d.ts'), viteEnv);
}

// ============================================
// SOURCE FILES
// ============================================

async function generateSourceFiles(
	projectPath: string,
	projectName: string,
	config: ProjectConfig,
	opts: { tailwind: boolean; reactRouter: boolean; zustand: boolean; githubActions: boolean }
): Promise<void> {
	// index.html
	const indexHtml = `<!DOCTYPE html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;

	await writeFile(path.join(projectPath, 'index.html'), indexHtml);

	// Zustand store
	if (opts.zustand) {
		await generateZustandStore(projectPath);
	}

	// React Router o file base
	if (opts.reactRouter) {
		await generateReactRouterFiles(projectPath, projectName, opts);
	} else {
		await generateBasicFiles(projectPath, projectName, opts);
	}

	// CSS
	await generateStyles(projectPath, opts.tailwind);

	// public/vite.svg
	const viteSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 257">
  <path fill="#646CFF" d="m128 0 128 44.5-20.8 171.2L128 257 21.2 215.7.4 44.5z"/>
  <path fill="#fff" d="M96 160V80l80 40z"/>
</svg>
`;

	await writeFile(path.join(projectPath, 'public', 'vite.svg'), viteSvg);

	// GitHub Actions
	if (opts.githubActions) {
		await generateReactWorkflow(projectPath, config);
	}
}

// ============================================
// README
// ============================================

async function generateReadme(
	projectPath: string,
	config: ProjectConfig,
	opts: { tailwind: boolean; reactRouter: boolean; zustand: boolean; githubActions: boolean }
): Promise<void> {
	const features = [
		'React 19',
		'TypeScript',
		'Vite',
		...(opts.tailwind ? ['Tailwind CSS'] : []),
		...(opts.reactRouter ? ['React Router'] : []),
		...(opts.zustand ? ['Zustand'] : []),
		...(opts.githubActions ? ['GitHub Actions CI/CD'] : []),
	];

	const readme = generateReadmeTemplate({
		projectName: config.name,
		description: 'Progetto React + TypeScript creato con Create Project CLI.',
		features,
		packageManager: config.packageManager,
		commands: commonCommands.vite(config.packageManager),
		sections: [
			projectStructureSections.react({ reactRouter: opts.reactRouter, zustand: opts.zustand }),
		],
	});

	await writeFile(path.join(projectPath, 'README.md'), readme);
}

// Genera lo store Zustand
async function generateZustandStore(projectPath: string): Promise<void> {
	await writeFile(
		path.join(projectPath, 'src', 'store', 'counterStore.ts'),
		generateCounterStore()
	);
}

// Genera file con React Router
async function generateReactRouterFiles(
	projectPath: string,
	projectName: string,
	opts: { tailwind: boolean; zustand: boolean }
): Promise<void> {
	// src/main.tsx con Router
	const mainTsx = `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);
`;

	await writeFile(path.join(projectPath, 'src', 'main.tsx'), mainTsx);

	// src/App.tsx con Routes
	const appTsx = `import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
      </Route>
    </Routes>
  );
}

export default App;
`;

	await writeFile(path.join(projectPath, 'src', 'App.tsx'), appTsx);

	// src/components/Layout.tsx
	let layoutTsx: string;

	if (opts.tailwind) {
		layoutTsx = `import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <ul className="flex gap-6">
            <li>
              <Link to="/" className="text-gray-700 hover:text-blue-600 font-medium">
                Home
              </Link>
            </li>
            <li>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium">
                About
              </Link>
            </li>
          </ul>
        </div>
      </nav>
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
`;
	} else {
		layoutTsx = `import { Outlet, Link } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="layout">
      <nav className="nav">
        <ul>
          <li><Link to="/">Home</Link></li>
          <li><Link to="/about">About</Link></li>
        </ul>
      </nav>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
`;
	}

	await writeFile(path.join(projectPath, 'src', 'components', 'Layout.tsx'), layoutTsx);

	// src/pages/Home.tsx
	let homeTsx: string;

	if (opts.zustand) {
		if (opts.tailwind) {
			homeTsx = `import { useCounterStore } from '../store/counterStore';

export default function Home() {
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">${projectName}</h1>
      <p className="text-gray-600 mb-8">Benvenuto nel tuo progetto React!</p>
      
      <div className="bg-white rounded-lg shadow-md p-6 max-w-xs mx-auto">
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
  );
}
`;
		} else {
			homeTsx = `import { useCounterStore } from '../store/counterStore';

export default function Home() {
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <div className="home">
      <h1>${projectName}</h1>
      <p>Benvenuto nel tuo progetto React!</p>
      
      <div className="counter-card">
        <p className="count">Contatore: {count}</p>
        <div className="buttons">
          <button onClick={decrement} className="btn-danger">-</button>
          <button onClick={reset} className="btn-secondary">Reset</button>
          <button onClick={increment} className="btn-success">+</button>
        </div>
      </div>
    </div>
  );
}
`;
		}
	} else {
		if (opts.tailwind) {
			homeTsx = `export default function Home() {
  return (
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">${projectName}</h1>
      <p className="text-gray-600">Benvenuto nel tuo progetto React!</p>
    </div>
  );
}
`;
		} else {
			homeTsx = `export default function Home() {
  return (
    <div className="home">
      <h1>${projectName}</h1>
      <p>Benvenuto nel tuo progetto React!</p>
    </div>
  );
}
`;
		}
	}

	await writeFile(path.join(projectPath, 'src', 'pages', 'Home.tsx'), homeTsx);

	// src/pages/About.tsx
	let aboutTsx: string;

	if (opts.tailwind) {
		aboutTsx = `export default function About() {
  return (
    <div>
      <h1 className="text-3xl font-bold mb-4">About</h1>
      <p className="text-gray-600">
        Questo progetto è stato creato con Create Project CLI.
      </p>
    </div>
  );
}
`;
	} else {
		aboutTsx = `export default function About() {
  return (
    <div className="about">
      <h1>About</h1>
      <p>Questo progetto è stato creato con Create Project CLI.</p>
    </div>
  );
}
`;
	}

	await writeFile(path.join(projectPath, 'src', 'pages', 'About.tsx'), aboutTsx);
}

// Genera file base senza React Router
async function generateBasicFiles(
	projectPath: string,
	projectName: string,
	opts: { tailwind: boolean; zustand: boolean }
): Promise<void> {
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
	let appTsx: string;

	if (opts.zustand) {
		if (opts.tailwind) {
			appTsx = `import { useCounterStore } from './store/counterStore';

function App() {
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">${projectName}</h1>
        <p className="text-gray-600 mb-8">Il tuo progetto React è pronto!</p>
        
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
    </div>
  );
}

export default App;
`;
		} else {
			appTsx = `import { useCounterStore } from './store/counterStore';

function App() {
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <div className="app">
      <h1>${projectName}</h1>
      <p>Il tuo progetto React è pronto!</p>
      
      <div className="counter-card">
        <p className="count">Contatore: {count}</p>
        <div className="buttons">
          <button onClick={decrement} className="btn-danger">-</button>
          <button onClick={reset} className="btn-secondary">Reset</button>
          <button onClick={increment} className="btn-success">+</button>
        </div>
      </div>
    </div>
  );
}

export default App;
`;
		}
	} else {
		if (opts.tailwind) {
			appTsx = `function App() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">${projectName}</h1>
        <p className="text-gray-600">Il tuo progetto React è pronto!</p>
      </div>
    </div>
  );
}

export default App;
`;
		} else {
			appTsx = `function App() {
  return (
    <div className="app">
      <h1>${projectName}</h1>
      <p>Il tuo progetto React è pronto!</p>
    </div>
  );
}

export default App;
`;
		}
	}

	await writeFile(path.join(projectPath, 'src', 'App.tsx'), appTsx);
}

// Genera gli stili CSS
async function generateStyles(projectPath: string, useTailwind: boolean): Promise<void> {
	let indexCss: string;

	if (useTailwind) {
		indexCss = `@import "tailwindcss";
`;
	} else {
		indexCss = `:root {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: #213547;
  background-color: #f5f5f5;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  min-height: 100vh;
}

.app, .home, .about {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

p {
  color: #666;
  margin-bottom: 1rem;
}

/* Layout con React Router */
.layout {
  min-height: 100vh;
}

.nav {
  background: white;
  padding: 1rem 2rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.nav ul {
  display: flex;
  gap: 1.5rem;
  list-style: none;
  max-width: 600px;
  margin: 0 auto;
}

.nav a {
  color: #333;
  text-decoration: none;
  font-weight: 500;
}

.nav a:hover {
  color: #646cff;
}

.main {
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
}

/* Counter con Zustand */
.counter-card {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  margin-top: 2rem;
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

.btn-danger {
  background-color: #ef4444;
}

.btn-danger:hover {
  background-color: #dc2626;
}

.btn-secondary {
  background-color: #6b7280;
}

.btn-secondary:hover {
  background-color: #4b5563;
}

.btn-success {
  background-color: #22c55e;
}

.btn-success:hover {
  background-color: #16a34a;
}
`;
	}

	await writeFile(path.join(projectPath, 'src', 'index.css'), indexCss);
}
