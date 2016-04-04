import React from 'react';
import {Link} from 'react-router';
import AuthenticatedComponent from './AuthenticatedComponent'
import TrackManagerStore from '../stores/TrackManagerStore';
import TrackManagerActions from '../actions/TrackManagerActions';
import StarRating from 'react-star-rating';

class TrackManager extends React.Component {
  constructor(props) {
    super(props);
    this.state = TrackManagerStore.getState();
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    TrackManagerStore.listen(this.onChange);
    TrackManagerActions.getTracks({ category: 'User'});
  }

  componentWillUnmount() {
    TrackManagerStore.unlisten(this.onChange);
  }

  onChange(state) {
    this.setState(state);
  }

  submitRankings() {
    TrackManagerActions.submitRankings(this.state.tracks);
  }

  //TODO implement on click
  render() {
    let trackList = this.state.tracks.map((track, index) => {
      return (
        <div key={track.id} className='list-group-item animated fadeIn'>
          <div className='media'>
            <span className='position pull-left'>{index + 1}</span>
            <div className='media-body'>
              <h4 className='media-heading'>
                <a role='button'>{track.name}</a>
              </h4>
              <h5>{track.artistName}</h5>
            </div>
            <StarRating name={'song-rating' + index} rating={track.rating} editing={true}/>
          </div>
        </div>
      );
    });

    return (
      <div className='container'>
        <button className='btn btn-primary' onClick={this.submitRankings.bind(this)}>Submit Ratings</button>
        <div className='list-group'>
          {trackList}
        </div>
      </div>
  );
}
}

export default AuthenticatedComponent(TrackManager);
