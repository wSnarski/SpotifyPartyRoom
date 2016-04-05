import React from 'react';
import {Link} from 'react-router';
import AuthenticatedComponent from './AuthenticatedComponent';

class Home extends React.Component {

  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  onChange(state) {
    this.setState(state);
  }

  render() {
    return (
      <div className='container'>
        <h3 className='text-center'>Welcome to Spotify Room</h3>
      </div>
  );
}
}

export default AuthenticatedComponent(Home);
