import { Prisma } from "@prisma/client";
type TxClient = Prisma.TransactionClient;

interface GetIdByCodeParams<
  TModel extends keyof TxClient,
  TCodeField extends string,
  TIdField extends string
> {
  tx: TxClient;
  model: TModel;
  codeField: TCodeField;
  codeValue: string;
  idField: TIdField;
}

export async function get_id_by_code<
  TModel extends keyof TxClient,
  TCodeField extends string,
  TIdField extends string
>({
  tx,
  model,
  codeField,
  codeValue,
  idField,
}: GetIdByCodeParams<TModel, TCodeField, TIdField>): Promise<number> {
  const result = await (tx[model] as any).findUnique({
    where: {
      [codeField]: codeValue,
    },
    select: {
      [idField]: true,
    },
  });

  return result[idField];
}
