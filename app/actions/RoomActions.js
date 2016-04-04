import alt from '../alt';

class RoomActions{
  constructor() {
    this.generateActions(
      'getRoomSuccess',
      'getRoomFail',
      'generateTracksSuccess',
      'generateTracksFail'
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

  //TODO do the send back with socket io?
  generateTracks(roomId) {
    $.ajax({ url: '/api/rooms/'+roomId+'/tracks' })
    .done((data) => {
      this.actions.generateTracksSuccess(data);
    })
    .fail((jqXhr) => {
      this.actions.generateTracksFail(jqXhr);
    });
  }
}

export default alt.createActions(RoomActions);
