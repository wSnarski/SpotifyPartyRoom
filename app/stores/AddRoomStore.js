import alt from '../alt';
import AddRoomActions from '../actions/AddRoomActions';

class AddRoomStore {
  constructor() {
    this.bindActions(AddRoomActions);
    this.name = '';
    this.helpBlock = '';
    this.nameValidationState = '';
  }

  onAddRoomSuccess(successMessage) {
    this.nameValidationState = 'has-success';
    this.helpBlock = successMessage;
  }

  onAddRoomFail(errorMessage) {
    this.nameValidationState = 'has-error';
    this.helpBlock = errorMessage;
  }

  onUpdateName(event) {
    this.name = event.target.value;
    this.nameValidationState = '';
    this.helpBlock = '';
  }

  onInvalidName() {
    this.nameValidationState = 'has-error';
    this.helpBlock = 'Please enter a room name.';
  }
}

export default alt.createStore(AddRoomStore);
