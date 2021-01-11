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
  let year = 0;
  let month = 0;
  let day = 0;
  let hour = 0;
  let minute = 0;
  let second = 0;
  let millis = 0;

  let timeString = "";

  {
    let match = /(\d\d\d\d)-(\d\d)-(\d\d)T?(.*?)$/.exec(s);
    if (match != null) {
      year = parseInt(match[1]);
      month = parseInt(match[2]);
      day = parseInt(match[3]);
      timeString = match[4];
    } else {
      return undefined;
    }
  }

  if (timeString !== "") {
    let match = /(..):(..):(..)\.?(.*?)$/.exec(timeString);
    if (match != null) {
      hour = parseInt(match[1]);
      minute = parseInt(match[2]);
      second = parseInt(match[3]);
      if (match[4] !== "") {
        millis = parseInt(match[4]);
      }
    }
  }

  if (
    isNaN(year) ||
    isNaN(month) ||
    isNaN(day) ||
    isNaN(hour) ||
    isNaN(minute) ||
    isNaN(second) ||
    isNaN(millis)
  ) {
    return undefined;
  } else {
    return new Date(year, month - 1, day, hour, minute, second, millis);
  }
}

export function formatDateHuman(d: Date): string {
  function pad(n: number): string {
    return n < 10 ? "0" + n : n.toString();
  }
  return (
    d.getFullYear() +
    "-" +
    pad(d.getMonth() + 1) +
    "-" +
    pad(d.getDate()) +
    "  @  " +
    pad(d.getHours()) +
    ":" +
    pad(d.getMinutes()) +
    ":" +
    pad(d.getSeconds())
  );
}

export function getDateNow() {
  // Returns the current date, but truncates the milliseconds, so that the
  // data reflects the precision we are using during serialization.
  let date = new Date();
  date.setMilliseconds(0);
  return date;
}
