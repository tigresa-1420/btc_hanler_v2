import prisma from "../prisma/client";
import { generate_random_code } from "../util/generate_random_code";

interface Generate_unique_code_option {
  model: keyof typeof prisma;
  field: string;
  length?: number;
  maxRetries?: number;
}

export async function generate_unique_code<
  T extends Generate_unique_code_option
>({ model, field, length = 8, maxRetries = 5 }: T): Promise<string> {
  const prismaModel = prisma[model];

  if (!prismaModel) {
    throw new Error(`Invalid Prisma model: ${String(model)}`);
  }

  let attempt = 0;

  while (attempt < maxRetries) {
    const code = generate_random_code(length);

    const exists = await (prismaModel as any).findFirst({
      where: {
        [field]: code,
      },
      select: {
        [field]: true,
      },
    });

    if (!exists) return code;

    attempt++;
  }

  throw new Error(
    `Failed to generate unique code for ${String(
      model
    )} after ${maxRetries} attempts`
  );
}
