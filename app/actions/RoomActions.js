import alt from '../alt';

class RoomActions{
  constructor() {
    this.generateActions(
      'getRoomSuccess',
      'getRoomFail',
      'generateTracksSuccess',
      'generateTracksFail',
      'subscribeSuccess',
      'subscribeFail',
      'unsubscribeSuccess',
      'unsubscribeFail'
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

  subscribe(roomId, userId) {
    $.ajax({
      type: 'POST',
      url: '/api/rooms/'+roomId+'/subscribers',
      contentType: 'application/json',
      data: JSON.stringify({
        user: userId
      })
    })
    .done((data) => {
      this.actions.subscribeSuccess(data);
    })
    .fail((jqXhr) => {
      this.actions.subscribeFail(jqXhr);
    });
  }

  unsubscribe(roomId, userId) {
    $.ajax({
      type: 'DELETE',
      url: '/api/rooms/'+roomId+'/subscribers/' + userId
    })
    .done((data) => {
      this.actions.unsubscribeSuccess(data);
    })
    .fail((jqXhr) => {
      this.actions.unsubscribeFail(jqXhr);
    });
  }

}

export default alt.createActions(RoomActions);
