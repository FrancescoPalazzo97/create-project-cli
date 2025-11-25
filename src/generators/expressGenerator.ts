import path from 'node:path';
import { writeFile, writeJsonFile, createDirectory } from '../utils/fileSystem.js';
import { logger } from '../utils/logger.js';
import type { ProjectConfig } from '../types/index.js';

export async function generateExpressProject(config: ProjectConfig): Promise<void> {
  const projectPath = path.resolve(config.directory);
  const opts = config.expressOptions || { database: 'none', docker: false };

  logger.step(1, 6, 'Creazione struttura cartelle...');

  // Crea le directory
  await createDirectory(path.join(projectPath, 'src', 'controllers'));
  await createDirectory(path.join(projectPath, 'src', 'routes'));
  await createDirectory(path.join(projectPath, 'src', 'middlewares'));
  await createDirectory(path.join(projectPath, 'src', 'services'));
  await createDirectory(path.join(projectPath, 'src', 'utils'));
  await createDirectory(path.join(projectPath, 'src', 'types'));
  await createDirectory(path.join(projectPath, 'src', 'config'));

  if (opts.database === 'mongodb') {
    await createDirectory(path.join(projectPath, 'src', 'models'));
  }

  if (opts.database === 'postgresql') {
    await createDirectory(path.join(projectPath, 'prisma'));
  }

  logger.step(2, 6, 'Generazione package.json...');

  const dependencies: Record<string, string> = {
    'express': '^5.1.0',
    'cors': '^2.8.5',
    'helmet': '^8.1.0',
    'dotenv': '^16.5.0',
    'zod': '^3.24.4'
  };

  const devDependencies: Record<string, string> = {
    '@types/express': '^5.0.2',
    '@types/cors': '^2.8.18',
    '@types/node': '^22.15.21',
    'typescript': '^5.8.3',
    'tsx': '^4.19.4',
    'eslint': '^9.27.0',
    '@typescript-eslint/eslint-plugin': '^8.32.1',
    '@typescript-eslint/parser': '^8.32.1'
  };

  const scripts: Record<string, string> = {
    'dev': 'tsx watch src/server.ts',
    'build': 'tsc',
    'start': 'node dist/server.js',
    'lint': 'eslint src/'
  };

  // Aggiungi dipendenze database
  if (opts.database === 'mongodb') {
    dependencies['mongoose'] = '^8.14.1';
  }

  if (opts.database === 'postgresql') {
    dependencies['@prisma/client'] = '^6.6.0';
    devDependencies['prisma'] = '^6.6.0';
    scripts['db:generate'] = 'prisma generate';
    scripts['db:push'] = 'prisma db push';
    scripts['db:migrate'] = 'prisma migrate dev';
    scripts['db:studio'] = 'prisma studio';
  }

  const packageJson = {
    name: config.name,
    version: '0.1.0',
    type: 'module',
    scripts,
    dependencies,
    devDependencies
  };

  await writeJsonFile(path.join(projectPath, 'package.json'), packageJson);

  logger.step(3, 6, 'Generazione file di configurazione...');

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
  let envExample = `# Server
PORT=3000
NODE_ENV=development
`;

  if (opts.database === 'mongodb') {
    envExample += `
# MongoDB
MONGODB_URI=mongodb://localhost:27017/${config.name}
`;
  }

  if (opts.database === 'postgresql') {
    envExample += `
# PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/${config.name}?schema=public"
`;
  }

  await writeFile(path.join(projectPath, '.env.example'), envExample);

  // .env
  let envFile = `PORT=3000
NODE_ENV=development
`;

  if (opts.database === 'mongodb') {
    envFile += `MONGODB_URI=mongodb://localhost:27017/${config.name}
`;
  }

  if (opts.database === 'postgresql') {
    envFile += `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/${config.name}?schema=public"
`;
  }

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

  // Docker Compose (se richiesto)
  if (opts.docker) {
    await generateDockerCompose(projectPath, config.name, opts.database);
  }

  // Prisma schema (se PostgreSQL)
  if (opts.database === 'postgresql') {
    await generatePrismaSchema(projectPath);
  }

  logger.step(4, 6, 'Generazione configurazione database...');

  // src/config/index.ts
  await generateConfigFile(projectPath, opts.database);

  // Database connection
  if (opts.database === 'mongodb') {
    await generateMongooseConnection(projectPath);
  }

  if (opts.database === 'postgresql') {
    await generatePrismaClient(projectPath);
  }

  logger.step(5, 6, 'Generazione file sorgente...');

  // Genera modelli/schema di esempio
  if (opts.database === 'mongodb') {
    await generateMongooseModel(projectPath);
  }

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

  // Controllers e Routes
  await generateControllers(projectPath, opts.database);
  await generateRoutes(projectPath, opts.database);

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
  const serverFile = generateServerFile(opts.database);
  await writeFile(path.join(projectPath, 'src', 'server.ts'), serverFile);

  logger.step(6, 6, 'Generazione README...');

  // README.md
  const readme = generateReadme(config, opts);
  await writeFile(path.join(projectPath, 'README.md'), readme);
}

