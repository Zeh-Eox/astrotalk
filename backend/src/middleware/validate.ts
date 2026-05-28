import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

type Source = "body" | "params" | "query";

export const validate =
  (schema: ZodSchema, source: Source = "body") =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      }));

      res.status(400).json({
        success: false,
        message: "Validation error",
        errors,
      });
      return;
    }

    (req as Request & Record<Source, unknown>)[source] = result.data;
    next();
  };
