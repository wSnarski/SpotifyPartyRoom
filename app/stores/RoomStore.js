import alt from '../alt';
import RoomActions from '../actions/RoomActions';
import TrackManagerActions from '../actions/TrackManagerActions';
import {assign, find} from 'lodash';

class RoomStore {
  constructor() {
    this.name = '';
    this.currentTracks = [];
    this.topTracks = [];
    this.subscribers = [];
    this.bindActions(RoomActions);
    this.bindActions(TrackManagerActions);
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

  onSubscribeSuccess(data) {
    RoomActions.getRoom(data._id);
  }

  onSubscribeFail(jqXhr) {
    toastr.error(jqXhr.responseJSON.message);
  }

  onUnsubscribeSuccess(data) {
    RoomActions.getRoom(data._id);
  }

  onUnsubscribeFail(jqXhr) {
    toastr.error(jqXhr.responseJSON.message);
  }


  onRateTrack(ratingObj) {
    let track = find(this.currentTracks, (track) => {
      return track.spotifyId === ratingObj.spotifyId });
    if(track) track.rating = ratingObj.rating;
  }
}

export default alt.createStore(RoomStore);
