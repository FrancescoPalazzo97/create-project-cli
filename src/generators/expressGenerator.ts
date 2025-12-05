import path from 'node:path';
import { writeFile, writeJsonFile, createDirectory } from '../utils/fileSystem.js';
import { logger } from '../utils/logger.js';
import type { ProjectConfig, ExpressOptions } from '../types/index.js';
import { generateExpressWorkflow } from './githubActionsGenerator.js';
import { gitignorePresets } from '../templates/gitignore.js';
import {
	generateReadme as generateReadmeTemplate,
	commonCommands,
	projectStructureSections,
	type ReadmeSection,
} from '../templates/readme.js';

export async function generateExpressProject(config: ProjectConfig): Promise<void> {
	const projectPath = path.resolve(config.directory);
	const opts: ExpressOptions = config.expressOptions || {
		database: 'none',
		authentication: false,
		swagger: false,
		docker: false,
		githubActions: false,
	};

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

	await generatePackageJson(projectPath, config.name, opts);

	logger.step(3, 6, 'Generazione file di configurazione...');

	await generateConfigFiles(projectPath, config.name, opts);

	logger.step(4, 6, 'Generazione configurazione database...');

	await generateDatabaseConfig(projectPath, opts);

	logger.step(5, 6, 'Generazione file sorgente...');

	await generateSourceFiles(projectPath, config.name, config, opts);

	logger.step(6, 6, 'Generazione README...');

	await generateReadme(projectPath, config, opts);
}

// ============================================
// PACKAGE.JSON
// ============================================

async function generatePackageJson(
	projectPath: string,
	projectName: string,
	opts: ExpressOptions
): Promise<void> {
	const dependencies: Record<string, string> = {
		express: '^5.1.0',
		cors: '^2.8.5',
		helmet: '^8.1.0',
		dotenv: '^16.5.0',
		zod: '^3.24.4',
	};

	const devDependencies: Record<string, string> = {
		'@types/express': '^5.0.2',
		'@types/cors': '^2.8.18',
		'@types/node': '^22.15.21',
		typescript: '^5.8.3',
		tsx: '^4.19.4',
		eslint: '^9.27.0',
		'@typescript-eslint/eslint-plugin': '^8.32.1',
		'@typescript-eslint/parser': '^8.32.1',
	};

	const scripts: Record<string, string> = {
		dev: 'tsx watch src/server.ts',
		build: 'tsc',
		start: 'node dist/server.js',
		lint: 'eslint src/',
	};

	// Database dependencies
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

	// Authentication dependencies
	if (opts.authentication) {
		dependencies['bcrypt'] = '^5.1.1';
		dependencies['jsonwebtoken'] = '^9.0.2';
		devDependencies['@types/bcrypt'] = '^5.0.2';
		devDependencies['@types/jsonwebtoken'] = '^9.0.9';
	}

	// Swagger dependencies
	if (opts.swagger) {
		dependencies['swagger-ui-express'] = '^5.0.1';
		dependencies['swagger-jsdoc'] = '^6.2.8';
		devDependencies['@types/swagger-ui-express'] = '^4.1.8';
		devDependencies['@types/swagger-jsdoc'] = '^6.0.4';
	}

	const packageJson = {
		name: projectName,
		version: '0.1.0',
		type: 'module',
		scripts,
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
	opts: ExpressOptions
): Promise<void> {
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
			resolveJsonModule: true,
		},
		include: ['src/**/*'],
		exclude: ['node_modules', 'dist'],
	};

	await writeJsonFile(path.join(projectPath, 'tsconfig.json'), tsconfig);

	// .env.example e .env
	let envContent = `# Server
PORT=3000
NODE_ENV=development
`;

	if (opts.database === 'mongodb') {
		envContent += `
# MongoDB
MONGODB_URI=mongodb://localhost:27017/${projectName}
`;
	}

	if (opts.database === 'postgresql') {
		envContent += `
# PostgreSQL
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/${projectName}?schema=public"
`;
	}

	if (opts.authentication) {
		envContent += `
# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
`;
	}

	await writeFile(path.join(projectPath, '.env.example'), envContent);
	await writeFile(path.join(projectPath, '.env'), envContent);

	// .gitignore
	await writeFile(path.join(projectPath, '.gitignore'), gitignorePresets.express());

	// Docker Compose
	if (opts.docker) {
		await generateDockerCompose(projectPath, projectName, opts.database);
	}

	// Prisma schema
	if (opts.database === 'postgresql') {
		await generatePrismaSchema(projectPath, opts.authentication);
	}
}

