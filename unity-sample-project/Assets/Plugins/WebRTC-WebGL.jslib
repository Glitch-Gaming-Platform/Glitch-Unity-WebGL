var BingewaveConnector = {
  $globalVariables: {
    token:
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhdWQiOiJiaW5nZXdhdmUtd2VicnRjIiwiaXNzIjoiYmluZ2V3YXZlLXdlYnJ0YyIsInN1YiI6Im1lZXQuYmluZ2V3YXZlLmNvbSIsInJvb20iOiIqIn0.NUvbPsKW9ahAyeTVMVEIGWrhLoPH8UJfRCvUbWhi5u0",
    options: {
      hosts: {
        domain: "meet.bingewave.com",
        muc: `conference.meet.bingewave.com`,
      },
      serviceUrl: `https://meet.bingewave.com/http-bind`,
      clientNode: "http://jitsi.org/jitsimeet",
      openBridgeChannel: true,
      resolution: 180,
    },

    conferenceName: "unity-demo",

    connection: null,
    isJoined: false,
    room: null,

    videoElements: {},
    localTracks: [],
    remoteTracks: {},
  },

  $onLocalTracks: function (tracks) {
    globalVariables.localTracks = tracks;
    if (globalVariables.isJoined) {
      for (var i = 0; i < globalVariables.localTracks.length; i++) {
        globalVariables.room.addTrack(globalVariables.localTracks[i]);
      }
    }
  },

  $onRemoteTrack: function (track) {
    if (track.isLocal()) {
      return;
    }

    var participantId = track.getParticipantId();

    if (!globalVariables.remoteTracks[participantId]) {
      globalVariables.remoteTracks[participantId] = [];
    }
    globalVariables.remoteTracks[participantId].push(track);

    if (track.getType() == "video") {
      // Video elements just get stored, they're accessed from Unity.
      var key = "participant-" + participantId;
      window.videoElements[key] = document.createElement("video");
      window.videoElements[key].autoplay = true;
      track.attach(window.videoElements[key]);
    } else {
      // Audio elements get added to the DOM (can be made invisible with CSS) so that the audio plays back.
      var audioElement = document.createElement("audio");
      audioElement.autoplay = true;
      audioElement.id = "audio-" + participantId;
      document.body.appendChild(audioElement);
      track.attach(audioElement);
    }
  },

  $onConferenceJoined: function () {
    globalVariables.isJoined = true;
    for (var i = 0; i < globalVariables.localTracks.length; i++) {
      globalVariables.room.addTrack(globalVariables.localTracks[i]);
    }
  },

  $onUserLeft: function (id) {
    if (!globalVariables.remoteTracks[id]) {
      return;
    }
    var tracks = globalVariables.remoteTracks[id];
    for (var i = 0; i < tracks.length; i++) {
      if (tracks[i].getType() == "video") {
        var key = "participant-" + id;
        var videoElement = window.videoElements[key];
        if (videoElement) {
          tracks[i].detach(videoElement);
          delete window.videoElements[key];
        }
      } else {
        var audioElement = document.getElementById("audio-" + id);
        if (audioElement) {
          tracks[i].detach(audioElement);
          audioElement.parentNode.removeChild(audioElement);
        }
      }
    }
  },

  $onConnectionSuccess: function () {
    globalVariables.room = globalVariables.connection.initJitsiConference(
      globalVariables.conferenceName,
      globalVariables.options
    );
    globalVariables.room.on(
      JitsiMeetJS.events.conference.TRACK_ADDED,
      onRemoteTrack
    );
    globalVariables.room.on(
      JitsiMeetJS.events.conference.CONFERENCE_JOINED,
      onConferenceJoined
    );
    globalVariables.room.on(
      JitsiMeetJS.events.conference.USER_JOINED,
      function (id) {
        globalVariables.remoteTracks[id] = [];
      }
    );
    globalVariables.room.on(
      JitsiMeetJS.events.conference.USER_LEFT,
      onUserLeft
    );
    globalVariables.room.join();
  },

  $unload: function () {
    for (var i = 0; i < globalVariables.localTracks.length; i++) {
      globalVariables.localTracks[i].dispose();
    }
    globalVariables.room.leave();
    globalVariables.connection.disconnect();
  },

  getLocalTrack: function () {
    return globalVariables.localTracks;
  },

  getRemoteTracks: function () {
    return globalVariables.remoteTracks;
  },

  initConn: function () {
    JitsiMeetJS.init(globalVariables.options);
    globalVariables.connection = new JitsiMeetJS.JitsiConnection(
      null,
      globalVariables.token,
      globalVariables.options
    );
    globalVariables.connection.addEventListener(
      JitsiMeetJS.events.connection.CONNECTION_ESTABLISHED,
      onConnectionSuccess
    );
    globalVariables.connection.connect();
    JitsiMeetJS.createLocalTracks({ devices: ["audio", "video"] }).then(
      onLocalTracks
    );
  },
};

autoAddDeps(BingewaveConnector, "$globalVariables");
autoAddDeps(BingewaveConnector, "$onLocalTracks");
autoAddDeps(BingewaveConnector, "$onRemoteTrack");
autoAddDeps(BingewaveConnector, "$onConferenceJoined");
autoAddDeps(BingewaveConnector, "$onUserLeft");
autoAddDeps(BingewaveConnector, "$onConnectionSuccess");
autoAddDeps(BingewaveConnector, "$unload");
mergeInto(LibraryManager.library, BingewaveConnector);