// Genera docker-compose.yml
async function generateDockerCompose(
  projectPath: string,
  projectName: string,
  database: string
): Promise<void> {
  let dockerCompose: string;

  if (database === 'mongodb') {
    dockerCompose = `version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: ${projectName}-mongodb
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      - MONGO_INITDB_DATABASE=${projectName}

volumes:
  mongodb_data:
`;
  } else {
    dockerCompose = `version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    container_name: ${projectName}-postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=${projectName}

volumes:
  postgres_data:
`;
  }

  await writeFile(path.join(projectPath, 'docker-compose.yml'), dockerCompose);
}

// Genera Prisma schema
async function generatePrismaSchema(projectPath: string): Promise<void> {
  const prismaSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  posts     Post[]
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String?
  published Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
}
`;

  await writeFile(path.join(projectPath, 'prisma', 'schema.prisma'), prismaSchema);
}

// Genera config file
async function generateConfigFile(projectPath: string, database: string): Promise<void> {
  let configFile = `import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
`;

  if (database === 'mongodb') {
    configFile += `  MONGODB_URI: z.string().min(1, 'MONGODB_URI è richiesto'),
`;
  }

  if (database === 'postgresql') {
    configFile += `  DATABASE_URL: z.string().min(1, 'DATABASE_URL è richiesto'),
`;
  }

  configFile += `});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variabili d\\'ambiente non valide:', parsed.error.flatten());
  process.exit(1);
}

export const config = {
  port: parseInt(parsed.data.PORT, 10),
  nodeEnv: parsed.data.NODE_ENV,
  isDev: parsed.data.NODE_ENV === 'development',
`;

  if (database === 'mongodb') {
    configFile += `  mongodbUri: parsed.data.MONGODB_URI,
`;
  }

  if (database === 'postgresql') {
    configFile += `  databaseUrl: parsed.data.DATABASE_URL,
`;
  }

  configFile += `};
`;

  await writeFile(path.join(projectPath, 'src', 'config', 'index.ts'), configFile);
}

// Genera connessione Mongoose
async function generateMongooseConnection(projectPath: string): Promise<void> {
  const dbFile = `import mongoose from 'mongoose';
import { config } from './index.js';

export async function connectDatabase(): Promise<void> {
  try {
    await mongoose.connect(config.mongodbUri);
    console.log('📦 Connesso a MongoDB');
  } catch (error) {
    console.error('❌ Errore connessione MongoDB:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('📦 Disconnesso da MongoDB');
}
`;

  await writeFile(path.join(projectPath, 'src', 'config', 'database.ts'), dbFile);
}

// Genera Prisma client
async function generatePrismaClient(projectPath: string): Promise<void> {
  const prismaClient = `import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('📦 Connesso a PostgreSQL');
  } catch (error) {
    console.error('❌ Errore connessione PostgreSQL:', error);
    process.exit(1);
  }
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log('📦 Disconnesso da PostgreSQL');
}
`;

  await writeFile(path.join(projectPath, 'src', 'config', 'database.ts'), prismaClient);
}

// Genera modello Mongoose
async function generateMongooseModel(projectPath: string): Promise<void> {
  const userModel = `import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    name: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true
  }
);

