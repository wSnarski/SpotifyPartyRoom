import alt from '../alt';
import RoomActions from '../actions/RoomActions';
import {assign} from 'lodash';

class RoomStore {
  constructor() {
    this.name = '';
    this.tracks = [];
    this.subscribers = [];
    this.bindActions(RoomActions);
  }

  onGetRoomSuccess(data) {
    assign(this, data);
  }

  onGetRoomFail(jqXhr) {
    toastr.error(jqXhr.responseJSON.message);
  }
}

export default alt.createStore(RoomStore);
