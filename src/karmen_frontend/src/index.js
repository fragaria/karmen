import 'react-app-polyfill/ie11';
import 'core-js/es/promise';
import 'core-js/es/object';
import 'core-js/es/array';
import 'core-js/proposals/url';

import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux'
import App from './app';
import configureStore from './store';

import './assets/styles.scss';

ReactDOM.render(
  <Provider store={configureStore()}>
    <App />
  </Provider>,
document.getElementById('root'));
