import alt from '../alt';
import StartupActions from '../actions/StartupActions';
import TrackManagerActions from '../actions/TrackManagerActions';
import {find} from 'lodash';

class StartupStore {
  constructor() {
    this.bindActions(StartupActions);
    this.bindActions(TrackManagerActions);
    this.tracks = [];
  }

  onGetTracksSuccess(data) {
    this.tracks = data;
  }

  onGetTracksFail(jqXhr) {
    toastr.error(jqXhr.responseJSON.message);
  }

  onRateTrack(ratingObj) {
    let track = find(this.tracks, (track) => {
      return track.spotifyId === ratingObj.spotifyId });
    if(track) track.rating = ratingObj.rating;
  }
}

export default alt.createStore(StartupStore);
