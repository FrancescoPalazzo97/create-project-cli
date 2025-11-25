import path from 'node:path';
import { writeFile, writeJsonFile, createDirectory, logger } from '../utils';
import type { ProjectConfig } from '../types/index.js';

export async function generateExpressProject(config: ProjectConfig): Promise<void> {
    const projectPath = path.resolve(config.directory);

    logger.step(1, 5, 'Creazione struttura cartelle...');

    // Crea le directory
    await createDirectory(path.join(projectPath, 'src', 'controllers'));
    await createDirectory(path.join(projectPath, 'src', 'routes'));
    await createDirectory(path.join(projectPath, 'src', 'middlewares'));
    await createDirectory(path.join(projectPath, 'src', 'services'));
    await createDirectory(path.join(projectPath, 'src', 'utils'));
    await createDirectory(path.join(projectPath, 'src', 'types'));
    await createDirectory(path.join(projectPath, 'src', 'config'));

    logger.step(2, 5, 'Generazione package.json...');

    const packageJson = {
        name: config.name,
        version: '0.1.0',
        type: 'module',
        scripts: {
            dev: 'tsx watch src/server.ts',
            build: 'tsc',
            start: 'node dist/server.js',
            lint: 'eslint src/'
        },
        dependencies: {
            express: '^5.1.0',
            cors: '^2.8.5',
            helmet: '^8.1.0',
            dotenv: '^16.5.0',
            zod: '^3.24.4'
        },
        devDependencies: {
            '@types/express': '^5.0.2',
            '@types/cors': '^2.8.18',
            '@types/node': '^22.15.21',
            typescript: '^5.8.3',
            tsx: '^4.19.4',
            eslint: '^9.27.0',
            '@typescript-eslint/eslint-plugin': '^8.32.1',
            '@typescript-eslint/parser': '^8.32.1'
        }
    };

    await writeJsonFile(path.join(projectPath, 'package.json'), packageJson);

    logger.step(3, 5, 'Generazione file di configurazione...');

    // tsconfig.json
    const tsconfig = {
        compilerOptions: {
            target: 'ES2022',
            module: 'ESNext',
            moduleResolution: 'bundler',
            strict: true,
            esModuleInterop: true,
            skipLibCheck: true,
            outDir: './dist',
            rootDir: './src',
            declaration: true,
            resolveJsonModule: true
        },
        include: ['src/**/*'],
        exclude: ['node_modules', 'dist']
    };

    await writeJsonFile(path.join(projectPath, 'tsconfig.json'), tsconfig);

    // .env.example
    const envExample = `# Server
PORT=3000
NODE_ENV=development

# Database (esempio)
# DATABASE_URL=mongodb://localhost:27017/mydb
`;

    await writeFile(path.join(projectPath, '.env.example'), envExample);

    // .env
    const envFile = `PORT=3000
NODE_ENV=development
`;

    await writeFile(path.join(projectPath, '.env'), envFile);

    // .gitignore
    const gitignore = `# Dependencies
node_modules

# Build
dist

# Environment
.env
.env.local
.env.*.local

# Logs
*.log
npm-debug.log*

# OS
.DS_Store

# Editor
.vscode/*
.idea
`;

    await writeFile(path.join(projectPath, '.gitignore'), gitignore);

    logger.step(4, 5, 'Generazione file sorgente...');

    // src/config/index.ts
    const configFile = `import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variabili d\\'ambiente non valide:', parsed.error.flatten());
  process.exit(1);
}

export const config = {
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  isDev: parsed.data.NODE_ENV === 'development'
};
`;

    await writeFile(path.join(projectPath, 'src', 'config', 'index.ts'), configFile);

    // src/types/index.ts
    const typesFile = `import type { Request, Response, NextFunction } from 'express';

export type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<void>;

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
`;

    await writeFile(path.join(projectPath, 'src', 'types', 'index.ts'), typesFile);

    // src/middlewares/errorHandler.ts
    const errorHandler = `import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
    return;
  }

  console.error('Errore non gestito:', err);

  res.status(500).json({
    success: false,
    error: config.isDev ? err.message : 'Errore interno del server'
  });
}
`;

    await writeFile(path.join(projectPath, 'src', 'middlewares', 'errorHandler.ts'), errorHandler);

    // src/middlewares/asyncHandler.ts
    const asyncHandler = `import type { Request, Response, NextFunction } from 'express';
import type { AsyncHandler } from '../types/index.js';

export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
`;

    await writeFile(path.join(projectPath, 'src', 'middlewares', 'asyncHandler.ts'), asyncHandler);

    // src/controllers/healthController.ts
    const healthController = `import type { Request, Response } from 'express';

export function getHealth(_req: Request, res: Response): void {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString()
    }
  });
}
`;

    await writeFile(path.join(projectPath, 'src', 'controllers', 'healthController.ts'), healthController);

    // src/routes/healthRoutes.ts
    const healthRoutes = `import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';

const router = Router();

router.get('/', getHealth);

export default router;
`;

    await writeFile(path.join(projectPath, 'src', 'routes', 'healthRoutes.ts'), healthRoutes);

    // src/routes/index.ts
    const routesIndex = `import { Router } from 'express';
import healthRoutes from './healthRoutes.js';

const router = Router();

router.use('/health', healthRoutes);

export default router;
`;

    await writeFile(path.join(projectPath, 'src', 'routes', 'index.ts'), routesIndex);

    // src/app.ts
    const appFile = `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Middlewares di sicurezza
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Error handler (deve essere l'ultimo middleware)
app.use(errorHandler);

export default app;
`;

    await writeFile(path.join(projectPath, 'src', 'app.ts'), appFile);

    // src/server.ts
    const serverFile = `import app from './app.js';
import { config } from './config/index.js';

app.listen(config.port, () => {
  console.log(\`🚀 Server avviato su http://localhost:\${config.port}\`);
  console.log(\`📍 Health check: http://localhost:\${config.port}/api/health\`);
});
`;

    await writeFile(path.join(projectPath, 'src', 'server.ts'), serverFile);

    logger.step(5, 5, 'Generazione README...');

    // README.md
    const readme = `# ${config.name}

API Express.js + TypeScript creata con Create Project CLI.

## Struttura del progetto

\`\`\`
src/
├── config/        # Configurazione e variabili d'ambiente
├── controllers/   # Gestori delle richieste
├── middlewares/   # Middleware Express
├── routes/        # Definizione delle route
├── services/      # Logica di business
├── types/         # Tipi TypeScript
├── utils/         # Funzioni di utilità
├── app.ts         # Configurazione Express
└── server.ts      # Entry point
\`\`\`

## Comandi disponibili

\`\`\`bash
# Avvia in modalità sviluppo (con hot reload)
${config.packageManager} run dev

# Build per produzione
${config.packageManager} run build

# Avvia la versione compilata
${config.packageManager} start

# Lint del codice
${config.packageManager} run lint
\`\`\`

## API Endpoints

- \`GET /api/health\` - Health check
`;

    await writeFile(path.join(projectPath, 'README.md'), readme);
}