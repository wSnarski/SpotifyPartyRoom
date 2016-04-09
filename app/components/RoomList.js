import React from 'react';
import {Link} from 'react-router';
import AuthenticatedComponent from './AuthenticatedComponent'
import RoomListStore from '../stores/RoomListStore';
import RoomListActions from '../actions/RoomListActions';

class RoomList extends React.Component {
  constructor(props) {
    super(props);
    this.state = RoomListStore.getState();
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    RoomListStore.listen(this.onChange);
    RoomListActions.getRooms();
  }

  componentWillUnmount() {
    RoomListStore.unlisten(this.onChange);
  }

  onChange(state) {
    this.setState(state);
  }

  render() {
    let roomsList = this.state.rooms.map((room, index) => {
      return (
        <div key={room._id} className='list-group-item animated fadeIn'>
          <div className='media'>
            <span className='position pull-left'>{index + 1}</span>
            <div className='media-body'>
              <h4 className='media-heading'>
                <Link to={'/rooms/' + room._id}>{room.name}</Link>
              </h4>
            </div>
          </div>
        </div>
      );
    });

    return (
      <div className='container'>
        <div className='list-group'>
          {roomsList}
        </div>
      </div>
  );
}
}

export default AuthenticatedComponent(RoomList);
