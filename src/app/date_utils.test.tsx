import * as date_utils from './date_utils';


test('dateToString', () => {
  let dateToString = date_utils.dateToString;
  let d: Date

  d = new Date(2020, 11, 24, 18, 30, 1, 234);
  expect(dateToString(d)).toEqual("2020-12-24T18:30:01");

  d = new Date(2020, 0, 1, 0, 0, 0, 0);
  expect(dateToString(d)).toEqual("2020-01-01T00:00:00");
});


test('stringToDate', () => {
  let stringToDate = date_utils.stringToDate;
  let d: Date

  d = new Date(2020, 11, 24, 18, 30, 1);
  expect(stringToDate("2020-12-24T18:30:01")).toEqual(d);

  d = new Date(2020, 11, 24, 18, 30, 1, 234);
  expect(stringToDate("2020-12-24T18:30:01.234")).toEqual(d);

  d = new Date(2020, 0, 1, 0, 0, 0, 0);
  expect(stringToDate("2020-01-01T00:00:00.000")).toEqual(d);

  expect(stringToDate("foo")).toBeUndefined();
  expect(stringToDate("fooTbar")).toBeUndefined();
  expect(stringToDate("foo-fooTbar")).toBeUndefined();
  expect(stringToDate("foo-foo-fooTbar.bar")).toBeUndefined();
  expect(stringToDate("fooo-01-01T00:00:00.000")).toBeUndefined();
  expect(stringToDate("2020-fo-01T00:00:00.000")).toBeUndefined();
  expect(stringToDate("2020-01-foT00:00:00.000")).toBeUndefined();
  expect(stringToDate("2020-01-01Tfo:00:00.000")).toBeUndefined();
  expect(stringToDate("2020-01-01T00:fo:00.000")).toBeUndefined();
  expect(stringToDate("2020-01-01T00:00:fo.000")).toBeUndefined();
  expect(stringToDate("2020-01-01T00:00:00.foo")).toBeUndefined();
});
