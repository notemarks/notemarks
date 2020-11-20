const module = {}
export default module

test('someTest', () => {
  // test something here...
  console.log("debug detail in some test")
  expect(true).toEqual(true);
});

test('someOtherTest', () => {
  // test something here...
  console.log("debug detail in some other test")
  expect(true).toEqual(true);
});
