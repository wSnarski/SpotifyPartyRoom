import React from 'react';
//import Navbar from './Navbar';
//import Footer from './Footer';
//import LoginActions from '../actions/LoginActions';
//import LoginStore from '../stores/LoginStore';

class App extends React.Component {

  constructor(props) {
    super(props);
    //this.state = LoginStore.getState();
    //this.onChange = this.onChange.bind(this);
  }

//  componentWillMount() {
//    if(typeof(Auth0Lock) !== "undefined") {
//      var lock = new Auth0Lock(AUTH0_CLIENT_ID, AUTH0_DOMAIN);
//      LoginActions.setAuthModule(lock);
//    }
//  }

//  componentDidMount() {
//    LoginStore.listen(this.onChange);
//    this.checkLocalLogin();
//  }

//  componentWillUnmount() {
//    LoginStore.unlisten(this.onChange);
//  }

//  onChange(state) {
//    this.setState(state);
//  }

  //checkLocalLogin() {
  //  if(localStorage.getItem("userToken") !== null) {
  //    LoginActions.getUserProfile(localStorage.getItem("userToken"));
  //  }
  //}

  render() {
    return (
      <div>
        {this.props.children}
      </div>
  );
}
}

export default App;
