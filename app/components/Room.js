import React from 'react';
import RoomStore from '../stores/RoomStore';
import RoomActions from '../actions/RoomActions';
import TrackManager from './TrackManager';
import SpotifyTrackPlayer from './SpotifyTrackPlayer';
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

  generateTracks() {
    RoomActions.generateTracks(this.props.params.id);
  }

  subscribe() {
    RoomActions.subscribe(this.props.params.id, this.props.userId);
  }

  unsubscribe() {
    RoomActions.unsubscribe(this.props.params.id, this.props.userId);
  }

  render() {

    let generateButton = <button className='btn btn-primary' onClick={this.generateTracks.bind(this)}>Generate Tracks</button>;
    var trackView;
    if(this.state.currentTracks.length > 0) {
      trackView =
      <div>
        <h3>Want a new playlist?</h3>
        {generateButton}
        <SpotifyTrackPlayer tracks = {this.state.currentTracks}/>
        <TrackManager tracks = {this.state.currentTracks} {...this.props}/>
      </div>
    } else {
      trackView =
      <div>
        <h3>There are no tracks for this room yet, ready to generate some tracks?</h3>
        {generateButton}
      </div>
    }
    let usersView =  this.state.subscribers.map((user, index) => {
      return (
        <div key={ user.spotifyId } className='list-group-item animated fadeIn'>
          <div className='media'>
            <span className='position pull-left'>{index + 1}</span>
            <div className='media-body'>
              <h4 className='media-heading'>
                <a role='button'>{user.spotifyId}</a>
              </h4>
            </div>
          </div>
        </div>
      );
    });

    let subscribeButton;
    if(this.state.subscribers.every((user) =>
      user.spotifyId != this.props.userId
    )){
      subscribeButton = <button onClick={this.subscribe.bind(this)} className='btn btn-primary'>Subscribe</button>;
    } else {
      subscribeButton = <button onClick={this.unsubscribe.bind(this)} className='btn btn-primary'>Unsubscribe</button>;
    }

    return (
      <div className='container'>
        <h2><strong>{this.state.name}</strong></h2>
        <div>
          <h3><strong>Subscribers</strong>  {subscribeButton}</h3>
          {usersView}
        </div>
        {trackView}
      </div>
    );
  }
}

export default AuthenticatedComponent(Room);
