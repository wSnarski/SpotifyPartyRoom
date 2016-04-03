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

  //pushSongsToML
  //since we are rebuilding the data set everytime, we might as well grab the scores from spotify
  //assuming they change??


}

export default alt.createActions(UserActions);
