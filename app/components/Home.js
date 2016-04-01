import React from 'react';
import {Link} from 'react-router';
//import HomeStore from '../stores/HomeStore';
//import HomeActions from '../actions/HomeActions';

class Home extends React.Component {

  constructor(props) {
    super(props);
    //this.state = HomeStore.getState();
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    //HomeStore.listen(this.onChange);
  }

  componentWillUnmount() {
    //HomeStore.unlisten(this.onChange);
  }

  onChange(state) {
    this.setState(state);
  }

  render() {
    return (
      <div className='container'>
        <h3 className='text-center'>Welcome to Spotify Room</h3>
      </div>
  );
}
}

export default Home;
