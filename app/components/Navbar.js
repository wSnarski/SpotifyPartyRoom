import React from 'react';
import {Link} from 'react-router';
import LoginActions from '../actions/LoginActions';

class Navbar extends React.Component {
  constructor(props) {
    super(props);
  }

  handleLogin(event) {
    event.preventDefault();
    LoginActions.login();
  }

render() {
  return (
    <nav className='navbar navbar-default navbar-static-top'>
    <div className='container-fluid'>
    <div className='navbar-header'>
    <button type='button' className='navbar-toggle collapsed' data-toggle='collapse' data-target='#navbar'>
    <span className='sr-only'>Toggle navigation</span>
    <span className='icon-bar'></span>
    <span className='icon-bar'></span>
    <span className='icon-bar'></span>
    </button>
    <Link to='/' className='navbar-brand'>
    Spotify Room
    </Link>
    </div>
    <div id='navbar' className='navbar-collapse collapse'>
    <form ref='searchForm' className='navbar-form navbar-left animated'>
    <div className='input-group'>
    <span className='input-group-btn'>
    </span>
    </div>
    </form>
    <ul className='nav navbar-nav'>
    <li><Link to='/Login'>Login Page</Link></li>
    <li><a role='button' onClick={this.handleLogin.bind(this)}>Login</a></li>
    </ul>
    <ul className="nav navbar-nav navbar-right">
  </ul>
  </div>
  </div>
  </nav>
);
}
}

export default Navbar;
