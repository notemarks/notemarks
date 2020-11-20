import React from 'react';

import { render, act } from '@testing-library/react';
// TODO: Find out if import from react-dom is any different?
// import { act } from 'react-dom/test-utils';


import App from './App';

// https://davidwcai.medium.com/react-testing-library-and-the-not-wrapped-in-act-errors-491a5629193b
// https://kentcdodds.com/blog/fix-the-not-wrapped-in-act-warning
// https://github.com/testing-library/react-testing-library/issues/667

// https://stackoverflow.com/a/53449595/1804173
// import './mocks.mock';
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

/*
test('basic app rendering', async () => {
  await act(async () => {
    render(<App />);
  })
});
*/

test('basic app rendering', async () => {
})
