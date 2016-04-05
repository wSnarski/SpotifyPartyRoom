import alt from '../alt';

class UserActions{
  constructor() {
    this.generateActions(
      'logout',
      'getUserProfileSuccess',
      'getUserProfileFail',
      'getUserTopTracksSuccess',
      'getUserTopTracksFail'
    );
  }

  login() {
    //TODO this is hacky
    window.location.replace('/auth');
  }

  getUserProfile() {
    $.ajax({ url: '/api/me' })
    .done((data) => {
      this.actions.getUserProfileSuccess(data);
    })
    .fail((jqXhr) => {
      this.actions.getUserProfileFail(jqXhr);
    });
  }
}

export default alt.createActions(UserActions);
