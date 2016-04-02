import React from 'react';
import {Route} from 'react-router';
import App from './components/App';
import Home from './components/Home';
import AddRoom from './components/AddRoom';

export default (
  <Route component={App}>
    <Route path='/' component={Home} />
    <Route path='/AddRoom' component={AddRoom} />
  </Route>
);
