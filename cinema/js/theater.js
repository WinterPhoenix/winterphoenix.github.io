if (window.swfobject == undefined) window.swfobject = null;
window.open = function() { return null; }; // prevent popups

if (!String.prototype.startsWith) {
	String.prototype.startsWith = function(searchString, position){
		position = position || 0;
		return this.substr(position, searchString.length) === searchString;
	};
}

var theater = {

	VERSION: "3.0.4-YukiTheater",

	playerContainer: null,
	playerContent: null,
	closedCaptions: false,
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

	enableCC: function() {
		this.closedCaptions = true;
	},

	isCCEnabled: function() {
		return this.closedCaptions;
	},

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

	playerLoadFailure: function() {
		this.resetPlayer();
		this.getPlayerContainer().innerHTML = "<div id='player'><div style='color: red;'>ERROR: Failed to load video player." + (clientHasFlash ? "" : "<br />This is probably because you are missing Abobe Flash Player.<br />Say /flash for instructions on how to fix this.") + "</div></div>";
	}
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

*/
(function() {

	var YouTubeVideo = function() {

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
					cc_load_policy: theater.isCCEnabled() ? 1 : 0
				},
				events: {
					onReady: onYouTubePlayerReady
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
	registerPlayer( "youtube", YouTubeVideo );
	registerPlayer( "youtubelive", YouTubeVideo );

	var VimeoVideo = function() {

		var player = null;

		// Vimeo's API requires a promise system while Cinema's is totally unequipped to handle it...
		// ...so we just sorta hack around that
		this.vimeoCurrentTime = 0;

		/*
			Standard Player Methods
		*/
		this.setVideo = function( id ) {
			this.lastStartTime = null;
			this.lastVideoId = null;
			this.videoId = id;

			if (player != null) {
				return;
			};

			var self = this;
			player = new Vimeo.Player("player", {
				width: window.innerWidth,
				height: window.innerHeight,
				id: id,
				autoplay: true
			});
			player.on("error", function(event) {
				if (event.name == "PlaybackError") {
					console.error("Vimeo Player Error: " + event.message);

					//theater.resetPlayer();
					theater.loadVideo("vimeo", self.videoId, self.startTime); // *sigh* Just...reload the stupid thing and try again.
				} else {
					//theater.playerLoadFailure();
				}
			});
			player.on("loaded", function() {
				self.player.play(); // This doesn't do anything other than make any errors appear if they should
			});

			this.onReady();
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
				this.setStartTime(seconds);
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		// Player Specific Methods
		this.getCurrentTime = function() {
			if ( this.player !== null ) {
				return this.vimeoCurrentTime;
			}
		};

		this.think = function() {

			if ( this.player !== null ) {

				if ( this.lastWindowHeight != window.innerHeight ) {
					// Since the player doesn't do it itself, we have to
					this.player.element.width = window.innerWidth;
					this.player.element.height = window.innerHeight;

					this.lastWindowHeight = window.innerHeight;
				}

				var self = this;
				this.player.getCurrentTime().then(function(seconds) {
					if (self.vimeoCurrentTime != seconds) {
						self.vimeoCurrentTime = seconds;
						self.lastVimeoTimeUpdate = Math.round(Date.now()/1000);
					}
				});

				if ( this.videoId != this.lastVideoId ) {
					this.player.loadVideo(this.videoId);

					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				if ( this.volume != this.lastVolume ) {
					this.player.setVolume( this.volume / 100 );
					this.lastVolume = this.volume;
				}

				if ( this.startTime != this.lastStartTime ) {
					this.player.setCurrentTime( this.startTime );
					this.lastStartTime = this.startTime;
				}
			}

		};

		this.onReady = function() {
			this.player = player;
			this.player.setVolume((this.volume != null ? this.volume : theater.volume != null ? theater.volume : 25) / 100);

			this.interval = setInterval( this.think.bind(this), 100 );
		};
	};
	registerPlayer( "vimeo", VimeoVideo );

	var TwitchVideo = function() {
		/*
			Embed Player Object
		*/
		var player = new Twitch.Player("player", {
			height: "100%",
			width: "100%"
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
			this.volume = volume;
		};

		this.setStartTime = function( seconds ) {
			this.lastStartTime = null;
			this.startTime = seconds;
		};

		this.seek = function( seconds ) {
			if ( this.player !== null ) {
				this.player.seek( seconds );
			}
		};

		this.onRemove = function() {
			clearInterval( this.interval );
		};

		// Player Specific Methods
		this.getCurrentTime = function() {
			if ( this.player !== null ) {
				return this.player.getCurrentTime();
			}
		};

		this.think = function() {

			if ( this.player !== null ) {

				if ( theater.isForceVideoRes() ) {
					if ( this.lastWindowHeight != window.innerHeight ) {
						var twitchRes = "chunked";

						if ( window.innerHeight <= 1536 && window.innerHeight > 1440 ) {
							twitchRes = "chunked";
						}
						if ( window.innerHeight <= 1440 && window.innerHeight > 1080 ) {
							twitchRes = "chunked";
						}
						if ( window.innerHeight <= 1080 && window.innerHeight > 720 ) {
							twitchRes = "chunked";
						}
						if ( window.innerHeight <= 720 && window.innerHeight > 480 ) {
							twitchRes = "high";
						}
						if ( window.innerHeight <= 480 && window.innerHeight > 360 ) {
							twitchRes = "medium";
						}
						if ( window.innerHeight <= 360 && window.innerHeight > 240 ) {
							twitchRes = "low";
						}
						if ( window.innerHeight <= 240 ) {
							twitchRes = "low";
						}

						this.player.setQuality(twitchRes);
						console.log("Forcing Quality Change to " + twitchRes);

						this.lastWindowHeight = window.innerHeight;
					}
				}

				if ( this.videoId != this.lastVideoId ) {
					if (this.videoId.startsWith("vod,")) {
						this.player.setVideo("v" + this.videoId.split(",")[1]);
					} else {
						this.player.setChannel( this.videoId );
					}

					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;

					// Apparently you have to do this for it to play reliably
					var self = this;
					setTimeout(function() {
						self.player.pause();
						self.player.play();

						self.player.setVolume( (this.volume != null ? this.volume : theater.volume != null ? theater.volume : 25) / 100 );
						self.player.setMuted( (this.volume != null ? this.volume : theater.volume != null ? theater.volume : 25) == 0 );
					}, 5000)
				}

				if ( this.volume != this.lastVolume ) {
					this.player.setVolume( this.volume / 100 );
					this.player.setMuted( this.volume == 0 );
					this.lastVolume = this.volume;
				}

				if ( this.startTime != this.lastStartTime ) {
					this.seek( this.startTime );
					this.lastStartTime = this.startTime;
				}

				if (this.player.getCurrentTime() == undefined) {
					theater.playerLoadFailure();
				}
			}

		};

		this.onReady = function() {
			this.player = player;
			this.interval = setInterval( this.think.bind(this), 100 );
		};

		//player.addEventListener("Twitch.Player.READY", this.onReady);
		this.onReady();
	};
	registerPlayer( "twitch", TwitchVideo );
	registerPlayer( "twitchstream", TwitchVideo );

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

	var UstreamVideo = function() {

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
					var splitVideoId = this.videoId.split(",")
					this.player.callMethod( 'load', splitVideoId[0], splitVideoId[1] );

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
		setTimeout(function(){self.onReady()}, 5000);
	};
	registerPlayer( "ustream", UstreamVideo );
	registerPlayer( "ustreamlive", UstreamVideo );

	var YukiTheaterRTMP = function() {
		var pre_player = document.createElement('video');
		pre_player.id = "player";

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

		if (pre_player.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') == "probably") {
			// Supports MP4, for HLS
			pre_player.style.width = "100%";
			pre_player.style.height = "100%";

			var player_container = document.getElementById('player').parentNode;
			player_container.removeChild(document.getElementById('player'));
			player_container.appendChild(pre_player);

			var hls = new Hls();
			hls.attachMedia(pre_player);

			/*
				Player Specific Methods
			*/
			this.think = function() {
				if (this.player != null) {
					if (this.videoId != this.lastVideoId) {
						this.player.loadSource("https://rtmp-hls.yukitheater.org/hls/" + this.videoId + ".m3u8");
						this.lastVideoId = this.videoId;
						this.lastSrcChange = Math.round(Date.now()/1000) + 5; // Wait 5 seconds and then try again if it isn't working
					}

					if (this.lastSrcChange != undefined) {
						var curTime = Math.round(Date.now()/1000);
						if (curTime >= this.lastSrcChange) {
							if (this.player.currentLevel === -1) {
								console.log("Attempt to load RTMP Stream Failed! Retrying...");
								this.player.loadSource("https://rtmp-hls.yukitheater.org/hls/" + this.videoId + ".m3u8");
							}

							this.lastSrcChange = Math.round(Date.now()/1000) + 5;
						}
					}

					if (this.volume != this.lastVolume) {
						pre_player.volume = this.volume;
						this.lastVolume = this.volume;
					}
				}
			};

			this.onReady = function() {
				this.player = hls;
				pre_player.play();

				var self = this;
				this.interval = setInterval( function() { self.think(self); }, 100 );
			};

			this.toggleControls = function( enabled ) {
				pre_player.controls = enabled;
			};

			var self = this;
			hls.on(Hls.Events.MEDIA_ATTACHED, function() {
				self.onReady();
			});
			hls.on(Hls.Events.ERROR, function(event, data) {
				//theater.playerLoadFailure();
			});
		} else {
			// Does not support MP4, for HLS
			videojs.options.flash.swf = "video-js-5.9.2/video-js.swf"

			pre_player.className = "video-js vjs-default-skin";
			pre_player.preload = "auto";
			pre_player.autoplay = "true";
			var player_container = document.getElementById('player').parentNode;
			player_container.removeChild(document.getElementById('player'));
			player_container.appendChild(pre_player);

			var viewer = videojs('player');
			viewer.poster("https://winterphoenix96.github.io/rtmp-thumbnails/default.png");

			/*
				Player Specific Methods
			*/
			this.think = function() {

				if ( this.player != null ) {
					if ( this.videoId != this.lastVideoId ) {
						this.player.src({ type: "rtmp/mp4", src: "rtmp://rtmp.yukitheater.org/show/" + this.videoId + "_src"});
						this.lastVideoId = this.videoId;
						this.lastSrcChange = Math.round(Date.now()/1000) + 5; // Wait 5 seconds and then try again if it isn't working
					}

					/*
					if (this.lastSrcChange != undefined) {
						var curTime = Math.round(Date.now()/1000)
						if (curTime >= this.lastSrcChange && this.player.readyState() === 0) {
							console.log("Attempt to load RTMP Stream Failed! Retrying...");
							this.player.src({ type: "rtmp/mp4", src: "rtmp://rtmp.yukitheater.org/show/" + this.videoId + "_src"});
							this.lastSrcChange = Math.round(Date.now()/1000) + 5;
						}
					}
					*/

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
			viewer.on("error", function(event) {
				if (viewer.error().code == 4) { // MEDIA_ERR_SRC_NOT_SUPPORTED
					theater.playerLoadFailure();
				}
			});
		}
	};
	registerPlayer( "yukirtmp", YukiTheaterRTMP );

	var JWPlayer_1 = function() {
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
			primary: document.createElement("video").canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') == "probably" ? "html5" : "flash",
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
			this.sentAltInfo = false;
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
						sources: eval(this.videoId)
					}]);

					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				// Wait until it's ready before sending Duration
				if ( this.player.getPlaylist()[0] && this.player.getPlaylist()[0].file != "example.mp4" && !this.sentAltInfo && this.player.getState() == "playing" && this.player.getDuration() > 0 ) {
					if (typeof(exTheater) != 'undefined') {
						exTheater.loadVideoDuration(this.player.getDuration());
					} else {
						console.log("exTheater not defined for loadVideoDuration!");
					}
					this.sentAltInfo = true;
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

				if (this.player.getState() == "buffering") {
					this.player.setControls(true);
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
		viewer.on("setupError", function(event) {
			theater.playerLoadFailure();
		});
	}
	registerPlayer( "9anime", JWPlayer_1 );
	registerPlayer( "fmovies", JWPlayer_1 );

	var JWPlayer_2 = function() {
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
			primary: document.createElement("video").canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"') == "probably" ? "html5" : "flash",
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
			this.sentAltInfo = false;
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
						sources: eval(this.videoId)
					}]);

					this.lastVideoId = this.videoId;
					this.lastStartTime = this.startTime;
				}

				// Wait until it's ready before sending Duration
				if ( this.player.getPlaylist()[0] && this.player.getPlaylist()[0].file != "example.mp4" && !this.sentAltInfo && this.player.getState() == "playing" && this.player.getDuration() > 0 ) {
					if (typeof(exTheater) != 'undefined') {
						exTheater.loadVideoDuration(this.player.getDuration());
					} else {
						console.log("exTheater not defined for loadVideoDuration!");
					}
					this.sentAltInfo = true;
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

				if (this.player.getState() == "buffering") {
					this.player.setControls(true);
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
		viewer.on('error', function(msg) {
			if (typeof(exTheater) != 'undefined' && typeof(exTheater.mediaError) != 'undefined') {
				exTheater.mediaError(msg);
			}
		});
		viewer.on("setupError", function(event) {
			theater.playerLoadFailure();
		});
	}
	registerPlayer( "gogoanime", JWPlayer_2 );
	registerPlayer( "animetwist", JWPlayer_2 );

})();

/*
	API-specific global functions
*/

function onYouTubePlayerReady( playerId ) {
	var player = theater.getPlayer(),
		type = player && player.getType();
	if ( player && ((type == "youtube") || (type == "youtubelive") || (type == "kissyoutube") || (type == "moetube")) ) {
		player.onReady();
	}
}

if (window.onTheaterReady) {
	onTheaterReady();
}

console.log("Loaded theater.js v" + theater.VERSION);
