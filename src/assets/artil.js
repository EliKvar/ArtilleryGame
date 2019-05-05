/// <reference types="@argonjs/argon" />
/// <reference types="three" />
// grab some handles on APIs we use

var Cesium = Argon.Cesium;
var Cartesian3 = Argon.Cesium.Cartesian3;
var ReferenceFrame = Argon.Cesium.ReferenceFrame;
var JulianDate = Argon.Cesium.JulianDate;
var CesiumMath = Argon.Cesium.CesiumMath;

var isTurningLeft = false;
var isTurningRight = false;

var angleLine;
var angleLine2;
var angleLine3;

var line;

var start = false;
var gunHeading = 0;
var gunElevation = 0;
var gunPower = 0;
var senderUID = null;
var globalUID = 1;
var playerInstances = null;




var playerStructure = {
        sender: null,
        timestamp: null,
        lat: null,
        lng: null,
		altitude: null,
		heading: null
      };

var bulletStructure = {
        sender: null,
        timestamp: null,
        lat: null,
        lng: null,
		alt: null,
		heading: null,
		angle: null,
		velocity: null
      };

var playerInstanceStructure = {
        lat: null,
        lng: null,
		altitude: null,
		heading: null,
		threejsObject: null
      };

function drawLine(v1,v2)
{
	if(!(v1!=null&&v2!=null))
		return;
	var v3 = new THREE.Vector3(v1.x,v1.y,v1.z);
	var v4 = new THREE.Vector3(v2.x,v2.y,v2.z);
	var lineGeometry = new THREE.Geometry();
	lineGeometry.vertices.push(v3);
	lineGeometry.vertices.push(v4);
	var lineMaterial = new THREE.LineBasicMaterial({ color: 0xFF0000 });
	var line = new THREE.Line(lineGeometry, lineMaterial);
	scene.add(line);
  return line;
	//console.log("Line generated "+v3.x+" "+v3.y+" "+v3.z+" "+v4.x+" "+v4.y+" "+v4.z);
}

var firebaseConfig = {
  apiKey: "AIzaSyB0RWPQK3jmLxMRy7DiBBT29hoRjVNfnpw",
  authDomain: "arty-57de8.firebaseapp.com",
  databaseURL: 'https://arty-57de8.firebaseio.com/',
  projectId: "arty-57de8",
  storageBucket: "arty-57de8.appspot.com"
};

firebase.initializeApp(firebaseConfig);

