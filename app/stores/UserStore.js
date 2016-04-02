import alt from '../alt';
import UserActions from '../actions/UserActions';

class UserStore {
  constructor() {
    this.bindActions(UserActions);
    this.profile = {};
    this.LoggedIn = false;
  }

  onGetUserProfileSuccess(login) {
    this.profile = login.profile;
    this.LoggedIn = true;
  }

  onGetUserProfileFail(message) {
    this.profile = {};
    this.LoggedIn = false;
    //toastr.error(message);
  }

  onLogout() {
    this.profile = {};
    this.LoggedIn = false;
    toastr.info("You've been successfully logged out.")
  }

}

export default alt.createStore(UserStore);
