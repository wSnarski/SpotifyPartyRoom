import React from 'react';
import {Route} from 'react-router';
import App from './components/App';
import Home from './components/Home';
import NotHome from './components/NotHome';

export default (
  <Route component={App}>
    <Route path='/' component={Home} />
    <Route path='/NotHome' component={NotHome} />
  </Route>
);
