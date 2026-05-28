export class AppError extends Error {
  constructor(
    public status: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, message, details);
export const unauthorized = (message = "Unauthorized") =>
  new AppError(401, message);
export const forbidden = (message = "Forbidden") => new AppError(403, message);
export const notFound = (message = "Not Found") => new AppError(404, message);
export const conflict = (message: string) => new AppError(409, message);
