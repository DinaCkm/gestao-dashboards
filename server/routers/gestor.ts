import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

export const gestorRouter = router({
  teamStats: protectedProcedure
    .input(z.object({}))
    .query(async () => {
      return {
        totalColaboradores: 0,
        totalMentorias: 0,
        totalCompetencias: 0,
        principaisCompetencias: [],
      };
    }),
});
