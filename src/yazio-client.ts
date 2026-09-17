import { Yazio, YazioAuth } from "yazio";
import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

export interface Token {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_in: number;
  // The yazio package stores and checks this timestamp in milliseconds.
  expires_at: number;
}

const PROJECT_ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const TOKEN_PATH = process.env.YAZIO_TOKEN_PATH ?? join(PROJECT_ROOT, ".yazio-token.json");
const API_BASE = "https://yzapi.yazio.com/v15";

function loadCachedToken(): Token | null {
  try {
    const data: Token = JSON.parse(readFileSync(TOKEN_PATH, "utf-8"));
    if (
      typeof data.token_type === "string" &&
      typeof data.access_token === "string" &&
      typeof data.refresh_token === "string" &&
      typeof data.expires_in === "number" &&
      typeof data.expires_at === "number" &&
      data.expires_at > Date.now() + 60_000
    ) {
      return data;
    }
  } catch {}
  return null;
}

function saveCachedToken(token: Token): void {
  writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
}

let authInstance: YazioAuth | null = null;
let clientInstance: Yazio | null = null;
let clientProxy: Yazio | null = null;
let ignoreCachedToken = false;

function hasCredentials(): boolean {
  return !!(process.env.YAZIO_USERNAME && process.env.YAZIO_PASSWORD);
}

function getAuth(): YazioAuth {
  if (authInstance) return authInstance;

  const username = process.env.YAZIO_USERNAME;
  const password = process.env.YAZIO_PASSWORD;
  const accessToken = process.env.YAZIO_ACCESS_TOKEN;
  const refreshToken = process.env.YAZIO_REFRESH_TOKEN;

  let auth: YazioAuth;
  if (username && password) {
    const cached = ignoreCachedToken ? null : loadCachedToken();
    auth = new YazioAuth({
      ...(cached && { token: cached }),
      credentials: { username, password },
      onRefresh: ({ token }: { token: Token }) => {
        ignoreCachedToken = false;
        saveCachedToken(token);
      },
    });
  } else if (accessToken) {
    // The installed yazio package cannot refresh a token-only session.
    // Prefer the configured token so rotating it does not reuse an older cache.
    auth = new YazioAuth({
      token: {
        token_type: "Bearer",
        access_token: accessToken,
        refresh_token: refreshToken ?? "",
        expires_in: 3600,
        expires_at: Date.now() + 3_600_000,
      },
    });
  } else {
    throw new Error(
      "Set either YAZIO_ACCESS_TOKEN or both YAZIO_USERNAME and YAZIO_PASSWORD"
    );
  }

  // The package does not merge concurrent authentication requests. A weekly
  // summary can otherwise issue several simultaneous login requests.
  const authenticate = auth.authenticate;
  let pending: Promise<Token> | null = null;
  auth.authenticate = () => {
    if (!pending) {
      pending = authenticate().finally(() => { pending = null; });
    }
    return pending;
  };

  authInstance = auth;
  return auth;
}

function getRawClient(): Yazio {
  if (!clientInstance) clientInstance = new Yazio(getAuth());
  return clientInstance;
}

export function getClient(): Yazio {
  if (!clientProxy) {
    // Each library method is one API request. Wrap it at this boundary so a
    // rejected token can be replaced without repeating an entire tool action
    // (which might already have written some diary entries).
    clientProxy = new Proxy({} as Yazio, {
      get(_target, service) {
        if (service !== "user" && service !== "products") {
          return Reflect.get(getRawClient(), service);
        }
        return new Proxy({}, {
          get(_serviceTarget, method) {
            const member = Reflect.get(Reflect.get(getRawClient(), service), method);
            if (typeof member !== "function") return member;
            return (...args: unknown[]) => withYazioClientRetry(async (client) => {
              const instance = Reflect.get(client, service);
              return Reflect.apply(Reflect.get(instance, method), instance, args);
            });
          },
        });
      },
    });
  }
  return clientProxy;
}

export async function getYazioToken(): Promise<Token> {
  try {
    return await getAuth().authenticate();
  } catch (error) {
    if (process.env.YAZIO_ACCESS_TOKEN && !hasCredentials()) {
      throw new Error(
        "YAZIO_ACCESS_TOKEN has expired. Replace it or configure YAZIO_USERNAME and YAZIO_PASSWORD for automatic login.",
        { cause: error }
      );
    }
    throw error;
  }
}

function isUnauthorized(error: unknown): boolean {
  return error instanceof Error && /\(401(?:\s|\))/.test(error.message);
}

function invalidateAuth(expected: YazioAuth): void {
  if (authInstance !== expected) return;
  authInstance = null;
  clientInstance = null;
  ignoreCachedToken = true;
  try { unlinkSync(TOKEN_PATH); } catch {}
}

function reauthUnavailable(error: unknown): Error {
  return new Error(
    "Yazio rejected YAZIO_ACCESS_TOKEN (401). Replace it or configure YAZIO_USERNAME and YAZIO_PASSWORD for automatic login.",
    { cause: error }
  );
}

function renewedTokenRejected(error: unknown): Error {
  return new Error(
    "Yazio rejected a freshly issued token (401 Unauthorized). Check the Yazio login and API compatibility.",
    { cause: error }
  );
}

export async function withYazioClientRetry<T>(request: (client: Yazio) => Promise<T>): Promise<T> {
  const auth = getAuth();
  try {
    return await request(getRawClient());
  } catch (error) {
    if (!isUnauthorized(error) || /\/oauth\/token/.test((error as Error).message)) throw error;
    if (!hasCredentials()) throw reauthUnavailable(error);
    invalidateAuth(auth);
    try {
      return await request(getRawClient());
    } catch (retryError) {
      if (isUnauthorized(retryError) && !/\/oauth\/token/.test((retryError as Error).message)) {
        throw renewedTokenRejected(retryError);
      }
      throw retryError;
    }
  }
}

export async function authorizedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const request = async (): Promise<Response> => {
    const token = await getYazioToken();
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token.access_token}`);
    return fetch(`${API_BASE}${path}`, { ...init, headers });
  };

  const auth = getAuth();
  const response = await request();
  if (response.status !== 401) return response;
  if (!hasCredentials()) throw reauthUnavailable(new Error("401 Unauthorized"));
  invalidateAuth(auth);
  const retried = await request();
  if (retried.status === 401) throw renewedTokenRejected(new Error("401 Unauthorized"));
  return retried;
}

export function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
