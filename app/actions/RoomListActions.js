import alt from '../alt';

class RoomListActions {
  constructor() {
    this.generateActions(
      'getRoomsSuccess',
      'getRoomsFail'
    );
  }
  //TODO depending on reuse we can pass in owned vs subscribed here
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