/**
      * Starting point for running the program. Authenticates the user.
      * @param {function()} onAuthSuccess - Called when authentication succeeds.
      */
      function initAuthentication(onAuthSuccess) {
        firebase.auth().signInAnonymously().catch(function(error) {
          if (error) {
            console.log('Login Failed!', error);
          }
        });  // Users will get a new id for every session.
      }

	firebase.auth().onAuthStateChanged(function(user) {
	if (user) {
		// User is signed in.
		var isAnonymous = user.isAnonymous;
		senderUID = user.uid;
		initFirebase();
	}});

	function initFirebase() {
	var players = firebase.database().ref().child('players');

		var startTime = new Date().getTime() - (60 * 10 * 1000);
	  players.orderByChild('timestamp').startAt(startTime).on('child_added',
          function(snapshot) {

            // Get that click from firebase.
            var newPosition = snapshot.val();
            var elapsed = new Date().getTime() - newPosition.timestamp;

            // Requests entries older than expiry time (10 minutes).
            var expirySeconds = Math.max(60 * 10 * 1000 - elapsed, 0);
            // Set client timeout to remove the point after a certain time.
            window.setTimeout(function() {
              // Delete the old point from the database.
              snapshot.ref().remove();
            }, expirySeconds);
          }
        );
		firebase.database().ref().child('players').on("value", function(snapshot) {
					var playerstruct = snapshot.val();
					var playerIStruct = Object.assign({}, playerInstanceStructure);
					playerIStruct.lat = parseFloat(playerstruct.lat);
					playerIStruct.lng = parseFloat(playerstruct.lng);
					playerIStruct.altitude = parseFloat(playerstruct.altitude);
					playerIStruct.heading = parseFloat(playerstruct.heading);
					//console.log(playerIStruct.lat);
					//console.log(playerIStruct.lng);
					//console.log(playerstruct);
					var playerLocationEntity = new Argon.Cesium.Entity({
						name: ""+globalUID++,
						position: Cartesian3.fromDegrees(playerIStruct.lat, playerIStruct.lng,0),
						orientation: Cesium.Quaternion.IDENTITY
					});
					if (!Argon.convertEntityReferenceFrame(playerLocationEntity, 1, app.stage)) {
						console.warn('Unable to convert to stage frame! At ~128');
					}

					var p = new THREE.Object3D;
					//p = object;
					p.name = ""+globalUID++;
					var Pose = app.getEntityPose(playerLocationEntity);
					if (Pose.poseStatus & Argon.PoseStatus.KNOWN) {
						//p.position=Pose.position;
						//Pose.position.copy(user.position);
						 user.position.copy(Pose.position);
						 //p.position.copy(Pose.position);
						 //Pose.position.copy(p.position);
						 p.position.x = Pose.position.x;
						 p.position.y = Pose.position.y;
						 p.position.z = Pose.position.z;
					}
					//p.position = playerLocationEntity.position;

					playerIStruct.threejsObject = p;
					if(playerInstances==null)
						playerInstances = new Array();
					p.position.z+=playerInstances.length;
					scene.add(p);
					playerInstances.push(playerIStruct);
					console.log("Number of active player models:"+playerInstances.length);
					drawLine(new THREE.Vector3(0,0,0),new THREE.Vector3(p.position.x,p.position.y,p.position.z));
				}, function (errorObject) {
					console.log("The read failed: " + errorObject.code);
			});
	  }

initAuthentication(initFirebase.bind(undefined));
// set up Argon
var app = Argon.init();
//app.view.element.style.zIndex = 0;
// this app uses geoposed content, so subscribe to geolocation updates
app.subscribeGeolocation({ enableHighAccuracy: true });
// set up THREE.  Create a scene, a perspective camera and an object
// for the user's location
var scene = new THREE.Scene();
var user = new THREE.Object3D;
//scene.add(camera);
scene.add(user);
// The CSS3DArgonRenderer supports mono and stereo views.  Currently
// not using it in this example, but left it in the code in case we
// want to add an HTML element near either geo object.
// The CSS3DArgonHUD is a place to put things that appear
// fixed to the screen (heads-up-display).
// In this demo, we are  rendering the 3D graphics with WebGL,
// using the standard WebGLRenderer, and using the CSS3DArgonHUD
// to manage the 2D display fixed content
var cssRenderer = new THREE.CSS3DArgonRenderer();
var hud = new THREE.CSS3DArgonHUD();
var renderer = new THREE.WebGLRenderer({
    alpha: true,
    logarithmicDepthBuffer: true,
    antialias: Argon.suggestedWebGLContextAntialiasAttribute
});
renderer.setPixelRatio(window.devicePixelRatio);
// Set the layers that should be rendered in our view. The order of sibling elements
// determines which content is in front (top->bottom = back->front)
app.view.setLayers([
    { source: renderer.domElement },
    { source: cssRenderer.domElement },
    { source: hud.domElement },
]);

var buzz = new THREE.Object3D;
var container;
var camera;
var object;
//User Input
var mortarYaw;
var mortarPitch;
var mortarPower = 0;





