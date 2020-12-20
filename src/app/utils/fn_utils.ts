export function assertUnreachable(x: never): never {
  throw new Error("Unhandled case: " + x);
}

export function mapEntries<A, B>(obj: { [key: string]: A }, f: (k: string, v: A) => B): Array<B> {
  let result = Array<B>();
  for (let key in obj) {
    let value = obj[key];
    result.push(f(key, value));
  }
  return result;
}

export function mapNullToUndefined<T>(x: T | null | undefined): T | undefined {
  return x != null ? x : undefined;
}

export function mapUndefinedToNull<T>(x: T | null | undefined): T | null {
  return x != null ? x : null;
}

export function computeSelectedIndex(listLength: number, current: number, delta: number): number {
  if (listLength <= 0) {
    return -1;
  } else if (current === -1) {
    return delta > 0 ? 0 : listLength - 1;
  } else {
    let newValue = current + delta;
    while (newValue >= listLength) newValue -= listLength;
    while (newValue < 0) newValue += listLength;
    return newValue;
  }
}
