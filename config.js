module.exports = {
  database: process.env.MONGOLAB_URI || 'localhost/SpotRoom',
  spotify_client_id: 'dcb418aa5f3844a2937a686e11e1f942' ,
  spotify_client_secret: '1e3b7d5b12184dbd94a6a80e00c8fdfc',
  spotify_callback_url: 'http://localhost:4000/auth/callback'
};
