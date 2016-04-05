import React from 'react';
import {Link} from 'react-router';
import StarRating from 'react-star-rating';
import TrackManagerActions from '../actions/TrackManagerActions';

class Track extends React.Component {
  constructor(props) {
    super(props);
  }

  //TODO implement on click
  render() {
    return (
      <div key={this.props.id} className='list-group-item animated fadeIn'>
        <div className='media'>
          <span className='position pull-left'>{this.props.index + 1}</span>
          <div className='media-body'>
            <h4 className='media-heading'>
              <a role='button'>{this.props.name}</a>
            </h4>
            <h5>{this.props.artistName}</h5>
          </div>
          <StarRating name={'song-rating' + this.props.index} rating={this.props.rating} editing={true}/>
        </div>
      </div>
  );
}
}

export default Track;
