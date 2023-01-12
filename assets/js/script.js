var clientId = "3903dc1b09cd47ae8c1bfb4990969b30";
var clientSecret = "1ec45ae9502c46db84bf1df9f682dd3e";
var postBody = { grant_type: "client_credentials" };
var urlencoded = new URLSearchParams();
urlencoded.append("grant_type", "client_credentials");
urlencoded.append("client_id", "3903dc1b09cd47ae8c1bfb4990969b30");
urlencoded.append("client_secret", "1ec45ae9502c46db84bf1df9f682dd3e");
var searchInput = $(".form-input");
var searchButton = $(".search-button");
var jumbotron = $("#display-artist");
var displayCards = $("#display-songs");
var songHeading = $(".song-heading");
var localStorageArray = [];
var searchHistorySection = $("#search-history");
var clearButton = $("#clear-button");

// Adding the option to clear search history
function clearPreviousSearch() {
  localStorage.removeItem("artist");
  searchHistorySection.empty();
}

// This function will bring up a QR code which will link to a google search
// of the artist as per user input
function getQRCode(artistName) {
  var data = artistName;
  var fmt = "png";
  $.ajax({
    method: "GET",
    url: "https://api.api-ninjas.com/v1/qrcode?data=" + data + "&format=" + fmt,
    headers: { "X-Api-Key": "ZdYI+Lj/vMMSzi+ktewh/w==89dSZH02W3eHyFfr" },
    contentType: "application/json",
    success: function (result) {
      var qrCode = $(".qr-code");
      qrCode.html(""); //clear qrCode just before we append it
      qrCode.append(`
            <div class="flex qr-image text-center">
               <p><img src="data:image/png;base64,${result}" alt="QR code" /></p>
               <p class="qr-text">Scan for more info about <span class="qr-span">${artistName}</span></p>
            </div> 
            `);
    },
    error: function ajaxError(jqXHR) {
      console.error("Error: ", jqXHR.responseText);
    },
  });
}

// This is to get the access token needed to grab the data for the two api's
function getAccessToken() {
  return fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    body: urlencoded,
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      return data.access_token;
    });
}

// Adding function to display modal when 'preview song' button is clicked
function showSongPreview() {
  var btn = $(this);
  var previewURL = btn.data("song");

  $(".modal-body").html(`
  <audio src="${previewURL}" autoplay controls></audio>
  `);

  $("#previewModal").modal({
    show: true,
  });
}

// This will clear modal when closed by user to stop the song from continuing to play
function clearModal() {
  $(".modal-body").empty();
}

// using the artist id to get the top tracks
function getTracks(id, token, artistName) {
  var artistID = id;
  fetch(`https://api.spotify.com/v1/artists/${artistID}/top-tracks?market=GB`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      console.log("get tracks", data);

      // For loop starts here:
      var trackArray = data.tracks;
      displayCards.html("");

      for (var track = 0; track < trackArray.length; track++) {
        var trackImage = data.tracks[track].album.images[0].url;
        var trackAlbum = data.tracks[track].album.name;
        var trackName = data.tracks[track].name;

        // Added in track duration
        var trackDuration = data.tracks[track].duration_ms;
        var trackDur = moment("2000-01-01 00:00:00")
          .add(moment.duration(trackDuration))
          .format("m:ss");

        var previewURL = data.tracks[track].preview_url;
        var fullSong = data.tracks[track].uri;

        displayCards.append(`
        <div class="container-card card shadow=lg rounded"
          <div class="song-card row">
          <img class="song-image card-img-top" src="${trackImage}">
          <div class="card-body">
            <h4>${trackName}</h4>
            <p>${trackDur}</p>
            <p><b>Album:</b> ${trackAlbum}</p>        
            <a class="preview-btn btn btn-dark" data-song="${previewURL}">Preview Song</a>
            <a class="fullSong-btn btn btn-dark" href="${fullSong}" target="_blank"> Listen on Spotify</a>
          </div>
        </div> 
        `);
      }

      getQRCode(artistName);
      return data;
    });
}

