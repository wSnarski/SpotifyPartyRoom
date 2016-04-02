import React from 'react';
import AuthenticatedComponent from './AuthenticatedComponent';
import AddRoomStore from '../stores/AddRoomStore';
import AddRoomActions from '../actions/AddRoomActions';

class AddRoom extends React.Component {
  constructor(props) {
    super(props);
    this.state = AddRoomStore.getState();
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    AddRoomStore.listen(this.onChange);
  }

  componentWillUnmount() {
    AddRoomStore.unlisten(this.onChange);
  }

  onChange(state) {
    this.setState(state);
  }

  handleSubmit(event) {
    event.preventDefault();
    var name = this.state.name.trim();

    if (!name) {
      AddRoomActions.invalidName();
      this.refs.nameTextField.getDOMNode().focus();
    }
    if (name) {
      AddRoomActions.addRoom(name);
    }
  }

  render() {
    return (
      <div className='container'>
        <div className='row flipInX animated'>
          <div className='col-sm-8'>
            <div className='panel panel-default'>
              <div className='panel-heading'>Add Room</div>
                <div className='panel-body'>
                  <form onSubmit={this.handleSubmit.bind(this)}>
                    <div className={'form-group ' + this.state.nameValidationState}>
                      <label className='control-label'>Room Name</label>
                      <input type='text' className='form-control' ref='nameTextField' value={this.state.name}
                      onChange={AddRoomActions.updateName} autoFocus/>
                      <span className='help-block'>{this.state.helpBlock}</span>
                    </div>
                    <button type='submit' className='btn btn-primary'>Submit</button>
                  </form>
                </div>
              </div>
            </div>
          </div>
      </div>
    );
  }
}

export default AuthenticatedComponent(AddRoom);
