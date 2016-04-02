import alt from '../alt';

class AddRoomActions {
  constructor() {
    this.generateActions(
      'addRoomSuccess',
      'addRoomFail',
      'updateName',
      'invalidName'
    );
  }

  addRoom(name) {
    $.ajax({
      type: 'POST',
      url: '/api/rooms',
      data: { name: name }
    })
    .done((data) => {
      this.actions.addRoomSuccess(data.message);
    })
    .fail((jqXhr) => {
      this.actions.addRoomFail(jqXhr.responseJSON.message);
    });
  }
}

export default alt.createActions(AddRoomActions);