async function generateDockerCompose(
	projectPath: string,
	projectName: string,
	database: string
): Promise<void> {
	let dockerCompose: string;

	if (database === 'mongodb') {
		dockerCompose = `services:
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
		dockerCompose = `services:
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

async function generatePrismaSchema(projectPath: string, withAuth: boolean): Promise<void> {
	let prismaSchema = `generator client {
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
`;

	if (withAuth) {
		prismaSchema += `  password  String
`;
	}

	prismaSchema += `  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;

	await writeFile(path.join(projectPath, 'prisma', 'schema.prisma'), prismaSchema);
}

// ============================================
// DATABASE CONFIG
// ============================================

async function generateDatabaseConfig(projectPath: string, opts: ExpressOptions): Promise<void> {
	// src/config/index.ts
	let configFile = `import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
`;

	if (opts.database === 'mongodb') {
		configFile += `  MONGODB_URI: z.string().min(1, 'MONGODB_URI è richiesto'),
`;
	}

	if (opts.database === 'postgresql') {
		configFile += `  DATABASE_URL: z.string().min(1, 'DATABASE_URL è richiesto'),
`;
	}

	if (opts.authentication) {
		configFile += `  JWT_SECRET: z.string().min(1, 'JWT_SECRET è richiesto'),
  JWT_EXPIRES_IN: z.string().default('7d'),
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

	if (opts.database === 'mongodb') {
		configFile += `  mongodbUri: parsed.data.MONGODB_URI,
`;
	}

	if (opts.database === 'postgresql') {
		configFile += `  databaseUrl: parsed.data.DATABASE_URL,
`;
	}

	if (opts.authentication) {
		configFile += `  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
`;
	}

	configFile += `};
`;

	await writeFile(path.join(projectPath, 'src', 'config', 'index.ts'), configFile);

	// Database connection file
	if (opts.database === 'mongodb') {
		const mongoConnection = `import mongoose from 'mongoose';
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

		await writeFile(path.join(projectPath, 'src', 'config', 'database.ts'), mongoConnection);
	}

	if (opts.database === 'postgresql') {
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
}

// ============================================
// SWAGGER CONFIG
// ============================================

async function generateSwaggerConfig(
	projectPath: string,
	projectName: string,
	opts: ExpressOptions
): Promise<void> {
	const swaggerConfig = `import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '${projectName} API',
      version: '1.0.0',
      description: 'API documentation for ${projectName}',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
${
	opts.authentication
		? `    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },`
		: ''
}
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
`;

	await writeFile(path.join(projectPath, 'src', 'config', 'swagger.ts'), swaggerConfig);
}

// ============================================
// SOURCE FILES
// ============================================

async function generateSourceFiles(
	projectPath: string,
	projectName: string,
	config: ProjectConfig,
	opts: ExpressOptions
): Promise<void> {
	// Types
	await generateTypes(projectPath, opts.authentication);

	// Middlewares
	await generateMiddlewares(projectPath, opts.authentication);

	// Models (MongoDB only)
	if (opts.database === 'mongodb') {
		await generateMongooseModels(projectPath, opts.authentication);
	}

	// Swagger config
	if (opts.swagger) {
		await generateSwaggerConfig(projectPath, projectName, opts);
	}

	// Controllers
	await generateControllers(projectPath, opts);

	// Routes
	await generateRoutes(projectPath, opts);

	// GitHub Actions
	if (opts.githubActions) {
		await generateExpressWorkflow(projectPath, config, opts.database);
	}

	// App
	await generateApp(projectPath, opts);

	// Server
	await generateServer(projectPath, opts);
}

async function generateTypes(projectPath: string, withAuth: boolean): Promise<void> {
	let typesFile = `import type { Request, Response, NextFunction } from 'express';

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

	if (withAuth) {
		typesFile += `
export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}
`;
	}

	await writeFile(path.join(projectPath, 'src', 'types', 'index.ts'), typesFile);
}

async function generateMiddlewares(projectPath: string, withAuth: boolean): Promise<void> {
	// Error handler
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

	// Async handler
	const asyncHandler = `import type { Request, Response, NextFunction } from 'express';
import type { AsyncHandler } from '../types/index.js';

export function asyncHandler(fn: AsyncHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
`;

	await writeFile(path.join(projectPath, 'src', 'middlewares', 'asyncHandler.ts'), asyncHandler);

	// Auth middleware
	if (withAuth) {
		const authMiddleware = `import type { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { AppError } from './errorHandler.js';
import type { AuthRequest, JwtPayload } from '../types/index.js';

export function authenticate(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new AppError(401, 'Token non fornito');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    throw new AppError(401, 'Token non valido o scaduto');
  }
}
`;

		await writeFile(path.join(projectPath, 'src', 'middlewares', 'auth.ts'), authMiddleware);
	}
}

async function generateMongooseModels(projectPath: string, withAuth: boolean): Promise<void> {
	let userModel = `import mongoose, { Schema, Document } from 'mongoose';
`;

	if (withAuth) {
		userModel += `import bcrypt from 'bcrypt';
`;
	}

	userModel += `
export interface IUser extends Document {
  email: string;
  name?: string;
`;

	if (withAuth) {
		userModel += `  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
`;
	}

	userModel += `  createdAt: Date;
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
    }`;

	if (withAuth) {
		userModel += `,
    password: {
      type: String,
      required: true,
      minlength: 6
    }`;
	}

	userModel += `
  },
  {
    timestamps: true
  }
);
`;

	if (withAuth) {
		userModel += `
// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};
`;
	}

	userModel += `
export const User = mongoose.model<IUser>('User', userSchema);
`;

	await writeFile(path.join(projectPath, 'src', 'models', 'User.ts'), userModel);

	// Models index
	const modelsIndex = `export { User } from './User.js';
export type { IUser } from './User.js';
`;

	await writeFile(path.join(projectPath, 'src', 'models', 'index.ts'), modelsIndex);
}

async function generateControllers(projectPath: string, opts: ExpressOptions): Promise<void> {
	// Health controller
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

	await writeFile(
		path.join(projectPath, 'src', 'controllers', 'healthController.ts'),
		healthController
	);

	// Auth controller
	if (opts.authentication) {
		await generateAuthController(projectPath, opts.database);
	}

	// User controller
	if (opts.database !== 'none') {
		await generateUserController(projectPath, opts);
	}
}

async function generateAuthController(projectPath: string, database: string): Promise<void> {
	let authController: string;

	if (database === 'mongodb') {
		authController = `import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';
import { config } from '../config/index.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { AppError } from '../middlewares/errorHandler.js';
import type { AuthRequest } from '../types/index.js';

// Genera JWT token
function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  // Validazione base
  if (!email || !password) {
    throw new AppError(400, 'Email e password sono richiesti');
  }

  if (password.length < 6) {
    throw new AppError(400, 'La password deve avere almeno 6 caratteri');
  }

  // Verifica se l'utente esiste già
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new AppError(400, 'Email già registrata');
  }

  // Crea l'utente
  const user = await User.create({ email, password, name });

  // Genera token
  const token = generateToken(user._id.toString(), user.email);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      token
    }
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validazione base
  if (!email || !password) {
    throw new AppError(400, 'Email e password sono richiesti');
  }

  // Trova l'utente
  const user = await User.findOne({ email });
  if (!user) {
    throw new AppError(401, 'Credenziali non valide');
  }

  // Verifica password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError(401, 'Credenziali non valide');
  }

  // Genera token
  const token = generateToken(user._id.toString(), user.email);

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      token
    }
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user?.userId).select('-password');

  if (!user) {
    throw new AppError(404, 'Utente non trovato');
  }

  res.json({
    success: true,
    data: {
      id: user._id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt
    }
  });
});
`;
	} else {
		// PostgreSQL / Prisma
		authController = `import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { prisma } from '../config/database.js';
import { config } from '../config/index.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { AppError } from '../middlewares/errorHandler.js';
import type { AuthRequest } from '../types/index.js';

// Genera JWT token
function generateToken(userId: string, email: string): string {
  return jwt.sign(
    { userId, email },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

// POST /api/auth/register
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, name } = req.body;

  // Validazione base
  if (!email || !password) {
    throw new AppError(400, 'Email e password sono richiesti');
  }

  if (password.length < 6) {
    throw new AppError(400, 'La password deve avere almeno 6 caratteri');
  }

  // Verifica se l'utente esiste già
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError(400, 'Email già registrata');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Crea l'utente
  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name }
  });

  // Genera token
  const token = generateToken(user.id, user.email);

  res.status(201).json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    }
  });
});

// POST /api/auth/login
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Validazione base
  if (!email || !password) {
    throw new AppError(400, 'Email e password sono richiesti');
  }

  // Trova l'utente
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    throw new AppError(401, 'Credenziali non valide');
  }

  // Verifica password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError(401, 'Credenziali non valide');
  }

  // Genera token
  const token = generateToken(user.id, user.email);

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    }
  });
});

// GET /api/auth/me
export const getMe = asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user?.userId },
    select: { id: true, email: true, name: true, createdAt: true }
  });

  if (!user) {
    throw new AppError(404, 'Utente non trovato');
  }

  res.json({
    success: true,
    data: user
  });
});
`;
	}

	await writeFile(
		path.join(projectPath, 'src', 'controllers', 'authController.ts'),
		authController
	);
}

async function generateUserController(projectPath: string, opts: ExpressOptions): Promise<void> {
	let userController: string;

	if (opts.database === 'mongodb') {
		userController = `import type { Request, Response } from 'express';
import { User } from '../models/index.js';
import { asyncHandler } from '../middlewares/asyncHandler.js';
import { AppError } from '../middlewares/errorHandler.js';

export const getUsers = asyncHandler(async (_req: Request, res: Response) => {
  const users = await User.find().select('-password -__v');
  
  res.json({
    success: true,
    data: users
  });
});

export const getUserById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await User.findById(id).select('-password -__v');
  
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
    select: { id: true, email: true, name: true, createdAt: true }
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
    select: { id: true, email: true, name: true, createdAt: true }
  });
  
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

	await writeFile(
		path.join(projectPath, 'src', 'controllers', 'userController.ts'),
		userController
	);
}

async function generateRoutes(projectPath: string, opts: ExpressOptions): Promise<void> {
	// Health routes
	let healthRoutes = `import { Router } from 'express';
import { getHealth } from '../controllers/healthController.js';

const router = Router();

`;

	if (opts.swagger) {
		healthRoutes += `/**
 * @swagger
 * /api/health:
 *   get:
 *     summary: Health check
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     timestamp:
 *                       type: string
 */
`;
	}

	healthRoutes += `router.get('/', getHealth);

export default router;
`;

	await writeFile(path.join(projectPath, 'src', 'routes', 'healthRoutes.ts'), healthRoutes);

	// Auth routes
	if (opts.authentication) {
		let authRoutes = `import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

`;

		if (opts.swagger) {
			authRoutes += `/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *         email:
 *           type: string
 *         name:
 *           type: string
 *         createdAt:
 *           type: string
 *     AuthResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             user:
 *               $ref: '#/components/schemas/User'
 *             token:
 *               type: string
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Registra un nuovo utente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: Utente registrato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Dati non validi o email già registrata
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login utente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login effettuato con successo
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       401:
 *         description: Credenziali non valide
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Ottieni profilo utente corrente
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profilo utente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Token non valido o mancante
 */
router.get('/me', authenticate, getMe);

export default router;
`;
		} else {
			authRoutes += `router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, getMe);

export default router;
`;
		}

		await writeFile(path.join(projectPath, 'src', 'routes', 'authRoutes.ts'), authRoutes);
	}

	// User routes
	if (opts.database !== 'none') {
		let userRoutes = `import { Router } from 'express';
import { getUsers, getUserById, deleteUser } from '../controllers/userController.js';
`;

		if (opts.authentication) {
			userRoutes += `import { authenticate } from '../middlewares/auth.js';
`;
		}

		userRoutes += `
const router = Router();

`;

		if (opts.authentication) {
			userRoutes += `// Tutte le route richiedono autenticazione
router.use(authenticate);

`;
		}

		if (opts.swagger) {
			userRoutes += `/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Ottieni lista utenti
 *     tags: [Users]
${
	opts.authentication
		? `*     security:
 *       - bearerAuth: []`
		: ''
}
 *     responses:
 *       200:
 *         description: Lista degli utenti
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 */
router.get('/', getUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Ottieni utente per ID
 *     tags: [Users]
${
	opts.authentication
		? `*     security:
 *       - bearerAuth: []`
		: ''
}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'utente
 *     responses:
 *       200:
 *         description: Dettaglio utente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       404:
 *         description: Utente non trovato
 */
router.get('/:id', getUserById);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Elimina utente
 *     tags: [Users]
${
	opts.authentication
		? `*     security:
 *       - bearerAuth: []`
		: ''
}
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID dell'utente
 *     responses:
 *       200:
 *         description: Utente eliminato
 *       404:
 *         description: Utente non trovato
 */
router.delete('/:id', deleteUser);

export default router;
`;
		} else {
			userRoutes += `router.get('/', getUsers);
router.get('/:id', getUserById);
router.delete('/:id', deleteUser);

export default router;
`;
		}

		await writeFile(path.join(projectPath, 'src', 'routes', 'userRoutes.ts'), userRoutes);
	}

	// Routes index
	let routesIndex = `import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
`;

	if (opts.authentication) {
		routesIndex += `import authRoutes from './authRoutes.js';
`;
	}

	if (opts.database !== 'none') {
		routesIndex += `import userRoutes from './userRoutes.js';
`;
	}

	routesIndex += `
const router = Router();

router.use('/health', healthRoutes);
`;

	if (opts.authentication) {
		routesIndex += `router.use('/auth', authRoutes);
`;
	}

	if (opts.database !== 'none') {
		routesIndex += `router.use('/users', userRoutes);
`;
	}

	routesIndex += `
export default router;
`;

	await writeFile(path.join(projectPath, 'src', 'routes', 'index.ts'), routesIndex);
}

async function generateApp(projectPath: string, opts: ExpressOptions): Promise<void> {
	let appFile = `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
`;

	if (opts.swagger) {
		appFile += `import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';
`;
	}

	appFile += `import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

const app = express();

// Middlewares di sicurezza
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
`;

	if (opts.swagger) {
		appFile += `
// Swagger documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
`;
	}

	appFile += `
// Routes
app.use('/api', routes);

// Error handler (deve essere l'ultimo middleware)
app.use(errorHandler);

export default app;
`;

	await writeFile(path.join(projectPath, 'src', 'app.ts'), appFile);
}

async function generateServer(projectPath: string, opts: ExpressOptions): Promise<void> {
	let serverFile: string;

	if (opts.database === 'none') {
		serverFile = `import app from './app.js';
import { config } from './config/index.js';

app.listen(config.port, () => {
  console.log(\`🚀 Server avviato su http://localhost:\${config.port}\`);
  console.log(\`📍 Health check: http://localhost:\${config.port}/api/health\`);
${opts.swagger ? `  console.log(\`📚 Swagger docs: http://localhost:\${config.port}/api/docs\`);` : ''}
});
`;
	} else {
		serverFile = `import app from './app.js';
import { config } from './config/index.js';
import { connectDatabase } from './config/database.js';

async function bootstrap() {
  await connectDatabase();
  
  app.listen(config.port, () => {
    console.log(\`🚀 Server avviato su http://localhost:\${config.port}\`);
    console.log(\`📍 Health check: http://localhost:\${config.port}/api/health\`);
${opts.authentication ? `    console.log(\`🔐 Auth API: http://localhost:\${config.port}/api/auth\`);` : ''}
    console.log(\`👥 Users API: http://localhost:\${config.port}/api/users\`);
${opts.swagger ? `    console.log(\`📚 Swagger docs: http://localhost:\${config.port}/api/docs\`);` : ''}
  });
}

bootstrap().catch(console.error);
`;
	}

	await writeFile(path.join(projectPath, 'src', 'server.ts'), serverFile);
}

// ============================================
// README
// ============================================

async function generateReadme(
	projectPath: string,
	config: ProjectConfig,
	opts: ExpressOptions
): Promise<void> {
	const features = ['Express.js 5', 'TypeScript', 'Zod (validazione)', 'Helmet + CORS (sicurezza)'];

	if (opts.database === 'mongodb') features.push('MongoDB + Mongoose');
	if (opts.database === 'postgresql') features.push('PostgreSQL + Prisma');
	if (opts.authentication) features.push('Autenticazione JWT');
	if (opts.docker) features.push('Docker Compose');
	if (opts.swagger) features.push('Swagger/OpenAPI');
	if (opts.githubActions) features.push('GitHub Actions CI/CD');

	// Costruisce le sezioni custom
	const sections: ReadmeSection[] = [];

	// Sezione struttura del progetto
	sections.push(
		projectStructureSections.express({
			database: opts.database !== 'none',
			auth: opts.authentication,
		})
	);

	// Sezione Setup
	let setupContent = `\`\`\`bash
# Installa le dipendenze
${config.packageManager} install
`;

	if (opts.docker) {
		setupContent += `
# Avvia il database con Docker
docker-compose up -d
`;
	}

	if (opts.database === 'postgresql') {
		setupContent += `
# Genera il client Prisma
${config.packageManager} run db:generate

# Push dello schema
${config.packageManager} run db:push
`;
	}

	setupContent += `
# Avvia il server
${config.packageManager} run dev
\`\`\``;

	sections.push({ title: 'Setup', content: setupContent });

	// Sezione API Endpoints
	let endpointsContent = `### Health
- \`GET /api/health\` - Health check
`;

	if (opts.authentication) {
		endpointsContent += `
### Autenticazione
- \`POST /api/auth/register\` - Registrazione
- \`POST /api/auth/login\` - Login
- \`GET /api/auth/me\` - Profilo utente (richiede token)
`;
	}

	if (opts.database !== 'none') {
		endpointsContent += `
### Utenti${opts.authentication ? ' (richiede token)' : ''}
- \`GET /api/users\` - Lista utenti
- \`GET /api/users/:id\` - Dettaglio utente
- \`DELETE /api/users/:id\` - Elimina utente
`;
	}

	sections.push({ title: 'API Endpoints', content: endpointsContent });

	// Sezione Documentazione API (se Swagger)
	if (opts.swagger) {
		sections.push({
			title: 'Documentazione API',
			content: `La documentazione interattiva delle API è disponibile su:
\`\`\`
http://localhost:3000/api/docs
\`\`\``,
		});
	}

	// Sezione Autenticazione (se JWT)
	if (opts.authentication) {
		sections.push({
			title: 'Autenticazione',
			content: `### Registrazione
\`\`\`bash
curl -X POST http://localhost:3000/api/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{"email": "test@example.com", "password": "password123", "name": "Test User"}'
\`\`\`

### Login
\`\`\`bash
curl -X POST http://localhost:3000/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "test@example.com", "password": "password123"}'
\`\`\`

### Accesso a route protette
\`\`\`bash
curl http://localhost:3000/api/auth/me \\
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
\`\`\``,
		});
	}

	const readme = generateReadmeTemplate({
		projectName: config.name,
		description: 'API Express.js + TypeScript creata con Create Project CLI.',
		features,
		packageManager: config.packageManager,
		commands: commonCommands.express(config.packageManager, opts.database === 'postgresql'),
		sections,
	});

	await writeFile(path.join(projectPath, 'README.md'), readme);
}
