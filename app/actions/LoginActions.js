import alt from '../alt';

class LoginActions{
  constructor() {
    this.generateActions(
      'loginSuccess',
      'loginFail'
    );
  }

  login() {
    //TODO this is hacky
    window.location.replace('/auth');
  }
}

export default alt.createActions(LoginActions);
