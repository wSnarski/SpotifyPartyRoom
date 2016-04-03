import alt from '../alt';

class TrackManagerActions{
  constructor() {
    this.generateActions(
      'getTracksSuccess',
      'getTracksFail',
      'submitRankingsSuccess',
      'submitRankingsFail'
    );
  }

  //Room will init track stuff?

  //TODO we're gonna want this to be socket io but whatever..
  //get tracks will be different than init create tracks
  getTracks(payload) {
    //categories are user and room
    var url = '';
    if(payload.category === 'User')  {
      //do we need to differentiate
      url = '/api/me/tracks?refresh=true'
    }
    else if(payload.category === 'Room') {
      url = '/api/Rooms/' + payload.id + '/tracks';
    }
    $.ajax({ url: url })
    .done((data) => {
      this.actions.getTracksSuccess(data);
    })
    .fail((jqXhr) => {
      this.actions.getTracksFail(jqXhr);
    });
  }

  submitRankings(tracks) {
    $.ajax({
      type: 'POST',
      url: '/api/tracks',
      contentType: 'application/json',
      data: JSON.stringify(tracks), //stringify is important
    })
    .done((data) => {
      this.actions.rateTracksSuccess(data);
    })
    .fail((jqXhr) => {
      this.actions.rateTracksFail(jqXhr);
    });
  }
}

export default alt.createActions(TrackManagerActions);
