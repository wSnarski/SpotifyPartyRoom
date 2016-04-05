import React from 'react';
import {Link} from 'react-router';

class Login extends React.Component {

  constructor(props) {
    super(props);
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
