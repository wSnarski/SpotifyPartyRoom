import alt from '../alt';

class RoomActions{
  constructor() {
    this.generateActions(
      'getRoomSuccess',
      'getRoomFail',
      'getTopUserTracksSuccess',
      'getTopUserTracksFail'
    );
  }

  getRoom(roomId) {
    $.ajax({ url: '/api/rooms/' + roomId })
    .done((data) => {
      this.actions.getRoomSuccess(data);
    })
    .fail((jqXhr) => {
      this.actions.getRoomFail(jqXhr);
    });
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
