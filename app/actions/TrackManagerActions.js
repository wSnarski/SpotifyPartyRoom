import alt from '../alt';

class TrackManagerActions{
  constructor() {
    this.generateActions(
      'submitRankingsSuccess',
      'submitRankingsFail',
      'rateTrack',
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
      this.actions.submitRankingsSuccess(data);
    })
    .fail((jqXhr) => {
      this.actions.submitRankingsFail(jqXhr);
    });
  }
}

export default alt.createActions(TrackManagerActions);
