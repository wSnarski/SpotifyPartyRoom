import alt from '../alt';

class RoomActions{
  constructor() {
    this.generateActions(
      'getRoomSuccess',
      'getRoomFail'
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
}

export default alt.createActions(RoomActions);
