(function () {
  'use strict';
  class Event {
    constructor(name, venue, latitude, longitude, city, state, date, time) {
      this.name = name;
      this.venue = venue;
      this.latitude = latitude;
      this.longitude = longitude;
      this.city = city;
      this.state = state;
      this.date = date;
      this.time = time;
    }
  }

  var ViewModel = function () {
    this.isLoggedIn = ko.observable(false);
    this.login = function () {
      var self = this;
      this.loginErrorMessage(null);
      OAuthManager.obtainToken({
        scopes: [
          /*
            the permission for reading public playlists is granted
            automatically when obtaining an access token through
            the user login form
            */
          'user-read-private',
          'user-top-read'
        ]
      }).then(function (token) {
        onTokenReceived(token);
      }).catch(function (error) {
        self.loginError(error);
      });
    };

    this.logout = function () {
      localStorage.removeItem(accessTokenKey);
      this.isLoggedIn(false);
    };

    this.loginError = function (errorCode) {
      switch (errorCode) {
        case 'access_denied':
          this.loginErrorMessage('You need to grant access in order to use this website.');
          break;
        default:
          this.loginErrorMessage('There was an error trying to obtain authorization. Please, try it again later.');
      }
    };

    this.loginErrorMessage = ko.observable(null);

    this.user = ko.observable(null);

    this.artists = ko.observableArray([]);
    this.a = ko.observableArray([]);

    this.GetArtistEvents = function () {
      var evArr = [];
      $.when($.getJSON('https://app.ticketmaster.com/discovery/v2/events.json?apikey=udQKQdhwkupacGyPtGOU8VHjAlXbM5xQ&countryCode=US&keyword=' + this.name)).done(function (json) {
        var arr = json._embedded.events;
        for (var i in arr) {
          let event = new Event;
          event.name = arr[i].name;
          event.venue = arr[i]._embedded.venues[0].name;
          event.latitude = arr[i]._embedded.venues[0].location.latitude;
          event.longitude = arr[i]._embedded.venues[0].location.longitude;
          event.city = arr[i]._embedded.venues[0].city;
          event.state = arr[i]._embedded.venues[0].state.name;
          event.date = arr[i].dates.start.localDate;
          event.time = arr[i].dates.start.localTime;
          evArr[i] = event;
        }
      });
	  return evArr;
    }
    var ccIndex = 1;
    var ccArr = ['lightgreen', 'lightsalmon', 'gold', 'thistle', 'moccasin'];
    this.changeColorScheme = function () {
      $("body").css("background-color", ccArr[ccIndex]);
      ccIndex++;
      if (ccIndex == ccArr.length) ccIndex=0;
    }
  };

  var viewModel = new ViewModel();
  ko.applyBindings(viewModel);



  var spotifyApi = new SpotifyWebApi(),
    accessTokenKey = 'sp-access-token';

  function onTokenReceived(token) {
    viewModel.isLoggedIn(true);
    localStorage.setItem(accessTokenKey, token);


    // do something with the token
    spotifyApi.setAccessToken(token);
    spotifyApi.getMe().then(function (data) {
      viewModel.user(data);

      spotifyApi.getMyTopArtists({ limit: 10 }).then(function (artists) {
        viewModel.artists(artists.items);
        /* Promise.all(artists.items.map(a => spotifyApi.getArtistTopTracks(a.id, "US").then(function (a) {
          console.log(a);
          viewModel.a(a.tracks);
        }))) */
      });
    });
  }

  /**
   * Uses the stored access token
   */
  function initAccessToken() {
    var storedAccessToken = localStorage.getItem(accessTokenKey);
    if (storedAccessToken) {
      onTokenReceived(storedAccessToken);
    }
  }

  initAccessToken();

})();