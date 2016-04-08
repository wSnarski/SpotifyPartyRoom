import React from 'react';
import Navbar from './Navbar';
import AuthenticatedComponent from './AuthenticatedComponent';
import UserActions from '../actions/UserActions';

class App extends React.Component {

  constructor(props) {
    super(props);
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    UserActions.getUserProfile();
  }

  onChange(state) {
    this.setState(state);
  }

  render() {
    return (
      <div>
        <Navbar/>
        {this.props.children}
      </div>
    );
  }
}

export default App;
