import React from 'react';
import {Router} from 'react-router';
import Login from './Login';
import UserStore from '../stores/UserStore';

export default (ComposedComponent) => {
  return class AuthenticatedComponent extends React.Component {

    constructor(props) {
      super(props);
      this.state = UserStore.getState();
      this.onChange = this.onChange.bind(this);
    }

    componentDidMount() {
      UserStore.listen(this.onChange);
    }

    componentWillUnmount() {
      UserStore.unlisten(this.onChange);
    }

    onChange(state) {
      this.setState(state);
    }

    render() {
      return (
        this.state.LoggedIn ?
        <ComposedComponent
      {...this.props}
      userId={this.state.id}
      userLoggedIn={this.state.LoggedIn} />
      :
      <Login />
    );
  }
}
};
