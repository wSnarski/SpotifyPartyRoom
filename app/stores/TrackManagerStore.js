import alt from '../alt';
import TrackManagerActions from '../actions/TrackManagerActions';

class TrackManagerStore {
  constructor() {
    this.bindActions(TrackManagerActions);
    this.tracks = [];
  }

  onGetTracksSuccess(data) {
    this.tracks = data;
  }

  onGetTracksFail(jqXhr) {
    toastr.error(jqXhr.responseJSON.message);
  }
}

export default alt.createStore(TrackManagerStore);
