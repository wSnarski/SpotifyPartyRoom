import alt from '../alt';

class StartupActions{
  constructor() {
    this.generateActions(
      'getTracksSuccess',
      'getTracksFail'
    );
  }

  getTracks() {
    $.ajax({ url: '/api/me/tracks?refresh=true' })
    .done((data) => {
      this.actions.getTracksSuccess(data);
    })
    .fail((jqXhr) => {
      this.actions.getTracksFail(jqXhr);
    });
  }
}

export default alt.createActions(StartupActions);
