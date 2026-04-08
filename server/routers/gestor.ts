import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";

// Force Railway rebuild v3
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
