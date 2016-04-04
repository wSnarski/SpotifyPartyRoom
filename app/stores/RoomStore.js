import alt from '../alt';
import RoomActions from '../actions/RoomActions';
import {assign} from 'lodash';

class RoomStore {
  constructor() {
    this.name = '';
    this.currentTracks = [];
    this.topTracks = [];
    this.subscribers = [];
    this.bindActions(RoomActions);
  }

  onGenerateTracksSuccess(data) {
    RoomActions.getRoom(data._id);
  }

  onGenerateTracksFail(jqXhr) {
    toastr.error(jqXhr.responseJSON.message);
  }

  onGetRoomSuccess(data) {
    assign(this, data);
  }

  onGetRoomFail(jqXhr) {
    toastr.error(jqXhr.responseJSON.message);
  }
}

export default alt.createStore(RoomStore);
