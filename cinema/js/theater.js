if (window.swfobject == undefined) window.swfobject = null;
window.open = function() { return null; }; // prevent popups

var theater = {

	VERSION: '1.6.7-YukiTheater',

	playerContainer: null,
	playerContent: null,
	// closedCaptions: false,
	// language: "en",
	hdPlayback: false,
	player: null,
	volume: 25,
	syncMaxDiff: 10,

	getPlayerContainer: function() {
		if ( this.playerContainer == null ) {
			this.playerContainer = document.getElementById('player-container') ||
				document.createElement('div');
		}
		return this.playerContainer;
	},

	getPlayerContent: function() {
		if ( this.playerContent == null ) {
			this.playerContent = document.getElementById('content') ||
				document.createElement('div');
		}
		return this.playerContent;
	},

	resetPlayer: function() {
		if ( this.player ) {
			this.player.onRemove();
			delete this.player;
		}
		this.getPlayerContainer().innerHTML = "<div id='player'></div>";
	},

	enablePlayer: function() {
		// Show player
		var player = this.getPlayerContainer();
		player.style.display = "block";

		// Hide content
		var content = this.getPlayerContent();
		content.style.display = "none";
	},

	disablePlayer: function() {
		// Hide player
		var player = this.getPlayerContainer();
		player.style.display = "none";

		this.resetPlayer();

		// Show content
		var content = this.getPlayerContent();
		content.style.display = "block";
	},

	getPlayer: function() {
		return this.player;
	},

	loadVideo: function( type, data, startTime ) {

		if ( ( type == null ) || ( data == null ) ) return;
		
		if ( type == "" ) {
			this.disablePlayer();
			return;
		}

		startTime = Math.max( 0, startTime );

		var player = this.getPlayer();

		// player doesn't exist or is different video type
		if ( (player == null) || (player.getType() != type) ) {

			this.resetPlayer();
			this.enablePlayer();

			var playerObject = getPlayerByType( type );
			if ( playerObject != null ) {
				this.player = new playerObject();
			} else {
				this.getPlayerContainer().innerText = "ERROR: Video type not yet implemented.";
				this.getPlayerContainer().style.color = "red";
				return;
			}

		}

		// Video Service Usage Tracking
		ga('send', 'event', 'services', 'load', type);
		
		this.player.setVolume( (this.volume != null) ? this.volume : 25 );
		this.player.setStartTime( startTime || 0 );
		this.player.setVideo( data );
		console.log("Initializing Player: " + type + " at " + startTime + " seconds...");
	},

	setVolume: function( volume ) {
		this.volume = volume;
		if ( this.player != null ) {
			this.player.setVolume( volume );
		}
	},

	seek: function( seconds ) {
		var player = this.getPlayer();
		if ( player ) {
			player.seek( seconds );
		}
	},

	setForceVideoRes: function(bool) {
		if (this.forceVideoRes != bool) {
			this.forceVideoRes = bool;
			console.log("forceVideoRes set to " + bool + "!");
		}
	},

	isForceVideoRes: function() {
		return this.forceVideoRes;
	},

	sync: function( time ) {

		if ( time == null ) return;

		if ( this.player != null ) {

			var current = this.player.getCurrentTime();
			if ( ( current != null ) &&
				( Math.abs(time - current) > this.syncMaxDiff ) ) {
				this.player.setStartTime( time );
				console.log("Attempting to sync player to " + time + " seconds...");
			}

		}

	},

	toggleControls: function( enabled ) {
		if ( this.player != null ) {
			this.player.toggleControls( enabled );
		}
	},

	/*
		Google Chromeless player doesn't support closed captions...
		http://code.google.com/p/gdata-issues/issues/detail?id=444
	*/
	
	enableCC: function() {
		this.closedCaptions = true;
	},

	isCCEnabled: function() {
		return this.closedCaptions;
	}

	/*clickPlayerCenter: function() {
		var evt = document.createEvent("MouseEvents");

		var player = document.getElementById("player");

		var w = player.clientWidth / 2,
			h = player.clientHeight / 2;

		evt.initMouseEvent("click", true, true, window,
			0, 0, 0, w, h, false, false, false, false, 0, null);

		this.getPlayer().dispatchEvent(evt);
	},

	setLanguage: function( language ) {
		this.language = language;
	}
	*/

};


var players = [];

function getPlayerByType( type ) {
	return players[ type ];
}

var DefaultVideo = function() {};
DefaultVideo.prototype = {
	player: null,

	lastVideoId: null,
	videoId: null,

	lastVolume: null,
	volume: 0.123,

	currentTime: 0,

	getCurrentTime: function() {
		return null;
	},

	lastStartTime: 0,
	startTime: 0,

	setVolume: function( volume ) {},
	setStartTime: function( seconds ) {},
	seek: function( seconds ) {},
	onRemove: function() {},
	toggleControls: function() {}
};

function registerPlayer( type, object ) {
	object.prototype = new DefaultVideo();
	object.prototype.type = type;
	object.prototype.getType = function() {
		return this.type;
	};

	players[ type ] = object;
}

