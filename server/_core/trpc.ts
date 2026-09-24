import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  // Contas criadas exclusivamente para o Colaborador Anjo não recebem acesso
  // genérico às APIs internas da plataforma. O espaço do Anjo usa rotas próprias,
  // com escopo por processo ativo. Se no futuro o mesmo usuário virar aluno ou
  // gerente, a presença de alunoId/consultorId/role apropriado libera o fluxo normal.
  const isAngelOnly =
    ctx.user.role === "user" &&
    ctx.user.loginMethod === "angel" &&
    !ctx.user.alunoId &&
    !ctx.user.consultorId;
  if (isAngelOnly) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Este acesso é exclusivo do Espaço do Anjo.",
    });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
