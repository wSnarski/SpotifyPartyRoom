import React from 'react';
import {Route} from 'react-router';
import App from './components/App';
import Home from './components/Home';
import AddRoom from './components/AddRoom';
import RoomList from './components/RoomList';
import Room from './components/Room';
import Startup from './components/Startup';

export default (
  <Route component={App}>
    <Route path='/' component={Home} />
    <Route path='/Rooms/:id' component={Room} />
    <Route path='/AddRoom' component={AddRoom} />
    <Route path='/MyRooms' component={RoomList} />
    <Route path='/Startup' component={Startup} />
  </Route>
);
