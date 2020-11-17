import React from 'react';
import { render } from '@testing-library/react';

import App from './App';
import { act } from 'react-dom/test-utils';

// https://stackoverflow.com/a/53449595/1804173
// import './mocks.mock';
window.matchMedia = window.matchMedia || function() {
  return {
    matches: false,
    addListener: function() {},
    removeListener: function() {}
  };
};

test('basic app rendering', () => {
  act(() => {
    render(<App />);
  })
});
