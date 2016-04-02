import React from 'react';
import RoomStore from '../stores/RoomStore';
import RoomActions from '../actions/RoomActions';
import AuthenticatedComponent from './AuthenticatedComponent';

class Room extends React.Component {
  constructor(props) {
    super(props);
    this.state = RoomStore.getState();
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    RoomStore.listen(this.onChange);
    RoomActions.getRoom(this.props.params.id);
  }

  componentWillUnmount() {
    RoomStore.unlisten(this.onChange);
  }

  componentDidUpdate(prevProps) {
    // Fetch new room data when URL path changes
    if (prevProps.params.id !== this.props.params.id) {
      RoomActions.getRoom(this.props.params.id);
    }
  }

  onChange(state) {
    this.setState(state);
  }

  render() {
    return (
      <div className='container'>
        <h2><strong>{this.state.name}</strong></h2>
      </div>
  );
}
}

export default AuthenticatedComponent(Room);
