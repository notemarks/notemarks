export function mapEntries<A, B>(obj: {[key: string]: A}, f: (k: string, v: A) => B): Array<B> {
  let result = Array<B>();
  for (let key in obj) {
    let value = obj[key];
    result.push(f(key, value))
  }
  return result;
}
