import React from 'react';
import {Link} from 'react-router';
import AuthenticatedComponent from './AuthenticatedComponent'
import TrackManagerActions from '../actions/TrackManagerActions';
import StarRating from 'react-star-rating';
import Track from './Track'

class TrackManager extends React.Component {
  constructor(props) {
    super(props);
  }

  submitRankings() {
    TrackManagerActions.submitRankings(this.props.tracks);
  }

  render() {
    let trackList = this.props.tracks.map((track, index) => {
      return (
        <Track key = {track.spotifyId} index = {index} {...track}/>
      );
    });

    return (
      <div>
        <div><button className='btn btn-primary' onClick={this.submitRankings.bind(this)}>Submit Ratings</button></div>
        <div className='list-group'>
          {trackList}
        </div>
      </div>
  );
}
}

export default TrackManager;
