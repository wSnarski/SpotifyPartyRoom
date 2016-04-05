import alt from '../alt';

class RoomListActions {
  constructor() {
    this.generateActions(
      'getRoomsSuccess',
      'getRoomsFail'
    );
  }
  getRooms() {
    $.ajax({ url: '/api/me/rooms' })
    .done((data) => {
      this.actions.getRoomsSuccess(data);
    })
    .fail((jqXhr) => {
      this.actions.getRoomsFail(jqXhr);
    });
  }
}

export default alt.createActions(RoomListActions);