init();
function init() {



  container = document.createElement( 'div' );
  document.body.appendChild( container );
  camera = new THREE.PerspectiveCamera();
  // scene
  var ambientLight = new THREE.AmbientLight( 0xcccccc, 0.4 );
  scene.add( ambientLight );
  var pointLight = new THREE.PointLight( 0xffffff, 0.8 );
  camera.add( pointLight );
  scene.add( camera );
  // manager
  function loadModel() {
    //Seems to me that the model is being spawnerd via argon's geolocation on top of the user.
    //Change the scale and position numbers when we are able to see the object in the real world. Hard to tell if its sitting correctly with white background
    object.scale.x = 1;
    object.scale.y = 1;
    object.scale.z = 1;

  //  object.position.x += 1; //Move left and right
    object.position.z -= 2.4; //Move forward and back
    object.position.y -= .8; //Move up and down

    object.rotation.z -= 0; // Vertical rotation The numbers are weird for z rotation. Try .1 to .5 and -.1 to -.5
  //  object.rotation.y += 90; // Lateral rotation

    mortarYaw = object.rotation.y;
    mortarPitch = object.rotation.z;

   line = drawLine(new THREE.Vector3(object.position.x - .3,object.position.y + 1 ,object.position.z - 1),new THREE.Vector3(object.position.x + .3,object.position.y+1,object.position.z -1));
   arrowLine1 = drawLine(new THREE.Vector3(object.position.x + .1, object.position.y + 1.2 ,object.position.z - 1),new THREE.Vector3(object.position.x + .3,object.position.y+1,object.position.z -1));
   arrowLine2 = drawLine(new THREE.Vector3(object.position.x + .1, object.position.y + .8 ,object.position.z - 1),new THREE.Vector3(object.position.x + .3,object.position.y+1,object.position.z -1));



    scene.add( object );
  }

  var manager = new THREE.LoadingManager( loadModel );
  manager.onProgress = function ( item, loaded, total ) {
    console.log( item, loaded, total );
  };
  // texture

  // model
  function onProgress( xhr ) {
    if ( xhr.lengthComputable ) {
      var percentComplete = xhr.loaded / xhr.total * 100;
      console.log( 'model ' + Math.round( percentComplete, 2 ) + '% downloaded' );
    }
  }
//  function onError() {}
  var loader = new THREE.OBJLoader( manager );
  loader.load( 'assets/Old_mortar.obj', function ( obj ) {
    object = obj;  });}//, onProgress, onError );

// make floating point output a little less ugly
function toFixed(value, precision) {
    var power = Math.pow(10, precision || 0);
    return String(Math.round(value * power) / power);
}
var frameIncrementer = 0;

function getTimestamp(addClick) {
        // Reference to location for saving the last click time.
        var ref = firebase.database().ref().child('last_message/' + playerStructure.sender);

        ref.onDisconnect().remove();  // Delete reference from firebase on disconnect.

        // Set value to timestamp.
        ref.set(firebase.database.ServerValue.TIMESTAMP, function(err) {
          if (err) {  // Write to last message was unsuccessful.
            console.log(err);
          } else {  // Write to last message was successful.
            ref.once('value', function(snap) {
              addClick(snap.val());  // Add click with same timestamp.
            }, function(err) {
              console.warn(err);
            });
          }
        });
      }

