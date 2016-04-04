import alt from '../alt';
import StartupActions from '../actions/StartupActions';

class StartupStore {
  constructor() {
    this.bindActions(StartupActions);
    this.tracks = [];
  }

  onGetTracksSuccess(data) {
    this.tracks = data;
  }

  onGetTracksFail(jqXhr) {
    toastr.error(jqXhr.responseJSON.message);
  }
}

export default alt.createStore(StartupStore);
