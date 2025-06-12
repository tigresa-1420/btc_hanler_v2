export class Validation_error extends Error {
  status: number;
  errors: { type: string; message: string }[];

  constructor(errors: { type: string; message: string }[], status = 400) {
    super(errors[0]?.message || "Datos inválidos");
    this.name = "Validation_error";
    this.status = status;
    this.errors = errors;
  }
}
