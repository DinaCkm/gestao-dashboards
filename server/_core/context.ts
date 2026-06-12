import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";
import { ADMIN_BACKUP_COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
  isImpersonating: boolean;
  adminUser: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;
  let isImpersonating = false;
  let adminUser: User | null = null;

  try {
    user = await sdk.authenticateRequest(opts.req);
  } catch (error) {
    // Authentication is optional for public procedures.
    user = null;
  }

  // Verificar se existe cookie de backup do admin (modo impersonação)
  if (user) {
    try {
      const cookieHeader = opts.req.headers.cookie;
      if (cookieHeader) {
        const cookies = new Map(Object.entries(parseCookieHeader(cookieHeader)));
        const adminBackupToken = cookies.get(ADMIN_BACKUP_COOKIE_NAME);
        if (adminBackupToken) {
          const adminSession = await sdk.verifySession(adminBackupToken);
          if (adminSession) {
            adminUser = await sdk.getUserByOpenId(adminSession.openId) as User | null;
            if (adminUser && (adminUser.role === 'admin' || adminUser.role === 'admin2')) {
              isImpersonating = true;
            }
          }
        }
      }
    } catch (error) {
      // Ignorar erros no cookie de backup
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
    isImpersonating,
    adminUser,
  };
}