// the updateEvent is called each time the 3D world should be
// rendered, before the renderEvent.  The state of your application
// should be updated here.
app.updateEvent.on(function (frame) {
    // get the user pose in the local coordinate frame()
    if(!object) return;
    if(!line) return;

    gunHeading= rotationData.value * (Math.PI/180);
    object.rotation.y = gunHeading;


    gunElevation = elevationData.value * (Math.PI/180);
    line.rotation.z = gunElevation;
    arrowLine1.rotation.z = gunElevation;
    arrowLine2.rotation.z = gunElevation;


    var userPose = app.getEntityPose(app.user);
    user.position.copy(userPose.position);
    user.quaternion.copy(userPose.orientation);
    // get the user pose relative to FIXED
    var userPoseFIXED = app.getEntityPose(app.user, ReferenceFrame.FIXED);
    // If user has a FIXED pose and our geoBoxEntity is not positioned relative to FIXED,
    // try to convert its reference frame to FIXED



	var userPos = new THREE.Vector3;
    user.getWorldPosition(userPos);

    // cartographicDegrees is a 3 element array containing [longitude, latitude, height]
    var gpsCartographicDeg = [0, 0, 0];
    // create some feedback text
    var infoText = "Geospatial Argon example:<br>";
    // Why does user not move? check local movement & movement relative to fixed
    // get user position in global coordinates
    var userLLA = Cesium.Ellipsoid.WGS84.cartesianToCartographic(userPose.position);

	if (userLLA) {
		gpsCartographicDeg = [
			CesiumMath.toDegrees(userLLA.longitude),
			CesiumMath.toDegrees(userLLA.latitude),
			userLLA.height
		];
	}

	//console.log(""+userLLA.longitude+" "+userLLA.latitude);
	frameIncrementer+=1;
	if(frameIncrementer>200)
	{
		frameIncrementer = 0;
		 getTimestamp(function(timestamp) {
		  // Add the new timestamp to the record data.
			playerStructure.timestamp = timestamp;
			playerStructure.sender = senderUID;
			playerStructure.lat= gpsCartographicDeg[1];
			playerStructure.lng= gpsCartographicDeg[0];
			playerStructure.altitude= gpsCartographicDeg[2];
			playerStructure.heading= gunHeading;
			var ref = firebase.database().ref().child('players').set(playerStructure, function(err) {
			if (err) {  // Data was not written to firebase.
				console.warn(err);
			}
			else
			{
				console.warn("SENT");
			}
		  });
		});

		if(playerInstances!=null)
		{
			playerInstances.forEach(function(element) {
				if(element.threejsObject!=null)
				{
					scene.remove(element.threejsObject);
				}
			});
			playerInstances=null;
		}

		playerInstances = new Array();



	}
});
// renderEvent is fired whenever argon wants the app to update its display
app.renderEvent.on(function () {
    // set the renderers to know the current size of the viewport.
    // This is the full size of the viewport, which would include
    // both views if we are in stereo viewing mode
    var view = app.view;
    renderer.setSize(view.renderWidth, view.renderHeight, false);
    renderer.setPixelRatio(app.suggestedPixelRatio);
    var viewport = view.viewport;
    cssRenderer.setSize(viewport.width, viewport.height);
    hud.setSize(viewport.width, viewport.height);

    for (var _i = 0, _a = app.view.subviews; _i < _a.length; _i++) {
        var subview = _a[_i];
        var frustum = subview.frustum;
        // set the position and orientation of the camera for
        // this subview
        camera.position.copy(subview.pose.position);
        camera.quaternion.copy(subview.pose.orientation);
        // the underlying system provide a full projection matrix
        // for the camera.
        camera.projectionMatrix.fromArray(subview.frustum.projectionMatrix);
        // set the webGL rendering parameters and render this view
        // set the viewport for this view
        var _b = subview.renderViewport, x = _b.x, y = _b.y, width = _b.width, height = _b.height;
        renderer.setViewport(x, y, width, height);
        renderer.setScissor(x, y, width, height);
        renderer.setScissorTest(true);
        renderer.render(scene, camera);
        // set the viewport for this view
        var _c = subview.viewport, x = _c.x, y = _c.y, width = _c.width, height = _c.height;
        // set the CSS rendering up, by computing the FOV, and render this view
        camera.fov = THREE.Math.radToDeg(frustum.fovy);
        cssRenderer.setViewport(x, y, width, height, subview.index);
        cssRenderer.render(scene, camera, subview.index);
        // adjust the hud
        hud.setViewport(x, y, width, height, subview.index);
        hud.render(subview.index);
    }

});


function Fire(){
gunPower = document.getElementById("powerData").value;

gunHeading = Math.floor( object.rotation.y * (180/Math.PI) % 360);

gunElevation = document.getElementById("elevationData").value;

  console.log("Gun Power: "+ gunPower+ " Gun Heading(rotation): "+ gunHeading+ " Gun Elevation: "+gunElevation);
}
