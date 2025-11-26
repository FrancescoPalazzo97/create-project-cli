import path from 'node:path';
import { writeFile, createDirectory } from '../utils/fileSystem.js';
import type { ProjectConfig, PackageManager } from '../types/index.js';

function getPackageManagerCommands(pm: PackageManager): { install: string; run: string } {
    switch (pm) {
        case 'yarn':
            return { install: 'yarn install --frozen-lockfile', run: 'yarn' };
        case 'pnpm':
            return { install: 'pnpm install --frozen-lockfile', run: 'pnpm' };
        default:
            return { install: 'npm ci', run: 'npm run' };
    }
}

// React CI Workflow
export async function generateReactWorkflow(
    projectPath: string,
    config: ProjectConfig
): Promise<void> {
    const workflowDir = path.join(projectPath, '.github', 'workflows');
    await createDirectory(workflowDir);

    const { install, run } = getPackageManagerCommands(config.packageManager);

    const workflow = `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: '${config.packageManager}'

      - name: Install dependencies
        run: ${install}

      - name: Lint
        run: ${run} lint

      - name: Build
        run: ${run} build
`;

    await writeFile(path.join(workflowDir, 'ci.yml'), workflow);
}

// Next.js CI Workflow
export async function generateNextWorkflow(
    projectPath: string,
    config: ProjectConfig
): Promise<void> {
    const workflowDir = path.join(projectPath, '.github', 'workflows');
    await createDirectory(workflowDir);

    const { install, run } = getPackageManagerCommands(config.packageManager);

    const workflow = `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: '${config.packageManager}'

      - name: Install dependencies
        run: ${install}

      - name: Lint
        run: ${run} lint

      - name: Build
        run: ${run} build
`;

    await writeFile(path.join(workflowDir, 'ci.yml'), workflow);
}

// Astro CI Workflow
export async function generateAstroWorkflow(
    projectPath: string,
    config: ProjectConfig
): Promise<void> {
    const workflowDir = path.join(projectPath, '.github', 'workflows');
    await createDirectory(workflowDir);

    const { install, run } = getPackageManagerCommands(config.packageManager);

    const workflow = `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: '${config.packageManager}'

      - name: Install dependencies
        run: ${install}

      - name: Build
        run: ${run} build
`;

    await writeFile(path.join(workflowDir, 'ci.yml'), workflow);

    // Deploy to GitHub Pages (opzionale per Astro)
    const deployWorkflow = `name: Deploy to GitHub Pages

on:
  push:
    branches: [main, master]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: '${config.packageManager}'

      - name: Install dependencies
        run: ${install}

      - name: Build Astro site
        run: ${run} build

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: \${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
`;

    await writeFile(path.join(workflowDir, 'deploy.yml'), deployWorkflow);
}

// Express CI Workflow
export async function generateExpressWorkflow(
    projectPath: string,
    config: ProjectConfig,
    database: string
): Promise<void> {
    const workflowDir = path.join(projectPath, '.github', 'workflows');
    await createDirectory(workflowDir);

    const { install, run } = getPackageManagerCommands(config.packageManager);

    let workflow = `name: CI

on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  build:
    runs-on: ubuntu-latest
`;

    // Aggiungi servizi database se necessario
    if (database === 'mongodb') {
        workflow += `
    services:
      mongodb:
        image: mongo:7
        ports:
          - 27017:27017
`;
    } else if (database === 'postgresql') {
        workflow += `
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
`;
    }

    workflow += `
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: '${config.packageManager}'

      - name: Install dependencies
        run: ${install}

      - name: Lint
        run: ${run} lint

      - name: Build
        run: ${run} build
`;

    // Aggiungi step per Prisma se PostgreSQL
    if (database === 'postgresql') {
        workflow += `
      - name: Generate Prisma Client
        run: ${run} db:generate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test?schema=public
`;
    }

    await writeFile(path.join(workflowDir, 'ci.yml'), workflow);
}