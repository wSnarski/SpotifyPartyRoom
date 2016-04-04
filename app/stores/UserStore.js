import alt from '../alt';
import UserActions from '../actions/UserActions';

class UserStore {
  constructor() {
    this.bindActions(UserActions);
    this.id = '';
    this.LoggedIn = false;
  }

  onGetUserProfileSuccess(login) {
    this.id = JSON.parse(login).id;
    this.LoggedIn = true;
  }

  onGetUserProfileFail(message) {
    this.id = '';
    this.LoggedIn = false;
    //toastr.error(message);
  }

  onLogout() {
    this.id = '';
    this.LoggedIn = false;
    toastr.info("You've been successfully logged out.")
  }

}

export default alt.createStore(UserStore);
