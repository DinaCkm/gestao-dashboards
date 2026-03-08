import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createUserContext(userId: number = 2): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("notifications", () => {
  it("admin can create a notification", async () => {
    const adminCtx = createAdminContext();
    const caller = appRouter.createCaller(adminCtx);

    const result = await caller.notifications.create({
      userId: 2,
      title: "Test Notification",
      message: "This is a test notification",
      type: "info",
      category: "sistema",
    });

    expect(result).toHaveProperty("success", true);
    expect(result).toHaveProperty("id");
  });

  it("user can list their notifications", async () => {
    const userCtx = createUserContext(2);
    const caller = appRouter.createCaller(userCtx);

    const notifications = await caller.notifications.list({ limit: 10 });
    expect(Array.isArray(notifications)).toBe(true);
  });

  it("user can get unread count", async () => {
    const userCtx = createUserContext(2);
    const caller = appRouter.createCaller(userCtx);

    const count = await caller.notifications.unreadCount();
    expect(typeof count).toBe("number");
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("user can mark all notifications as read", async () => {
    const userCtx = createUserContext(2);
    const caller = appRouter.createCaller(userCtx);

    const result = await caller.notifications.markAllRead();
    expect(result).toEqual({ success: true });
  });

  it("non-admin cannot create notifications", async () => {
    const userCtx = createUserContext(2);
    const caller = appRouter.createCaller(userCtx);

    await expect(
      caller.notifications.create({
        userId: 1,
        title: "Hack",
        message: "Should fail",
      })
    ).rejects.toThrow();
  });
});