export const User = mongoose.model<IUser>('User', userSchema);
`;

  await writeFile(path.join(projectPath, 'src', 'models', 'User.ts'), userModel);

  // Index file per i modelli
  const modelsIndex = `export { User } from './User.js';
export type { IUser } from './User.js';
`;

  await writeFile(path.join(projectPath, 'src', 'models', 'index.ts'), modelsIndex);
}

// Genera controllers
async function generateControllers(projectPath: string, database: string): Promise<void> {
  // Health controller (sempre presente)
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

  // User controller (se c'è un database)
  if (database !== 'none') {
    let userController: string;

    if (database === 'mongodb') {
      userController = `import type { Request, Response } from 'express';
import { User } from '../models/index.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { AppError } from '../middlewares/errorHandler.js';

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find().select('-__v');
  
  res.json({
    success: true,
    data: users
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await User.findById(id).select('-__v');
  
  if (!user) {
    throw new AppError(404, 'Utente non trovato');
  }
  
  res.json({
    success: true,
    data: user
  });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, name } = req.body;
  
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(400, 'Email già registrata');
  }
  
  const user = await User.create({ email, name });
  
  res.status(201).json({
    success: true,
    data: user
  });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, name } = req.body;
  
  const user = await User.findByIdAndUpdate(
    id,
    { email, name },
    { new: true, runValidators: true }
  ).select('-__v');
  
  if (!user) {
    throw new AppError(404, 'Utente non trovato');
  }
  
  res.json({
    success: true,
    data: user
  });
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await User.findByIdAndDelete(id);
  
  if (!user) {
    throw new AppError(404, 'Utente non trovato');
  }
  
  res.json({
    success: true,
    data: { message: 'Utente eliminato' }
  });
});
`;
    } else {
      userController = `import type { Request, Response } from 'express';
import { prisma } from '../config/database.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { AppError } from '../middlewares/errorHandler.js';

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany({
    include: { posts: true }
  });
  
  res.json({
    success: true,
    data: users
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: { posts: true }
  });
  
  if (!user) {
    throw new AppError(404, 'Utente non trovato');
  }
  
  res.json({
    success: true,
    data: user
  });
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, name } = req.body;
  
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError(400, 'Email già registrata');
  }
  
  const user = await prisma.user.create({
    data: { email, name }
  });
  
  res.status(201).json({
    success: true,
    data: user
  });
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { email, name } = req.body;
  
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { email, name }
    });
    
    res.json({
      success: true,
      data: user
    });
  } catch {
    throw new AppError(404, 'Utente non trovato');
  }
});

export const deleteUser = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  
  try {
    await prisma.user.delete({ where: { id } });
    
    res.json({
      success: true,
      data: { message: 'Utente eliminato' }
    });
  } catch {
    throw new AppError(404, 'Utente non trovato');
  }
});
`;
    }

    await writeFile(path.join(projectPath, 'src', 'controllers', 'userController.ts'), userController);
  }
}

// Genera routes
async function generateRoutes(projectPath: string, database: string): Promise<void> {
  // Health routes
  const healthRoutes = `import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';

const router = Router();

router.get('/', getHealth);

export default router;
`;

  await writeFile(path.join(projectPath, 'src', 'routes', 'healthRoutes.ts'), healthRoutes);

  // User routes (se c'è un database)
  if (database !== 'none') {
    const userRoutes = `import { Router } from 'express';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} from '../controllers/userController.js';

const router = Router();

router.get('/', getUsers);
router.get('/:id', getUserById);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export default router;
`;

    await writeFile(path.join(projectPath, 'src', 'routes', 'userRoutes.ts'), userRoutes);
  }

  // Index routes
  let routesIndex = `import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
`;

  if (database !== 'none') {
    routesIndex += `import userRoutes from './userRoutes.js';
