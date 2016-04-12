import React from 'react';
import _ from 'lodash';

class SpotifyTrackPlayer extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let srcString = _.reduce(this.props.tracks, function(url, track) {
      return url.concat(track.spotifyId, ',');
    }, 'https://embed.spotify.com/?uri=spotify:trackset:PREFEREDTITLE:');

    return (
      <iframe src={srcString} frameBorder="0" allowTransparency="true"></iframe>
    );
  }
}

export default SpotifyTrackPlayer;
