
type TObject = Record<string, unknown>;

export function isObject <T>(value: T | TObject): value is TObject {
  return typeof value === 'object';
}
