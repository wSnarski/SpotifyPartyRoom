import alt from '../alt';
import RoomListActions from '../actions/RoomListActions';

class RoomListStore {
  constructor() {
    this.bindActions(RoomListActions);
    this.rooms = [];
  }

  onGetRoomsSuccess(data) {
    this.rooms = data;
  }

  onGetRoomsFail(jqXhr) {
    toastr.error(jqXhr.responseJSON.message);
  }
}

export default alt.createStore(RoomListStore);
