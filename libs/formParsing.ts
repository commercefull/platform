type TransformType = 'int' | 'float' | 'floatStr' | 'boolTrue' | 'boolNotFalse' | 'json' | 'date' | 'stringOrUndefined' | 'passthrough';

export type FieldConfig = {
  name: string;
  transform?: TransformType;
  default?: unknown;
  falsyValue?: unknown;
};

type TransformFn = (value: unknown, falsyValue: unknown) => unknown;

const transforms: Record<Exclude<TransformType, 'passthrough'>, TransformFn> = {
  int: (v, f) => (v ? parseInt(v as string) : (f ?? undefined)),
  float: (v, f) => (v ? parseFloat(v as string) : (f ?? undefined)),
  floatStr: (v, f) => (v ? parseFloat(v as string).toString() : (f ?? null)),
  boolTrue: v => v === 'true' || v === true,
  boolNotFalse: v => v !== 'false' && v !== false,
  json: (v, f) => (v ? JSON.parse(v as string) : (f ?? undefined)),
  date: (v, f) => (v ? new Date(v as string) : (f ?? null)),
  stringOrUndefined: (v, f) => v || (f ?? undefined),
};

function applyTransform(value: unknown, field: FieldConfig): unknown {
  if (!field.transform || field.transform === 'passthrough') return value;
  return transforms[field.transform](value, field.falsyValue);
}

export function buildFormObject(body: Record<string, unknown>, fields: FieldConfig[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const field of fields) {
    const raw = body[field.name];
    if (raw === undefined) {
      if (field.default !== undefined) result[field.name] = field.default;
      continue;
    }
    result[field.name] = applyTransform(raw, field);
  }
  return result;
}
