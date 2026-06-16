import {
  parseTeamManifest,
  type TeamManifest
} from "@canvas-mcp-editor/collaboration";

export interface TeamStore {
  listTeams(): Promise<TeamManifest[]>;
  saveTeam(team: TeamManifest): Promise<void>;
  getTeam(teamId: string): Promise<TeamManifest | null>;
  setCurrentTeam(teamId: string): Promise<void>;
  getCurrentTeam(): Promise<TeamManifest | null>;
}

export interface IndexedDbTeamStoreOptions {
  databaseName?: string;
  indexedDB?: IDBFactory;
}

const DEFAULT_DATABASE_NAME = "canvas-mcp-editor-collaboration";
const DATABASE_VERSION = 1;
const TEAMS_STORE = "teams";
const SETTINGS_STORE = "settings";
const CURRENT_TEAM_KEY = "currentTeamId";

export function createIndexedDbTeamStore(options: IndexedDbTeamStoreOptions = {}): TeamStore {
  const idb = options.indexedDB ?? globalThis.indexedDB;
  if (!idb) {
    throw new Error("IndexedDB is not available");
  }
  const databaseName = options.databaseName ?? DEFAULT_DATABASE_NAME;

  const open = () => openDatabase(idb, databaseName);

  return {
    async listTeams() {
      const database = await open();
      try {
        const values = await request<TeamManifest[]>(
          database.transaction(TEAMS_STORE, "readonly").objectStore(TEAMS_STORE).getAll()
        );
        return values.map(parseTeamManifest);
      } finally {
        database.close();
      }
    },
    async saveTeam(team) {
      const database = await open();
      try {
        const transaction = database.transaction(TEAMS_STORE, "readwrite");
        transaction.objectStore(TEAMS_STORE).put(parseTeamManifest(team));
        await transactionDone(transaction);
      } finally {
        database.close();
      }
    },
    async getTeam(teamId) {
      const database = await open();
      try {
        const value = await request<TeamManifest | undefined>(
          database.transaction(TEAMS_STORE, "readonly").objectStore(TEAMS_STORE).get(teamId)
        );
        return value ? parseTeamManifest(value) : null;
      } finally {
        database.close();
      }
    },
    async setCurrentTeam(teamId) {
      const database = await open();
      try {
        const transaction = database.transaction(SETTINGS_STORE, "readwrite");
        transaction.objectStore(SETTINGS_STORE).put(teamId, CURRENT_TEAM_KEY);
        await transactionDone(transaction);
      } finally {
        database.close();
      }
    },
    async getCurrentTeam() {
      const database = await open();
      try {
        const teamId = await request<string | undefined>(
          database
            .transaction(SETTINGS_STORE, "readonly")
            .objectStore(SETTINGS_STORE)
            .get(CURRENT_TEAM_KEY)
        );
        if (!teamId) {
          return null;
        }

        const value = await request<TeamManifest | undefined>(
          database.transaction(TEAMS_STORE, "readonly").objectStore(TEAMS_STORE).get(teamId)
        );
        return value ? parseTeamManifest(value) : null;
      } finally {
        database.close();
      }
    }
  };
}

export function exportTeamManifest(team: TeamManifest): string {
  return JSON.stringify(parseTeamManifest(team), null, 2);
}

export function importTeamManifest(serialized: string): TeamManifest {
  return parseTeamManifest(JSON.parse(serialized));
}

function openDatabase(idb: IDBFactory, databaseName: string): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const openRequest = idb.open(databaseName, DATABASE_VERSION);
    openRequest.onupgradeneeded = () => {
      const database = openRequest.result;
      if (!database.objectStoreNames.contains(TEAMS_STORE)) {
        database.createObjectStore(TEAMS_STORE, { keyPath: "teamId" });
      }
      if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
        database.createObjectStore(SETTINGS_STORE);
      }
    };
    openRequest.onerror = () => reject(openRequest.error);
    openRequest.onsuccess = () => resolve(openRequest.result);
  });
}

function request<T>(input: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    input.onerror = () => reject(input.error);
    input.onsuccess = () => resolve(input.result);
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
    transaction.oncomplete = () => resolve();
  });
}
