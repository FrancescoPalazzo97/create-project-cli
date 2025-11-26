/**
 * Template centralizzato per la generazione di Zustand stores
 *
 * Questo modulo fornisce template per creare store Zustand
 * utilizzabili sia in progetti React che Next.js.
 */

/**
 * Genera un counter store di base con Zustand
 *
 * Questo è lo store di esempio predefinito che dimostra
 * l'uso di Zustand con TypeScript per gestire uno stato semplice.
 *
 * @returns Contenuto del file counterStore.ts
 *
 * @example
 * ```typescript
 * // In reactGenerator.ts o nextGenerator.ts
 * import { generateCounterStore } from '../templates/zustand.js';
 *
 * if (opts.zustand) {
 *   await writeFile(
 *     path.join(projectPath, 'src', 'store', 'counterStore.ts'),
 *     generateCounterStore()
 *   );
 * }
 * ```
 */
export function generateCounterStore(): string {
  return `import { create } from 'zustand';

interface CounterState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useCounterStore = create<CounterState>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 })
}));
`;
}

/**
 * Genera un template generico per uno store Zustand personalizzato
 *
 * @param storeName - Nome dello store (es: 'user', 'cart', 'theme')
 * @param stateInterface - Definizione dell'interfaccia dello state
 * @param initialState - Stato iniziale dello store
 *
 * @returns Contenuto del file store personalizzato
 *
 * @example
 * ```typescript
 * const userStore = generateCustomStore(
 *   'user',
 *   `interface UserState {
 *     user: User | null;
 *     isAuthenticated: boolean;
 *     login: (user: User) => void;
 *     logout: () => void;
 *   }`,
 *   `user: null,
 *   isAuthenticated: false,
 *   login: (user) => set({ user, isAuthenticated: true }),
 *   logout: () => set({ user: null, isAuthenticated: false })`
 * );
 * ```
 */
export function generateCustomStore(
  storeName: string,
  stateInterface: string,
  initialState: string
): string {
  const hookName = `use${storeName.charAt(0).toUpperCase()}${storeName.slice(1)}Store`;

  return `import { create } from 'zustand';

${stateInterface}

export const ${hookName} = create<${storeName.charAt(0).toUpperCase()}${storeName.slice(1)}State>((set) => ({
  ${initialState}
}));
`;
}

/**
 * Template per uno store Zustand con middleware persist
 *
 * Utile per store che devono mantenere lo stato tra le sessioni
 * (es: preferenze utente, tema, carrello)
 *
 * @returns Contenuto del file store con persist middleware
 *
 * @example
 * ```typescript
 * await writeFile(
 *   path.join(projectPath, 'src', 'store', 'themeStore.ts'),
 *   generatePersistedStore()
 * );
 * ```
 */
export function generatePersistedStore(): string {
  return `import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      toggleTheme: () =>
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light'
        }))
    }),
    {
      name: 'theme-storage' // Nome della chiave in localStorage
    }
  )
);
`;
}

/**
 * Template per uno store Zustand con devtools middleware
 *
 * Utile durante lo sviluppo per debugging con Redux DevTools
 *
 * @returns Contenuto del file store con devtools middleware
 */
export function generateStoreWithDevtools(): string {
  return `import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface AppState {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () => set((state) => ({ count: state.count + 1 })),
      decrement: () => set((state) => ({ count: state.count - 1 })),
      reset: () => set({ count: 0 })
    }),
    {
      name: 'AppStore' // Nome visibile in DevTools
    }
  )
);
`;
}

/**
 * Genera un README.md per la cartella store
 * con documentazione sull'uso di Zustand
 *
 * @returns Contenuto del file README.md per la cartella store
 */
export function generateStoreReadme(): string {
  return `# Store Zustand

Questa cartella contiene gli store Zustand per la gestione dello stato dell'applicazione.

## Uso

\`\`\`typescript
import { useCounterStore } from './store/counterStore';

function MyComponent() {
  const { count, increment, decrement, reset } = useCounterStore();

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
\`\`\`

## Documentazione

- [Zustand Docs](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [TypeScript Guide](https://docs.pmnd.rs/zustand/guides/typescript)
- [Middleware](https://docs.pmnd.rs/zustand/integrations/persisting-store-data)
`;
}