// Function to add search input to local storage
function addToSearchHistory(artist) {
  var searchHistory = searchInput.val().toLowerCase().trim(); // Getting the searched artist from the search input

  if (searchHistory == "") {
    return;
  }

  //If search input is already in the array, don't add again
  //Without this we get duplicate results
  if (localStorageArray.indexOf(searchHistory) > -1) {
    return;
  }
  console.log("check if adding artist", searchHistory);
  // Checking to see if the searched artist is already stored in localStorage
  // Object {Key: artist, Value: search input string}
  if (localStorage.getItem("artist") == null) {
    localStorageArray.push(searchHistory); //pushing searched term into the array
  } else {
    localStorageArray = JSON.parse(localStorage.getItem("artist"));

    //Checking if keyword doesn't already exist in array, if not then pushing it through
    if (localStorageArray.indexOf(searchHistory) === -1) {
      localStorageArray.push(searchHistory);
    }
  }

  //Adding the searched term as a button in search history
  searchHistorySection.append(`
  <button data-artist="${artist}" type="button" class="artist-history btn btn-dark btn-block">${artist}</button>
  `);

  //Stringifying searched terms array into a string
  localStorage.setItem("artist", JSON.stringify(localStorageArray));
}

function getPreviouslySearchedTermsFromLocalStorage() {
  //If statement to check whether array already exists in localStorage, if it does, then parse it back into an array
  if (localStorage.getItem("artist") != null) {
    localStorageArray = JSON.parse(localStorage.getItem("artist"));

    //Using a for loop to add all previous searched terms as buttons
    for (var i = 0; i < localStorageArray.length; i++) {
      var singer = localStorageArray[i];

      searchHistorySection.append(`
              <button data-artist="${singer}" type="button" class="artist-history btn btn-dark btn-block">${singer}</button>
          `);
    }
  }
  // recallArtist();
}

//Creating click event for all search history buttons inside #history div
function recallArtist() {
  //repopulating searchInput using data-location attribute
  var text = $(this).text();
  //Removing and adding classes to change the highlighted button colours when selected
  $(".artist-history").removeClass("btn-info").addClass("btn-dark");
  $(this).removeClass("btn-dark").addClass("btn-info");
  getArtists(text);
}

// 2 step process
// Step 1: obtain artist id
// Step 2: use artist id to get top tracks for the searched artist
// this will allow us to grab the artist id
function getArtists(event_or_text) {
  var isString = typeof event_or_text === "string";
  var artist = isString ? event_or_text : searchInput.val().trim();
  var tag_or_text = isString ? event_or_text : event_or_text.target.tagName;

  // checking for empty input and the event (search button click and enter keypress)
  // if true, get data for artists
  if (
    (artist && tag_or_text === "INPUT" && event_or_text.keyCode === 13) ||
    tag_or_text === "BUTTON" ||
    isString
  ) {
    if (!isString) {
      event_or_text.preventDefault();
    }
    getAccessToken().then((token) => {
      fetch(`https://api.spotify.com/v1/search?q=${artist}&type=artist`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })
        .then(function (response) {
          return response.json();
        })
        .then(function (data) {
          // Only picking first match of returned data
          // i.e index[0] of the array of returned data

          // If users inputs invalid search not in data, then show no results message
          if (!data.artists.items.length) {
            //Print no response text here
            console.log("not artist", data.artists);
            jumbotron.html("");
            jumbotron.append(`
            <div class="mt-3 jumbotron jumbotron-fluid">
              <div class="display-artist">
                <h1 class="display-4 artist-heading ">No Results!</h1>
              </div>
            </div>
            `);
          } else {
            var artistNameID = data.artists.items[0].id;
            console.log("artist result", data.artists);
            var artistImage = data.artists.items[0].images[1].url;
            var isGenre = data.artists.items[0].genres.length;

            if (isGenre) {
              var genre = data.artists.items[0].genres[0];
            } else {
              var genre = "";
            }

            var matchArtist = data.artists.items[0].name;

            jumbotron.html(""); //clear jumbo just before we append it
            //Add artist name, genre and image in jumbotron
            jumbotron.append(`
            <div class="mt-3 jumbotron jumbotron-fluid">
              <div class="display-artist">
                <h1 class="display-4 artist-heading ">${matchArtist}</h1>
                <p><img class="artist-image" src=${artistImage}></p>
                <p class="artist-genre">${genre}</p>
              </div>
              <div class="qr-code ">
              </div>
            </div>
            <div>
              <h3 >Top Tracks</h3>
            </div>
            `);

            addToSearchHistory(matchArtist);
            getTracks(artistNameID, token, matchArtist);
            searchInput.val("");
          }
        });
    });
  }
}

function init() {
  searchButton.click(getArtists);
  searchInput.keydown(getArtists);
  clearButton.click(clearPreviousSearch);
  searchHistorySection.on("click", ".artist-history", recallArtist);
  $(".display-songs").on("click", ".preview-btn", showSongPreview);
  $(".modal button").click(clearModal);
  getPreviouslySearchedTermsFromLocalStorage();
  console.log("start point");
}

init();