`;
  }

  routesIndex += `
const router = Router();

router.use('/health', healthRoutes);
`;

  if (database !== 'none') {
    routesIndex += `router.use('/users', userRoutes);
`;
  }

  routesIndex += `
export default router;
`;

  await writeFile(path.join(projectPath, 'src', 'routes', 'index.ts'), routesIndex);
}

// Genera server file
function generateServerFile(database: string): string {
  if (database === 'none') {
    return `import app from './app.js';
import { config } from './config/index.js';

app.listen(config.port, () => {
  console.log(\`🚀 Server avviato su http://localhost:\${config.port}\`);
  console.log(\`📍 Health check: http://localhost:\${config.port}/api/health\`);
});
`;
  }

  return `import app from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';

async function bootstrap() {
  // Connetti al database
  await connectDatabase();
  
  // Avvia il server
  app.listen(config.port, () => {
    console.log(\`🚀 Server avviato su http://localhost:\${config.port}\`);
    console.log(\`📍 Health check: http://localhost:\${config.port}/api/health\`);
    console.log(\`📍 Users API: http://localhost:\${config.port}/api/users\`);
  });
}

bootstrap().catch(console.error);
`;
}

// Genera README
function generateReadme(
  config: ProjectConfig,
  opts: { database: string; docker: boolean }
): string {
  const features = [
    'Express.js 5',
    'TypeScript',
    'Zod (validazione)',
    'Helmet + CORS (sicurezza)'
  ];

  if (opts.database === 'mongodb') {
    features.push('MongoDB + Mongoose');
  }

  if (opts.database === 'postgresql') {
    features.push('PostgreSQL + Prisma');
  }

  if (opts.docker) {
    features.push('Docker Compose');
  }

  let readme = `# ${config.name}

API Express.js + TypeScript creata con Create Project CLI.

## Funzionalità

${features.map(f => `- ${f}`).join('\n')}

## Struttura del progetto

\`\`\`
src/
├── config/        # Configurazione e database
├── controllers/   # Gestori delle richieste
├── middlewares/   # Middleware Express
├── routes/        # Definizione delle route
├── services/      # Logica di business
├── types/         # Tipi TypeScript
├── utils/         # Funzioni di utilità
`;

  if (opts.database === 'mongodb') {
    readme += `├── models/        # Modelli Mongoose
`;
  }

  readme += `├── app.ts         # Configurazione Express
└── server.ts      # Entry point
\`\`\`

## Setup

\`\`\`bash
# Installa le dipendenze
${config.packageManager} install
`;

  if (opts.docker) {
    readme += `
# Avvia il database con Docker
docker-compose up -d
`;
  }

  if (opts.database === 'postgresql') {
    readme += `
# Genera il client Prisma
${config.packageManager} run db:generate

# Esegui le migrazioni
${config.packageManager} run db:push
`;
  }

  readme += `
# Avvia il server
${config.packageManager} run dev
\`\`\`

## Comandi disponibili

\`\`\`bash
# Avvia in modalità sviluppo
${config.packageManager} run dev

# Build per produzione
${config.packageManager} run build

# Avvia la versione compilata
${config.packageManager} start

# Lint del codice
${config.packageManager} run lint
`;

  if (opts.database === 'postgresql') {
    readme += `
# Database (Prisma)
${config.packageManager} run db:generate  # Genera il client
${config.packageManager} run db:push      # Push dello schema
${config.packageManager} run db:migrate   # Crea una migrazione
${config.packageManager} run db:studio    # Apri Prisma Studio
`;
  }

  readme += `\`\`\`

## API Endpoints

- \`GET /api/health\` - Health check
`;

  if (opts.database !== 'none') {
    readme += `- \`GET /api/users\` - Lista utenti
- \`GET /api/users/:id\` - Dettaglio utente
- \`POST /api/users\` - Crea utente
- \`PUT /api/users/:id\` - Aggiorna utente
- \`DELETE /api/users/:id\` - Elimina utente
`;
  }

  return readme;
}