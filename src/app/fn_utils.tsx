export function mapEntries<A, B>(obj: {[key: string]: A}, f: (k: string, v: A) => B): Array<B> {
  let result = Array<B>();
  for (let key in obj) {
    let value = obj[key];
    result.push(f(key, value))
  }
  return result;
}

export function mapNullToUndefined<T>(x: T | null | undefined): T | undefined {
  return (x != null ? x : undefined)
}

export function mapUndefinedToNull<T>(x: T | null | undefined): T | null {
  return (x != null ? x : null)
}
