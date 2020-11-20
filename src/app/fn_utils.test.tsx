/* eslint-disable jest/no-conditional-expect */
import * as fn_utils from './fn_utils';


test('mapEntries', () => {
  expect(fn_utils.mapEntries(
    {
      "foo": 1,
      "bar": 2,
    },
    (k, v) => k + v),
  ).toEqual(
    ["foo1", "bar2"]
  );
});
