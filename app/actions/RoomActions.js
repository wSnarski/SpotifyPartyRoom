import alt from '../alt';

class RoomActions{
  constructor() {
    this.generateActions(
      'getTopUserTracksSuccess',
      'getTopUserTracksFail'
    );
  }

  getTopUserTracks() {
    $.ajax({ url: '/api/user/top' })
    .done((data) => {
      this.actions.getTopUserTracksSuccess(data);
    })
    .fail((jqXhr) => {
      this.actions.getTopUserTracksFail(jqXhr);
    });
  }
}

export default alt.createActions(RoomActions);