/*
	If someone is reading this and trying to figure out how
	I implemented each player API, here's what I did.

	To avoid endlessly searching for API documentations, I
	discovered that by decompiling a swf file, you can simply
	search for "ExternalInterface.addCallback" for finding
	JavaScript binded functions. And by reading the actual 
	source code, things should be much easier.

	This website provides a quick-and-easy way to decompile
	swf code http://www.showmycode.com/

	If you need additional information, you can reach me through
	the following contacts:

	samuelmaddock.com
	samuel.maddock@gmail.com
	http://steamcommunity.com/id/samm5506


	Test Cases

	theater.loadVideo( "youtube", "JVxe5NIABsI", 30 )
	theater.loadVideo( "youtubelive", "0Sdkwsw2Ji0" )
	theater.loadVideo( "vimeo", "55874553", 30 )
	theater.loadVideo( "twitch", "mega64podcast,c4320640", 30*60 )
	theater.loadVideo( "twitch", "cosmowright,c1789194" )
	theater.loadVideo( "twitchstream", "ignproleague" )
	Justin.TV Support removed 8-5-2014
	theater.loadVideo( "blip", "6484826", 60 )
	theater.loadVideo( "html", "<span style='color:red;'>Hello world!</span>", 10 )
	theater.loadVideo( "viooz", "", 0 )
	thetaer.loadVideo( "dailymotion", "x1946tk", 0 )
	theater.loadVideo( "ustreamlive", "1524" )
	Livestream Support disabled 5-9-2016: Original API just stopped working

*/
(function() {

	var YouTubeVideo = function() {

		/*
			Embed Player Object
		*/
		var params = {
			allowScriptAccess: "always",
			bgcolor: "#000000",
			wmode: "opaque"
		};
		
		var attributes = {
			id: "player",
		};
		
		var url = "https://www.youtube.com/apiplayer?enablejsapi=1&modestbranding=1&autohide=1&controls=1&autoplay=1&iv_load_policy=3";
		if ( theater.isCCEnabled() ) {
			url += "&cc_load_policy=1";
			url += "&yt:cc=on";
		}
		
		swfobject.embedSWF( url, "player", "126.6%", "104.2%", "9", null, null, params, attributes );
		
		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastStartTime = null;
			this.lastVideoId = null;
			this.videoId = id;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
		};

		this.seek = function( seconds ) {
			if ( this.player != null ) {
				this.player.seekTo( seconds, true );

				// Video isn't playing
				if ( this.player.getPlayerState() != 1 ) {
					this.player.playVideo();
				}
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.getCurrentTime = function() {
			if ( this.player != null ) {
				return this.player.getCurrentTime();
			}
		};

		this.canChangeTime = function() {
			if ( this.player != null ) {
				//Is loaded and it is not buffering
				return this.player.getVideoBytesTotal() != -1 &&
				this.player.getPlayerState() != 3;
			}
		};

		this.think = function() {

			if ( this.player != null ) {
				
				if ( theater.isForceVideoRes() ) {
					if ( this.lastWindowHeight != window.innerHeight ) {
						if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
							this.ytforceres = "highres";
						}
						if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
							this.ytforceres = "highres";
						}
						if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
							this.ytforceres = "hd1080";
						}
						if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
							this.ytforceres = "hd720";
						}
						if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
							this.ytforceres = "large";
						}
						if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
							this.ytforceres = "medium";
						}
						if ( window.innerHeight <= 240 ) {
							this.ytforceres = "small";
						}
						
						this.player.setPlaybackQuality(this.ytforceres);
						console.log("Forcing Quality Change to " + this.ytforceres);
						
						this.lastWindowHeight = window.innerHeight;
					}
				}
				
				if ( this.videoId != this.lastVideoId ) {
					this.player.loadVideoById( this.videoId, this.startTime, this.ytforceres ? this.ytforceres : "default");
					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				if ( this.player.getPlayerState() != -1 ) {

					if ( this.startTime != this.lastStartTime ) {
						this.seek( this.startTime );
						this.lastStartTime = this.startTime;
					}
					
					if ( this.volume != this.lastVolume ) {
						this.player.setVolume( this.volume );
						this.lastVolume = this.volume;
					}

				}
			}

		};

		this.onReady = function() {
			this.player = document.getElementById('player');
			this.player.style.marginLeft = "-24.2%";

			if ( theater.isForceVideoRes() ) {
				if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
					this.ytforceres = "highres";
				}
				if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
					this.ytforceres = "highres";
				}
				if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
					this.ytforceres = "hd1080";
				}
				if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
					this.ytforceres = "hd720";
				}
				if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
					this.ytforceres = "large";
				}
				if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
					this.ytforceres = "medium";
				}
				if ( window.innerHeight <= 240 ) {
					this.ytforceres = "small";
				}
				
				this.player.setPlaybackQuality(this.ytforceres);
				console.log("Forcing Quality Change to " + this.ytforceres);
			}

			this.interval = setInterval( this.think.bind(this), 100 );
		};

	};
	registerPlayer( "youtube", YouTubeVideo );

	var YouTubeLiveVideo = function() {

		/*
			Embed Player Object
		*/
		var player;

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastStartTime = null;
			this.lastVideoId = null;
			this.videoId = id;
			
			if (player) { return; }

			player = new YT.Player('player', {
				height: '100%',
				width: '100%',
				videoId: id,
				playerVars: {
					autoplay: 1,
					controls: 1,
					autohide: 1,
					iv_load_policy: 3, // hide annotations
					cc_load_policy: theater.closedCaptions ? 1 : 0
				},
				events: {
					onReady: onYouTubePlayerReady,
				}
			});
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
		};

		this.seek = function( seconds ) {
			if ( this.player !== null ) {
				this.player.seekTo( seconds, true );

				// Video isn't playing
				if ( this.player.getPlayerState() != 1 ) {
					this.player.playVideo();
				}
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.getCurrentTime = function() {
			if ( this.player !== null ) {
				return this.player.getCurrentTime();
			}
		};

		this.canChangeTime = function() {
			if ( this.player !== null ) {
				//Is loaded and it is not buffering
				return this.player.getVideoBytesTotal() != -1 &&
				this.player.getPlayerState() != 3;
			}
		};

		this.think = function() {

			if ( this.player !== null ) {
				
				if ( theater.isForceVideoRes() ) {
					if ( this.lastWindowHeight != window.innerHeight ) {
						if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
							this.ytforceres = "highres";
						}
						if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
							this.ytforceres = "highres";
						}
						if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
							this.ytforceres = "hd1080";
						}
						if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
							this.ytforceres = "hd720";
						}
						if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
							this.ytforceres = "large";
						}
						if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
							this.ytforceres = "medium";
						}
						if ( window.innerHeight <= 240 ) {
							this.ytforceres = "small";
						}
						
						this.player.setPlaybackQuality(this.ytforceres);
						console.log("Forcing Quality Change to " + this.ytforceres);
						
						this.lastWindowHeight = window.innerHeight;
					}
				}
				
				if ( this.videoId != this.lastVideoId ) {
					this.player.loadVideoById( this.videoId, this.startTime, this.ytforceres ? this.ytforceres : "default");
					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				if ( this.player.getPlayerState() != -1 ) {
					if ( this.startTime != this.lastStartTime ) {
						this.seek( this.startTime );
						this.lastStartTime = this.startTime;
					}

					if ( this.volume != this.lastVolume ) {
						this.player.setVolume( this.volume );
						this.lastVolume = this.volume;
					}
				}
			}

		};

		this.onReady = function() {
			this.player = player;

			this.player.setVolume(this.volume != null ? this.volume : theater.volume != null ? theater.volume : 25);

			if ( theater.isForceVideoRes() ) {
				if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
					this.ytforceres = "highres";
				}
				if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
					this.ytforceres = "highres";
				}
				if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
					this.ytforceres = "hd1080";
				}
				if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
					this.ytforceres = "hd720";
				}
				if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
					this.ytforceres = "large";
				}
				if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
					this.ytforceres = "medium";
				}
				if ( window.innerHeight <= 240 ) {
					this.ytforceres = "small";
				}
				
				this.player.setPlaybackQuality(this.ytforceres);
				console.log("Forcing Quality Change to " + this.ytforceres);
			}

			this.interval = setInterval( this.think.bind(this), 100 );
		};

	};
	registerPlayer( "youtubelive", YouTubeLiveVideo );

	var VimeoVideo = function() {

		var self = this;

		this.froogaloop = null;

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.videoId = id;

			var elem = document.getElementById("player1");
			if (elem) {
				$f(elem).removeEvent('ready');
				this.froogaloop = null;
				elem.parentNode.removeChild(elem);
			}

			var url = "https://player.vimeo.com/video/" + id + "?api=1&player_id=player1";

			var frame = document.createElement('iframe');
			frame.setAttribute('id', 'player1');
			frame.setAttribute('src', url);
			frame.setAttribute('width', '100%');
			frame.setAttribute('height', '100%');
			frame.setAttribute('frameborder', '0');

			document.getElementById('player').appendChild(frame);

			$f(frame).addEvent('ready', this.onReady);
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume / 100;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;

			// Set minimum of 1 seconds due to Awesomium issues causing
			// the Vimeo player not to load.
			this.startTime = Math.max( 1, seconds );
		};

		this.seek = function( seconds ) {
			if ( this.froogaloop != null && seconds > 1 ) {
				// We pause it before seeking because Vimeo Player + Awesomium is special
				this.froogaloop.api('pause');
				this.froogaloop.api('seekTo', seconds);
				this.froogaloop.api('play');
			}
		};

		this.onRemove = function() {
			this.froogaloop = null;
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.getCurrentTime = function() {
			if ( this.froogaloop != null ) {
				return self.currentTime || 1;
			}
		};

		this.think = function() {

			if ( this.froogaloop != null ) {

				if ( this.volume != this.lastVolume ) {
					this.froogaloop.api('setVolume', this.volume);
					this.lastVolume = this.volume;
				}

				if ( this.startTime != this.lastStartTime ) {
					this.seek( this.startTime );
					this.lastStartTime = this.startTime;
				}

				this.froogaloop.api('getVolume', function(v) {
					self.volume = parseFloat(v);
				});

				this.froogaloop.api('getCurrentTime', function(v) {
					self.currentTime = parseFloat(v);
				});

			}

		};

		this.onReady = function( player_id ) {
			self.lastStartTime = null;
			self.froogaloop = $f(player_id);
			self.froogaloop.api('play');
			setTimeout(function() { // Work around the player not actually being ready to seek until it's started playing :/
				// Also, if you manage to call this in the middle of it loading, it creates a race-condition where currentTime won't actually be where the video is! :D
				self.interval = setInterval( function() { self.think(self); }, 100 );
			}, 2500);
		};

	};
	registerPlayer( "vimeo", VimeoVideo );

	var TwitchVideo = function() {
		var self = this;

		this.videoInfo = {};

		/*
			Embed Player Object
		*/
		this.embed = function() {
			if ( !this.videoInfo.channel ) return;
			if ( !this.videoInfo.archive_id ) return;

			var flashvars = {
				eventsCallback: "onTwitchPlayerEvent",
				hostname: "www.twitch.tv",
				channel: this.videoInfo.channel,
				auto_play: true,
				start_volume: (this.volume != null ? this.volume : theater.volume != null ? theater.volume : 25),
				initial_time: (this.videoInfo.initial_time || 0)
			};

			var id = this.videoInfo.archive_id.slice(1);
			var videoType = this.videoInfo.archive_id.substr(0, 1);

			flashvars.videoId = videoType + id;

			if (videoType == "c") {
				flashvars.chapter_id = id;
			} else {
				flashvars.archive_id = id;
			}

			var swfurl = "https://www-cdn.jtvnw.net/swflibs/TwitchPlayer.swf";

			var params = {
				"allowFullScreen": "true",
				"allowNetworking": "all",
				"allowScriptAccess": "always",
				"movie": swfurl,
				"wmode": "opaque",
				"bgcolor": "#000000"
			};

			swfobject.embedSWF(
				swfurl,
				"player",
				"100%",
				"100%",
				"9",
				false,
				flashvars,
				params
			);
		};

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;

			var info = id.split(',');

			this.videoInfo.channel = info[0];
			this.videoInfo.archive_id = info[1];

			this.embed();
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
			this.videoInfo.volume = volume;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
			this.videoInfo.initial_time = seconds;
		};

		this.seek = function( seconds ) {
			this.setStartTime( seconds );
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.think = function() {
			if ( this.player != null ) {
				if ( this.videoId != this.lastVideoId ) {
					this.lastVideoId = this.videoId;
				}

				if ( this.startTime != this.lastStartTime ) {
					this.embed(); // TODO: Try using setVideoTime
					this.lastStartTime = this.startTime;
				}

				if ( this.volume != this.lastVolume ) {
					this.embed(); // Why does the old player suck so much? https://discuss.dev.twitch.tv/t/twitch-embed-volume-controls/1693
					this.lastVolume = this.volume;
				}
			}
		};

		this.onReady = function() {
			this.player = document.getElementById('player');
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};
	};
	registerPlayer( "twitch", TwitchVideo );

	var TwitchStreamVideo = function() {
		var self = this;

		/*
			Embed Player Object
		*/
		this.embed = function() {
			var flashvars = {
				eventsCallback: "onTwitchPlayerEvent",
				hostname: "www.twitch.tv",
				hide_chat: true,
				channel: this.videoId,
				embed: 0,
				auto_play: true,
				start_volume: (this.volume != null ? this.volume : theater.volume != null ? theater.volume : 25)
			};

			var swfurl = "https://www-cdn.jtvnw.net/swflibs/TwitchPlayer.swf";

			var params = {
				"allowFullScreen": "true",
				"allowNetworking": "all",
				"allowScriptAccess": "always",
				"movie": swfurl,
				"wmode": "opaque",
				"bgcolor": "#000000"
			};

			swfobject.embedSWF(
				swfurl,
				"player",
				"100%",
				"100%",
				"9",
				false,
				flashvars,
				params
			);
		};

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;
			this.embed();
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.think = function() {
			if ( this.player != null ) {

				if ( this.videoId != this.lastVideoId ) {
					this.lastVideoId = this.videoId;
				}

				 if ( this.volume != this.lastVolume ) {
					this.embed(); // Why does the old player suck so much? https://discuss.dev.twitch.tv/t/twitch-embed-volume-controls/1693
					this.lastVolume = this.volume;
				}
			}
		};

		this.onReady = function() {
			this.player = document.getElementById('player');
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};
	};
	registerPlayer( "twitchstream", TwitchStreamVideo );

	var UrlVideo = function() {

		var self = this;

		/*
			Embed Player Object
		*/
		this.embed = function() {

			var elem = document.getElementById("player1");
			if (elem) {
				elem.parentNode.removeChild(elem);
			}

			var frame = document.createElement('iframe');
			frame.setAttribute('id', 'player1');
			frame.setAttribute('src', this.videoId);
			frame.setAttribute('width', '100%');
			frame.setAttribute('height', '100%');
			frame.setAttribute('frameborder', '0');

			document.getElementById('player').appendChild(frame);

		};

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;

			// Wait for player to be ready
			if ( this.player == null ) {
				this.lastVideoId = this.videoId;
				this.embed();

				var i = 0;
				var interval = setInterval( function() {
					var el = document.getElementById("player");
					if(el){
						clearInterval(interval);
						self.onReady();
					}

					i++;
					if (i > 100) {
						console.log("Error waiting for player to load");
						clearInterval(interval);
					}
				}, 33);
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.think = function() {

			if ( this.player ) {
				
				if ( this.videoId != this.lastVideoId ) {
					this.embed();
					this.lastVideoId = this.videoId;
				}

			}

		};

		this.onReady = function() {
			this.player = document.getElementById('player');
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};

	};
	registerPlayer( "url", UrlVideo );

	// Thanks to WinterPhoenix96 for helping with Livestream support
	/*
	var LivestreamVideo = function() {

		var flashvars = {};

		var swfurl = "https://cdn.livestream.com/chromelessPlayer/wrappers/JSPlayer.swf";
		// var swfurl = "http://cdn.livestream.com/chromelessPlayer/v20/playerapi.swf";

		var params = {
			// "allowFullScreen": "true",
			"allowNetworking": "all",
			"allowScriptAccess": "always",
			"movie": swfurl,
			"wmode": "opaque",
			"bgcolor": "#000000"
		};

		swfobject.embedSWF(
			swfurl,
			"player",
			"100%",
			"100%",
			"9.0.0",
			"expressInstall.swf",
			flashvars,
			params
		);

		// Standard Player Methods
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume / 100;
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		// Player Specific Methods
		this.think = function() {

			if ( this.player != null ) {

				if ( this.videoId != this.lastVideoId ) {
					this.player.load( this.videoId );
					this.player.startPlayback();
					this.lastVideoId = this.videoId;
				}
				
				if ( this.volume != this.lastVolume ) {
					this.player.setVolume( this.volume );
					this.lastVolume = this.volume;
				}
				
			}

		};
		
		this.onReady = function() {
			this.player = document.getElementById('player');

			var self = this;
			this.interval = setInterval( function() { self.think(self); }, 100 );
			this.player.setVolume( this.volume );
		};
		
	};
	registerPlayer( "livestream", LivestreamVideo )
	*/

	var HtmlVideo = function() {

		/*
			Embed Player Object
		*/
		this.embed = function() {

			var elem = document.getElementById("player1");
			if (elem) {
				elem.parentNode.removeChild(elem);
			}

			var content = document.createElement('div');
			content.setAttribute('id', 'player1');
			content.style.width = "100%";
			content.style.height = "100%";
			content.innerHTML = this.videoId;

			document.getElementById('player').appendChild(content);

		};

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;
			this.embed();
		};

	};
	registerPlayer( "html", HtmlVideo );

	var UstreamLiveVideo = function() {
		
		var pre_player = document.createElement('iframe');
		pre_player.src = "https://www.ustream.tv/embed/1?controls=false"; // bogus channel
		pre_player.id = "player";
		pre_player.width = "100%";
		pre_player.height = "100%";
		var player_container = document.getElementById('player').parentNode;
		player_container.removeChild(document.getElementById('player'));
		player_container.appendChild(pre_player);
		
		var viewer = UstreamEmbed('player');
		
		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.think = function() {

			if ( this.player != null ) {
				if ( this.videoId != this.lastVideoId ) {
					this.player.callMethod( 'load', 'channel', this.videoId );

					var self = this;
					setTimeout(function(){self.player.callMethod('play');}, 3000);

					setTimeout(function(){
						if ( theater.isForceVideoRes() ) {
							if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
								this.player.callMethod( 'quality', 16 );
							}
							if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
								this.player.callMethod( 'quality', 16 );
							}
							if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
								this.player.callMethod( 'quality', 16 );
							}
							if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
								this.player.callMethod( 'quality', 16 );
							}
							if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
								this.player.callMethod( 'quality', 2 );
							}
							if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
								this.player.callMethod( 'quality', 1 );
							}
							if ( window.innerHeight <= 240 ) {
								this.player.callMethod( 'quality', 0 );
							}
						};
					}, 5000);

					this.lastVideoId = this.videoId;
				}

				if ( this.volume != this.lastVolume ) {
					this.player.callMethod( 'volume', (this.volume < 100) ? this.volume : 99); // 100% Volume on this Player mutes it
					this.lastVolume = this.volume;
				}
			}

		};
		
		this.onReady = function() {
			this.player = viewer;
			
			var self = this;
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};
		
		var self = this;
		setTimeout(function(){self.onReady()}, 2000);
	};
	registerPlayer( "ustreamlive", UstreamLiveVideo );

	var YukiTheaterRTMP = function() {
		videojs.options.flash.swf = "video-js-5.9.2/video-js.swf"

		var pre_player = document.createElement('video');
		pre_player.className = "video-js vjs-default-skin";
		pre_player.id = "player";
		pre_player.preload = "auto";
		pre_player.autoplay = "true";
		var player_container = document.getElementById('player').parentNode;
		player_container.removeChild(document.getElementById('player'));
		player_container.appendChild(pre_player);

		var viewer = videojs('player');
		viewer.poster("https://winterphoenix96.github.io/rtmp-thumbnails/default.png");

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastVideoId = null;
			this.videoId = id;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume / 100;
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.think = function() {

			if ( this.player != null ) {
				if ( this.videoId != this.lastVideoId ) {
					this.player.src({ type: "rtmp/mp4", src: "rtmp://rtmp.yukitheater.org/live/" + this.videoId + "/"});
					this.lastVideoId = this.videoId;
					this.lastSrcChange = Math.round(Date.now()/1000) + 5; // Wait 5 seconds and then try again if it isn't working
				}

				if (this.lastSrcChange != "undefined") {
					var curTime = Math.round(Date.now()/1000)
					if (curTime >= this.lastSrcChange && this.player.readyState() === 0) {
						console.log("Attempt to load RTMP Stream Failed! Retrying...");
						this.player.src({ type: "rtmp/mp4", src: "rtmp://rtmp.yukitheater.org/live/" + this.videoId + "/"});
						this.lastSrcChange = Math.round(Date.now()/1000) + 5;
					}
				}

				if ( this.volume != this.lastVolume ) {
					this.player.volume( this.volume );
					this.lastVolume = this.volume;
				}
			}
		};

		this.onReady = function() {
			this.player = viewer;

			var self = this;
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};
		
		this.toggleControls = function( enabled ) {
			this.player.controls(enabled);
		};
		
		var self = this;
		viewer.ready(function(){self.onReady();});
		
	};
	registerPlayer( "yukirtmp", YukiTheaterRTMP );

	var googleVideoITAG = {
		18: "640x360",
		22: "1280x720",
		37: "1920x1080",
		59: "854x480"
	};

	var Kiss = function() {
		// RSK Decryption Key prep
		var rskCount = 0;
		$kissenc_kissasian_init(window, function() {
			rskCount++;
		});
		$kissenc_kisscartoon_init(window, function() {
			rskCount++;
		});

		// JW7 Key
		jwplayer.key="GBbtI9R8M4R2gQOTSs7m7AdoMdxpK3DD4IcgmQ==";

		/*
			Embed Player Object
		*/
		var viewer = jwplayer("player");
		viewer.setup({
			height: "100%",
			width: "100%",
			controls: false,
			autostart: true,
			primary: 'flash',
			displaytitle: true,
			file: "example.mp4"
		});

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastStartTime = null;
			this.lastVideoId = null;
			this.videoId = id;
			this.sentAltDuration = false;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
		};

		this.seek = function( seconds ) {
			if ( this.player != null ) {
				this.player.seek( seconds );

				if ( this.player.getState() == "paused" || this.player.getState() == "idle" ) {
					this.player.play(true);
				}
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.getCurrentTime = function() {
			if ( this.player != null ) {
				return this.player.getPosition();
			}
		};

		this.canChangeTime = function() {
			if ( this.player != null ) {
				//Is loaded and it is not buffering
				return this.player.getState() != "buffering";
			}
		};

		this.returnJWPlayerSources = function(newSources) {
			// Base64 -> String -> Array
			var decryptedSources = eval(atob(newSources));

			this.player.load([{ sources: decryptedSources }]);
		}

		this.think = function() {
			if ( this.player != null ) {
				if ( theater.isForceVideoRes() && this.player.getState() == "playing" ) {
					if ( this.lastWindowHeight != window.innerHeight ) {
						var qualityLevels = this.player.getPlaylist()[0].sources;
						var resMatching = [];
						var defaultQuality = null;

						for (var i=0; i < qualityLevels.length; i++) {
							resMatching[qualityLevels[i]["label"]] = i;

							if (qualityLevels[i]["default"]) {
								defaultQuality = i;
							}
						}

						if (defaultQuality == null) {
							defaultQuality = ("720p" in resMatching) ? resMatching["720p"] : 1; // We're just gonna guess! :D
						}

						if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
							this.forceRes = ("1080p" in resMatching) ? resMatching["1080p"] : defaultQuality;
						}
						if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
							this.forceRes = ("1080p" in resMatching) ? resMatching["1080p"] : defaultQuality;
						}
						if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
							this.forceRes = ("1080p" in resMatching) ? resMatching["1080p"] : defaultQuality;
						}
						if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
							this.forceRes = ("720p" in resMatching) ? resMatching["720p"] : defaultQuality;
						}
						if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
							this.forceRes = ("480p" in resMatching) ? resMatching["480p"] : defaultQuality;
						}
						if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
							this.forceRes = ("360p" in resMatching) ? resMatching["360p"] : defaultQuality;
						}
						if ( window.innerHeight <= 240 ) {
							this.forceRes = ("240p" in resMatching) ? resMatching["240p"] : defaultQuality;
						}

						this.player.setCurrentQuality(this.forceRes);
						console.log("Forcing Quality Change to " + this.forceRes);

						this.lastWindowHeight = window.innerHeight;
					}
				}

				if ( this.videoId != this.lastVideoId ) {
					var decryptedSources = null;

					if (this.videoId.lastIndexOf("jw_kisscartoon_", 0) === 0) {
						// Encrypted thxa variable (SHA256+AES+Base64) -> String
						decryptedSources = $kissenc_kisscartoon.decrypt(this.videoId.replace("jw_kisscartoon_", ""));
					} else if (this.videoId.lastIndexOf("jw_kissasian_", 0) === 0) {
						// Encrypted thxa variable (SHA256+AES+Base64) -> String
						decryptedSources = $kissenc_kissasian.decrypt(this.videoId.replace("jw_kissasian_", ""));
					} else {
						// Base64 -> String
						decryptedSources = atob(this.videoId.replace("jw_", ""));
					}

					if (!decryptedSources || decryptedSources == "") {
						theater.resetPlayer();
						theater.getPlayerContainer().innerHTML = "<div id='player'><div style='color: red;'>ERROR: Kiss Video Sources Decryption Failure. Try Refreshing!</div></div>";
						return;
					};

					// Fix any googlevideo links that require HTTPS
					decryptedSources = decryptedSources.replace("http://", "https://");

					// Decrypted/Decoded String -> Array
					decryptedSources = eval(decryptedSources);

					var self = this;
					setTimeout(function(){
						if (self.player != null) {
							if (!self.player.getPlaylist()[0] || self.player.getPlaylist()[0].file == "example.mp4") { // Let's make sure it moved on with loading...
								theater.resetPlayer();
								theater.getPlayerContainer().innerHTML = "<div id='player'><div style='color: red;'>ERROR: Kiss Video Sources Load Failure.<br />Try disabling IPv6 and then rebooting your PC!</div></div>";
								return;
							}
						}
					}, 20000);

					// Send it over to Lua to process any redirects
					console.log("RUNLUA: theater.GetJWPlayerSources('" + btoa(JSON.stringify(decryptedSources)) + "')");

					/*var isActuallyYouTubeCompatible = false;
					for (var sourceKey in decryptedSources) {
						if (decryptedSources[sourceKey].file.search("googlevideo") != -1) {
							isActuallyYouTubeCompatible = true
						}
						break;
					}

					if (isActuallyYouTubeCompatible) {
						//"fmt_list=%s&fmt_stream_map=%s&video_id=non&fs=1&hl=en&autoplay=1&ps=picasaweb&playerapiid=uniquePlayerId&t=1&auth_timeout=86400000000"
						var fmt_list = "fmt_list=";
						var fmt_stream_map = "fmt_stream_map=";

						for (var sourceKey in decryptedSources) {
							var mapEntry = decryptedSources[sourceKey].file;
							mapEntry = mapEntry.replace(/sparams=([\w,]+)/, function(match) {
								var newSParams = encodeURIComponent(match);
								newSParams = newSParams.replace("%3D", "=");
								return newSParams;
							});

							var itag = /itag=(\d+)/.exec(mapEntry)[1];
							var itagMatch = googleVideoITAG[itag] ? googleVideoITAG[itag] : 0;

							fmt_list = fmt_list + encodeURIComponent(itag + "/" + itagMatch + ",");
							fmt_stream_map = fmt_stream_map + encodeURIComponent(itag + "|" + mapEntry + ",");
						};

						// Remove the extra %2C (,) at the end
						fmt_list = fmt_list.slice(0, -3);
						fmt_stream_map = fmt_stream_map.slice(0, -3);

						var ytPlayerFlashvars = fmt_list + "&" + fmt_stream_map + "&video_id=non&autoplay=1&t=1&vq=hd720";
						//var ytPlayerFlashvars = "fmt_list=37%2F1920x1080%2C22%2F1280x720%2C59%2F854x480%2C18%2F640x360&amp;fmt_stream_map=37%7Chttps%3a%2f%2fredirector.googlevideo.com%2fvideoplayback%3frequiressl%3dyes%26id%3dbfae21f003b4fb47%26itag%3d37%26source%3dwebdrive%26ttl%3dtransient%26app%3dtexmex%26ip%3d2001%3a19f0%3a6000%3a9ad4%3a5400%3aff%3afe20%3a66ec%26ipbits%3d32%26expire%3d1470980755%26sparams%3drequiressl%252Cid%252Citag%252Csource%252Cttl%252Cip%252Cipbits%252Cexpire%26signature%3d73CB5EAE755DD25E091BADD4C7E5EB35E1096AFD.930A476D066A9A001215A337080E49E733DEAF83%26key%3dck2%26mm%3d30%26mn%3dsn-a5m7lne7%26ms%3dnxu%26mt%3d1470966201%26mv%3du%26nh%3dIgpwcjAyLmxheDAyKgkxMjcuMC4wLjE%26pl%3d38%26sc%3dyes%2C22%7Chttps%3a%2f%2fredirector.googlevideo.com%2fvideoplayback%3frequiressl%3dyes%26id%3dbfae21f003b4fb47%26itag%3d22%26source%3dwebdrive%26ttl%3dtransient%26app%3dtexmex%26ip%3d2001%3a19f0%3a6000%3a9ad4%3a5400%3aff%3afe20%3a66ec%26ipbits%3d32%26expire%3d1470980755%26sparams%3drequiressl%252Cid%252Citag%252Csource%252Cttl%252Cip%252Cipbits%252Cexpire%26signature%3dAA09264426A0CA6FB0B22A538AC14A9BCD50267C.3FCA5E18F4D046B9D761156185C565C423E5D098%26key%3dck2%26mm%3d30%26mn%3dsn-a5m7lne7%26ms%3dnxu%26mt%3d1470966201%26mv%3du%26nh%3dIgpwcjAyLmxheDAyKgkxMjcuMC4wLjE%26pl%3d38%26sc%3dyes%2C59%7Chttps%3a%2f%2fredirector.googlevideo.com%2fvideoplayback%3frequiressl%3dyes%26id%3dbfae21f003b4fb47%26itag%3d59%26source%3dwebdrive%26ttl%3dtransient%26app%3dtexmex%26ip%3d2001%3a19f0%3a6000%3a9ad4%3a5400%3aff%3afe20%3a66ec%26ipbits%3d32%26expire%3d1470980755%26sparams%3drequiressl%252Cid%252Citag%252Csource%252Cttl%252Cip%252Cipbits%252Cexpire%26signature%3d3C4F628478F98E9881E00C9E5A339FF2F2F1ADB7.11317BB4595D96F80FDAEDC3DF87F5EA31110189%26key%3dck2%26mm%3d30%26mn%3dsn-a5m7lne7%26ms%3dnxu%26mt%3d1470966201%26mv%3du%26nh%3dIgpwcjAyLmxheDAyKgkxMjcuMC4wLjE%26pl%3d38%26sc%3dyes%2C18%7Chttps%3a%2f%2fredirector.googlevideo.com%2fvideoplayback%3frequiressl%3dyes%26id%3dbfae21f003b4fb47%26itag%3d18%26source%3dwebdrive%26ttl%3dtransient%26app%3dtexmex%26ip%3d2001%3a19f0%3a6000%3a9ad4%3a5400%3aff%3afe20%3a66ec%26ipbits%3d32%26expire%3d1470980755%26sparams%3drequiressl%252Cid%252Citag%252Csource%252Cttl%252Cip%252Cipbits%252Cexpire%26signature%3dF3AAE46B46F688BCB4B5FCC4C9217BE92CA728.8AE330008C22881FBAADC7CA11E3BCC679DE0B7C%26key%3dck2%26mm%3d30%26mn%3dsn-a5m7lne7%26ms%3dnxu%26mt%3d1470966201%26mv%3du%26nh%3dIgpwcjAyLmxheDAyKgkxMjcuMC4wLjE%26pl%3d38%26sc%3dyes&amp;video_id=non&amp;fs=1&amp;hl=en&amp;autoplay=1&amp;ps=picasaweb&amp;playerapiid=uniquePlayerId&amp;t=1&amp;auth_timeout=86400000000";

						theater.loadVideo("kissyoutube", "yt_" + btoa(ytPlayerFlashvars), this.startTime);
					} else {
						var self = this;
						setTimeout(function(){
							if (self.player != null) {
								if (!self.player.getPlaylist()[0] || self.player.getPlaylist()[0].file == "example.mp4") { // Let's make sure it moved on with loading...
									theater.resetPlayer();
									theater.getPlayerContainer().innerHTML = "<div id='player'><div style='color: red;'>ERROR: Kiss Video Sources Load Failure.<br />Try disabling IPv6 and then rebooting your PC!</div></div>";
									return;
								}
							}
						}, 20000);

						this.player.load([{ sources: decryptedSources }]);
					}*/

					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				// Wait until it's ready before sending Duration
				if ( this.player.getPlaylist()[0] && this.player.getPlaylist()[0].file != "example.mp4" && !this.sentAltDuration && this.player.getState() == "playing" && this.player.getDuration() > 0 ) {
					console.log("RUNLUA: theater.SendAltDuration(" + this.player.getDuration() + ")");
					this.sentAltDuration = true;
				}

				if ( this.player.getState() != "idle" ) {

					if ( this.startTime != this.lastStartTime ) {
						this.seek( this.startTime );
						this.lastStartTime = this.startTime;
					}

					if ( this.volume != this.player.getVolume() ) {
						this.player.setVolume( this.volume );
						this.volume = this.player.getVolume();
					}
				}
			}
		};

		this.onReady = function() {
			if (rskCount >= 2) {
				this.player = viewer;

				var self = this;
				this.interval = setInterval( function() { self.think(self); }, 100 );
			} else {
				var self = this;
				setTimeout(function() {self.onReady();}, 100);
			}
		};

		this.toggleControls = function( enabled ) {
			this.player.setControls(enabled);
		};

		var self = this;
		viewer.on('ready', function(){self.onReady();});
		//viewer.on('setupError', function(){document.getElementById('player').innerHTML = "Uh oh";});
	};
	registerPlayer( "kissanime", Kiss );
	registerPlayer( "kissasian", Kiss );
	registerPlayer( "kisscartoon", Kiss );

	var KissYT = function() {
		// RSK Decryption Key prep
		var rskComplete = false;
		var rskCount = 0;
		$kissenc_kissasian_init(window, function() {
			rskCount++;
		});
		$kissenc_kisscartoon_init(window, function() {
			rskCount++;
		});

		/*
			Embed Player Object
		*/
		var params = {
			allowScriptAccess: "always",
			bgcolor: "#000000",
			wmode: "opaque"
		};

		var attributes = {
			id: "player",
		};

		var url = "https://www.youtube.com/get_player?enablejsapi=1&modestbranding=1";

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			// We have to reinitialize the Flash Object everytime we change the video
			this.lastStartTime = null;
			this.lastVideoId = null;
			this.videoId = id;

			// Decrypt or Base64 Decode for the flashvars
			// They've changed encryption protocols 3 times now. Kiss's devs are fucking insane.
			if (id.lastIndexOf("yt_kisscartoon_", 0) === 0) {
				id = $kissenc_kisscartoon.decrypt(id.replace("yt_kisscartoon_", ""));
			} else if (id.lastIndexOf("yt_kissasian_", 0) === 0) {
				id = $kissenc_kissasian.decrypt(id.replace("yt_kissasian_", ""));
			} else {
				id = atob(id.replace("yt_", ""));
			};

			if (!id || id == "") {
				theater.resetPlayer();
				theater.getPlayerContainer().innerHTML = "<div id='player'><div style='color: red;'>ERROR: Kiss Video Sources Decryption Failure. Try Refreshing!</div></div>";
				return;
			};

			var self = this;
			setTimeout(function(){
				if (self.player != null) {
					if ((typeof(self.player.getPlayerState) === "function") && (self.player.getPlayerState() == -1)) { // Let's make sure it actually loaded...
						theater.resetPlayer();
						theater.getPlayerContainer().innerHTML = "<div id='player'><div style='color: red;'>ERROR: Kiss Video Sources Load Failure.<br />Try disabling IPv6 and then rebooting your PC!</div></div>";
						return;
					}
				}
			}, 20000);

			var flashvars = {};
			var k;
			var v;
			for (k in id.split("&")) {
				for (v in id.split("&")[k].split("=")) {
					if ((typeof(id.split("&")[k].split("=")[v - 1]) != "undefined") && (typeof(id.split("&")[k].split("=")[v]) != "undefined")) {
						flashvars[id.split("&")[k].split("=")[v - 1].replace("amp;", "")] = id.split("&")[k].split("=")[v];
					};
				};
			};

			swfobject.embedSWF( url, "player", "100%", "100%", "9", null, flashvars, params, attributes );

			this.sentAltDuration = false;
			this.initSeek = false;
		}

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
		};

		this.seek = function( seconds ) {
			if ( this.player != null ) {
				this.player.seekTo( seconds, true );

				// Video isn't playing
				if ( this.player.getPlayerState() != 1 ) {
					this.player.playVideo();
				}
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.getCurrentTime = function() {
			if ( this.player != null ) {
				return this.player.getCurrentTime();
			}
		};

		this.canChangeTime = function() {
			if ( this.player != null ) {
				//Is loaded and it is not buffering
				return this.player.getVideoBytesTotal() != -1 && this.player.getPlayerState() != 3;
			}
		};

		this.think = function() {
			if ( this.player != null ) {
				if ( theater.isForceVideoRes() ) {
					if ( this.lastWindowHeight != window.innerHeight ) {
						if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
							this.ytforceres = "highres";
						}
						if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
							this.ytforceres = "highres";
						}
						if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
							this.ytforceres = "hd1080";
						}
						if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
							this.ytforceres = "hd720";
						}
						if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
							this.ytforceres = "large";
						}
						if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
							this.ytforceres = "medium";
						}
						if ( window.innerHeight <= 240 ) {
							this.ytforceres = "small";
						}

						this.player.setPlaybackQuality(this.ytforceres);
						console.log("Forcing Quality Change to " + this.ytforceres);

						this.lastWindowHeight = window.innerHeight;
					}
				}

				if ( this.videoId != this.lastVideoId ) {
					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				if ( !this.sentAltDuration && (typeof(this.player.getDuration) === "function") && this.player.getDuration() > 0 ) { // Wait until it's ready
					console.log("RUNLUA: theater.SendAltDuration(" + this.player.getDuration() + ")");
					this.sentAltDuration = true;
				}

				if ( (typeof(this.player.getPlayerState) === "function") && this.player.getPlayerState() != -1 ) {
					// Since startSeconds isn't supported with the FMT Mode we're using...
					if ( !this.initSeek ) {
						this.seek( this.startTime + 3 ); // Assume 3 seconds of buffering
						this.initSeek = true
					}

					if ( this.startTime != this.lastStartTime ) {
						this.seek( this.startTime );
						this.lastStartTime = this.startTime;
					}

					if ( this.volume != this.player.getVolume() ) {
						this.player.setVolume( this.volume );
						this.volume = this.player.getVolume();
					}
				}
			}
		};

		this.onReady = function() {
			if (rskCount >= 2) {
				this.player = document.getElementById('player');

				if ( theater.isForceVideoRes() ) {
					if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
						this.ytforceres = "highres";
					}
					if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
						this.ytforceres = "highres";
					}
					if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
						this.ytforceres = "hd1080";
					}
					if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
						this.ytforceres = "hd720";
					}
					if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
						this.ytforceres = "large";
					}
					if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
						this.ytforceres = "medium";
					}
					if ( window.innerHeight <= 240 ) {
						this.ytforceres = "small";
					}

					this.player.setPlaybackQuality(this.ytforceres);
					console.log("Forcing Quality Change to " + this.ytforceres);

					this.lastWindowHeight = window.innerHeight;
				};

				var self = this;
				this.interval = setInterval( function() { self.think(self); }, 100 );
			} else {
				var self = this;
				setTimeout(function() {self.onReady();}, 100);
			}
		};
	}
	registerPlayer( "kissyoutube", KissYT );

	var KissOL = function() {
		this.setVideo = function( id ) {
			theater.getPlayerContainer().innerHTML = "<div id='player'><div style='color: red;'>ERROR: Kiss OpenLoad support not yet implemented.<br />OpenLoad ID: " + id.replace("ol_", "") + "<br />It's not me...it's them.</div></div>";
		}
	}
	registerPlayer( "kissopenload", KissOL );

	var Dailymotion = function() {
		var viewer = DM.player(document.getElementById("player"), {
			width: "100%",
			height: "100%",
			params: {
				autoplay: true,
				controls: true,
			}
		});

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastStartTime = null;
			this.lastVideoId = null;
			this.videoId = id;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume / 100;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
		};

		this.seek = function( seconds ) {
			if ( this.player != null ) {
				this.player.seek( seconds );

				// Video isn't playing
				if (this.player.paused) {
					this.player.play();
				}
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.getCurrentTime = function() {
			if ( this.player != null ) {
				return this.player.currentTime;
			}
		};

		this.think = function() {
			if ( this.player != null ) {
				if ( this.videoId != this.lastVideoId ) {
					this.player.load(this.videoId, {
						autoplay: true,
						start: this.startTime,
					});
					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				if ( this.startTime != this.lastStartTime ) {
					this.seek( this.startTime );
					this.lastStartTime = this.startTime;
				}

				if ( this.volume != this.lastVolume ) {
					this.player.setVolume( this.volume );
					this.lastVolume = this.player.volume;
				}
			}
		};

		this.onReady = function() {
			this.player = viewer;

			var self = this;
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};

		this.toggleControls = function( enabled ) {
			//this.player.controls(enabled);
		};

		var self = this;
		viewer.addEventListener("apiready", function(){self.onReady();});
	};
	registerPlayer( "dailymotion", Dailymotion );
	registerPlayer( "dailymotionlive", Dailymotion );

	var HitboxLive = function() {
		videojs.options.flash.swf = "video-js-5.9.2/video-js.swf"

		var pre_player = document.createElement('video');
		pre_player.className = "video-js vjs-default-skin";
		pre_player.id = "player";
		pre_player.preload = "auto";
		pre_player.autoplay = "true";
		var player_container = document.getElementById('player').parentNode;
		player_container.removeChild(document.getElementById('player'));
		player_container.appendChild(pre_player);

		var viewer = videojs('player');

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastStartTime = null;
			this.lastVideoId = null;
			this.videoId = id;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume / 100;
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.think = function() {
			if ( this.player != null ) {
				if ( this.videoId != this.lastVideoId ) {
					// https://www.hitbox.tv/api/player/config/live/{channel_id}?autoplay=true&embed=true&no_interruption=false&ssl=true
					var playerJSON = new XMLHttpRequest();
					var self = this;
					playerJSON.onreadystatechange = function() {
						if (playerJSON.readyState == 4 && playerJSON.status == 200) {
							var parsedJSON = JSON.parse(playerJSON.responseText);
							self.player.src({type: "application/x-mpegURL", src: parsedJSON["clip"]["url"]});
						}
					}
					playerJSON.open("GET", "https://www.hitbox.tv/api/player/config/live/" + this.videoId + "?autoplay=true&embed=true&no_interruption=false&ssl=true", true);
					playerJSON.send();

					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				if ( this.volume != this.lastVolume ) {
					this.player.volume( this.volume );
					this.lastVolume = this.volume;
				}
			}
		};

		this.onReady = function() {
			this.player = viewer;

			var self = this;
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};

		this.toggleControls = function( enabled ) {
			this.player.controls(enabled);
		};

		var self = this;
		viewer.ready(function(){self.onReady();});
	};
	registerPlayer( "hitboxlive", HitboxLive );

	var Hitbox = function() {
		videojs.options.flash.swf = "video-js-5.9.2/video-js.swf"

		var pre_player = document.createElement('video');
		pre_player.className = "video-js vjs-default-skin";
		pre_player.id = "player";
		pre_player.preload = "auto";
		pre_player.autoplay = "true";
		var player_container = document.getElementById('player').parentNode;
		player_container.removeChild(document.getElementById('player'));
		player_container.appendChild(pre_player);

		var viewer = videojs('player');

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastStartTime = null;
			this.lastVideoId = null;
			this.videoId = id;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume / 100;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
		};

		this.seek = function( seconds ) {
			if ( this.player != null ) {
				this.player.currentTime( seconds );

				// Video isn't playing
				if (this.player.paused()) {
					this.player.play();
				}
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.getCurrentTime = function() {
			if ( this.player != null ) {
				return this.player.currentTime();
			}
		};

		this.think = function() {
			if ( this.player != null ) {
				if ( this.videoId != this.lastVideoId ) {
					// https://www.hitbox.tv/api/player/config/video/{video_id}?autoplay=true&embed=true&no_interruption=false&ssl=true
					// NOTE: Does not currently work due to their Access-Control-Allow-Origin Security Policy Header restricting it to hitbox.tv
					this.player.src({type: "application/x-mpegURL", src: "http://www.hitbox.tv/api/player/hlsvod/" + this.videoId + ".m3u8"});

					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				if ( this.startTime != this.lastStartTime ) {
					this.seek( this.startTime );
					this.lastStartTime = this.startTime;
				}

				if ( this.volume != this.lastVolume ) {
					this.player.volume( this.volume );
					this.lastVolume = this.volume;
				}
			}
		};

		this.onReady = function() {
			this.player = viewer;

			var self = this;
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};

		this.toggleControls = function( enabled ) {
			this.player.controls(enabled);
		};

		var self = this;
		viewer.ready(function(){self.onReady();});
	};
	registerPlayer( "hitbox", Hitbox );

	var MoeTube = function() {
		// JW7 Key
		jwplayer.key="GBbtI9R8M4R2gQOTSs7m7AdoMdxpK3DD4IcgmQ==";

		/*
			Embed Player Object
		*/
		var viewer = jwplayer("player");
		viewer.setup({
			height: "100%",
			width: "100%",
			controls: false,
			autostart: true,
			primary: 'flash',
			displaytitle: true,
			file: "example.mp4"
		});

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastStartTime = null;
			this.lastVideoId = null;
			this.videoId = id;
			this.sentAltDuration = false;
		};

		this.setVolume = function( volume ) {
			this.lastVolume = null;
			this.volume = volume;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
		};

		this.seek = function( seconds ) {
			if ( this.player != null ) {
				this.player.seek( seconds );

				if ( this.player.getState() == "paused" || this.player.getState() == "idle" ) {
					this.player.play(true);
				}
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		/*
			Player Specific Methods
		*/
		this.getCurrentTime = function() {
			if ( this.player != null ) {
				return this.player.getPosition();
			}
		};

		this.canChangeTime = function() {
			if ( this.player != null ) {
				//Is loaded and it is not buffering
				return this.player.getState() != "buffering";
			}
		};

		this.think = function() {
			if ( this.player != null ) {
				if ( theater.isForceVideoRes() && this.player.getState() == "playing" ) {
					if ( this.lastWindowHeight != window.innerHeight ) {
						var qualityLevels = this.player.getPlaylist()[0].sources;
						var resMatching = [];
						var defaultQuality = null;

						for (var i=0; i < qualityLevels.length; i++) {
							resMatching[qualityLevels[i]["label"]] = i;

							if (qualityLevels[i]["default"]) {
								defaultQuality = i;
							}
						}

						if (defaultQuality == null) {
							defaultQuality = ("720p" in resMatching) ? resMatching["720p"] : 1; // We're just gonna guess! :D
						}

						if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
							this.forceRes = ("1080p" in resMatching) ? resMatching["1080p"] : defaultQuality;
						}
						if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
							this.forceRes = ("1080p" in resMatching) ? resMatching["1080p"] : defaultQuality;
						}
						if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
							this.forceRes = ("1080p" in resMatching) ? resMatching["1080p"] : defaultQuality;
						}
						if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
							this.forceRes = ("720p" in resMatching) ? resMatching["720p"] : defaultQuality;
						}
						if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
							this.forceRes = ("480p" in resMatching) ? resMatching["480p"] : defaultQuality;
						}
						if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
							this.forceRes = ("360p" in resMatching) ? resMatching["360p"] : defaultQuality;
						}
						if ( window.innerHeight <= 240 ) {
							this.forceRes = ("240p" in resMatching) ? resMatching["240p"] : defaultQuality;
						}

						this.player.setCurrentQuality(this.forceRes);
						console.log("Forcing Quality Change to " + this.forceRes);

						this.lastWindowHeight = window.innerHeight;
					}
				}

				if ( this.videoId != this.lastVideoId ) {
					this.player.load([{
						sources: [{file: this.videoId, "default": "true", type: "mp4"}]
					}]);

					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				// Wait until it's ready before sending Duration
				if ( this.player.getPlaylist()[0] && this.player.getPlaylist()[0].file != "example.mp4" && !this.sentAltDuration && this.player.getState() == "playing" && this.player.getDuration() > 0 ) {
					console.log("RUNLUA: theater.SendAltDuration(" + this.player.getDuration() + ")");
					this.sentAltDuration = true;
				}

				if ( this.player.getState() != "idle" ) {

					if ( this.startTime != this.lastStartTime ) {
						this.seek( this.startTime );
						this.lastStartTime = this.startTime;
					}

					if ( this.volume != this.player.getVolume() ) {
						this.player.setVolume( this.volume );
						this.volume = this.player.getVolume();
					}
				}
			}
		};

		this.onReady = function() {
			this.player = viewer;

			var self = this;
			this.interval = setInterval( function() { self.think(self); }, 100 );
		};

		this.toggleControls = function( enabled ) {
			this.player.setControls(enabled);
		};

		var self = this;
		viewer.on('ready', function(){self.onReady();});
		//viewer.on('setupError', function(){document.getElementById('player').innerHTML = "Uh oh";});
	}
	registerPlayer( "moetube", MoeTube );
})();

/*
	API-specific global functions
*/

function onYouTubePlayerReady( playerId ) {
	var player = theater.getPlayer(),
		type = player && player.getType();
	if ( player && ((type == "youtube") || (type == "youtubelive") || (type == "kissyoutube")) ) {
		player.onReady();
	}
}

function livestreamPlayerCallback( event, data ) {
	if (event == "ready") {
		var player = theater.getPlayer();
		if ( player && (player.getType() == "livestream") ) {
			player.onReady();
		}
	}
}

function onTwitchPlayerEvent(event) {
	if (event[0].event == "playerInit") {
		var player = theater.getPlayer();
		if ( player && (player.getType() == "twitch" || player.getType() == "twitchstream") ) {
			player.onReady();
		}
	}
};

if (window.onTheaterReady) {
	onTheaterReady();
}

console.log("Loaded theater.js v" + theater.VERSION);
