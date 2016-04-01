import React from 'react';
import {Link} from 'react-router';

class Navbar extends React.Component {
  constructor(props) {
    super(props);
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
    <li><Link to='/NotHome'>Not Home</Link></li>
    <li><Link to='/auth'>Login</Link></li>
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
