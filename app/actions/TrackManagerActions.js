import alt from '../alt';

class TrackManagerActions{
  constructor() {
    this.generateActions(
      'submitRankingsSuccess',
      'submitRankingsFail',
      'changeRating',
    );
  }

  submitRankings(tracks) {
    $.ajax({
      type: 'POST',
      url: '/api/tracks',
      contentType: 'application/json',
      data: JSON.stringify(tracks)
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
