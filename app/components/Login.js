import React from 'react';
import {Link} from 'react-router';
//import HomeStore from '../stores/HomeStore';
//import HomeActions from '../actions/HomeActions';

class Login extends React.Component {

  constructor(props) {
    super(props);
    //this.state = HomeStore.getState();
  }

  render() {
    return (
      <div className='container'>
      <h3 className='text-center'>Please Login to use this app</h3>
      </div>
    );
  }
}

export default Login;
