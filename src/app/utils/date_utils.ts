function leftPad(n: number, width: number, z: string = "0") {
  let s = "" + n;
  while (s.length < width) {
    s = z + s;
  }
  return s;
}

export function dateToString(d: Date): string {
  const leftPadTwo = (x: number) => leftPad(x, 2);

  return (
    d.getFullYear().toString() +
    "-" +
    leftPadTwo(d.getMonth() + 1) +
    "-" +
    leftPadTwo(d.getDate()) +
    "T" +
    leftPadTwo(d.getHours()) +
    ":" +
    leftPadTwo(d.getMinutes()) +
    ":" +
    leftPadTwo(d.getSeconds())
  );
}

export function stringToDate(s: string): Date | undefined {
  let splitDateTime = s.split("T");
  if (splitDateTime.length !== 2) {
    return undefined;
  }

  let [date, timeWithMillis] = splitDateTime;

  let splitDate = date.split("-");
  if (splitDate.length !== 3) {
    return undefined;
  }

  let [year, month, day] = splitDate.map((x) => parseInt(x));
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return undefined;
  }

  let splitTimeMillis = timeWithMillis.split(".");
  if (splitTimeMillis.length === 1) {
    splitTimeMillis.push("0");
  } else if (splitTimeMillis.length !== 2) {
    return undefined;
  }

  let [time, millis] = splitTimeMillis;

  let splitTime = time.split(":");
  if (splitTime.length !== 3) {
    return undefined;
  }

  let [hour, minute, second] = splitTime.map((x) => parseInt(x));
  if (isNaN(hour) || isNaN(minute) || isNaN(second)) {
    return undefined;
  }

  let millisNumber = parseInt(millis);
  if (isNaN(millisNumber)) {
    return undefined;
  }

  return new Date(year, month - 1, day, hour, minute, second, millisNumber);
}

export function getDateNow() {
  // Returns the current date, but truncates the milliseconds, so that the
  // data reflects the precision we are using during serialization.
  let date = new Date();
  date.setMilliseconds(0);
  return date;
}
