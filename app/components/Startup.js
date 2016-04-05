import React from 'react';
import {Link} from 'react-router';
import AuthenticatedComponent from './AuthenticatedComponent'
import StartupStore from '../stores/StartupStore';
import StartupActions from '../actions/StartupActions';
import TrackManager from './TrackManager';

class Startup extends React.Component {
  constructor(props) {
    super(props);
    this.state = StartupStore.getState();
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    StartupStore.listen(this.onChange);
    StartupActions.getTracks();
  }

  componentWillUnmount() {
    StartupStore.unlisten(this.onChange);
  }

  onChange(state) {
    this.setState(state);
  }


  //TODO implement on click
  render() {
    return (
        <div className='container'>
          <h2>Welcome to Spotify Room, we will need to rate your top tracks to get started</h2>
          <TrackManager tracks={this.state.tracks} {...this.props} />
        </div>
    );
  }
}

export default AuthenticatedComponent(Startup);
