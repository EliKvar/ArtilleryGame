/// <reference types="@argonjs/argon" />
/// <reference types="three" />
// grab some handles on APIs we use
var Cesium = Argon.Cesium;
var Cartesian3 = Argon.Cesium.Cartesian3;
var ReferenceFrame = Argon.Cesium.ReferenceFrame;
var JulianDate = Argon.Cesium.JulianDate;
var CesiumMath = Argon.Cesium.CesiumMath;

var gunHeading = 0;
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
var senderUID = null;


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

//Start of model code
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
    object.position.z -= 1.9; //Move forward and back
    object.position.y -= .4; //Move up and down

    object.rotation.z -= 0; // Vertical rotation The numbers are weird for z rotation. Try .1 to .5 and -.1 to -.5
    object.rotation.y += 90; // Lateral rotation

    mortarYaw = object.rotation.y;
    mortarPitch = object.rotation.z;

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
//}
//End of model code

//var loader = new THREE.TextureLoader();
//var mortar = new THREE.Scene();
//var mortar = new THREE.Scene();


//var loadingManager = new THREE.LoadingManager( function () {

//mortar.position.x = 0;
//mortar.position.y = 20;
//mortar.position.y = 0;
//mortar.scale.x = 0.04;
//mortar.scale.y = 0.04;
//mortar.scale.z = 0.04;
//mortar.translateZ( 10 );

//scene.add( mortar );

//} );


//var loader = new THREE.ColladaLoader( loadingManager );
  //        loader.load('assets/Old_mortarScaled.dae', function (collada) {
//					mortar = collada.scene;
       //  mortar.scale.set(1, 1, 1);
//				} );

        //mortar.scale.set(1, 1, 1);
      //mortar.scale.x = 100;




/*
loader.load('./objects/Old_mortar.dae', function (collada) {
    var geometry = new THREE.BoxGeometry(10, 10, 10);
    var material = new THREE.MeshBasicMaterial({ map: texture });
    var mesh = new THREE.Mesh(geometry, material);
    mesh.scale.set(100, 100, 100);
    buzz.add(mesh);
});*/

// have our geolocated object start somewhere, in this case
// near Georgia Tech in Atlanta.
// you should probably adjust this to a spot closer to you
// (we found the lon/lat of Georgia Tech using Google Maps)
var gatechGeoEntity = new Cesium.Entity({
    name: "Georgia Tech",
    position: Cartesian3.fromDegrees(-84.398881, 33.778463),
    orientation: Cesium.Quaternion.IDENTITY
});
var gatechGeoTarget = new THREE.Object3D;
gatechGeoTarget.add(buzz);
scene.add(gatechGeoTarget);
// create a 1m cube with a wooden box texture on it, that we will attach to the geospatial object when we create it
// Box texture from https://www.flickr.com/photos/photoshoproadmap/8640003215/sizes/l/in/photostream/
//, licensed under https://creativecommons.org/licenses/by/2.0/legalcode
var boxGeoObject = new THREE.Object3D;
var box = new THREE.Object3D();
// In a 6DOF reality(such as Tango-reality), create a box to put on the floor at the center of the stage
var floorBox = new THREE.Object3D();
var loader = new THREE.TextureLoader();
loader.load('assets/box.png', function (texture) {
    // Set box size to 20 cm
    var geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    var material = new THREE.MeshBasicMaterial({ map: texture });
    var mesh = new THREE.Mesh(geometry, material);
    box.add(mesh);
    var geometry2 = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    var mesh2 = new THREE.Mesh(geometry2, material);
    floorBox.add(mesh2);
});
// Create a box that we indend to have geoposed.
var geoBoxEntity = new Argon.Cesium.Entity({
    name: "I have a box",
    position: new Argon.Cesium.ConstantPositionProperty(undefined),
    orientation: new Argon.Cesium.ConstantProperty(undefined)
});
boxGeoObject.add(box);
// Set initial box position 2 meters in front of user
boxGeoObject.position.z = -2;
scene.add(boxGeoObject);
// A line between the two boxes
var lineGeometry = new THREE.Geometry();
lineGeometry.vertices.push(new THREE.Vector3());
lineGeometry.vertices.push(new THREE.Vector3());
var lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
var boxToboxLine = new THREE.Line(lineGeometry, lineMaterial);

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
    // get the user pose in the local coordinate frame.
    var userPose = app.getEntityPose(app.user);
    user.position.copy(userPose.position);
    user.quaternion.copy(userPose.orientation);
    // get the user pose relative to FIXED
    var userPoseFIXED = app.getEntityPose(app.user, ReferenceFrame.FIXED);
    // If user has a FIXED pose and our geoBoxEntity is not positioned relative to FIXED,
    // try to convert its reference frame to FIXED
    if (userPoseFIXED.status & Argon.PoseStatus.KNOWN &&
        geoBoxEntity.position.referenceFrame !== ReferenceFrame.FIXED) {
        // now, we want to move the box's coordinates to the FIXED frame, so
        // the box doesn't move if the local coordinate system origin changes.
        Argon.convertEntityReferenceFrame(geoBoxEntity, frame.time, ReferenceFrame.FIXED);
    }
    // if the geoBoxEntity still does not have a known pose,
    // place it 2 meters in front of the user, on the stage
    var geoBoxPose = app.getEntityPose(geoBoxEntity);
    if ((geoBoxPose.status & Argon.PoseStatus.KNOWN) === 0) {
        geoBoxEntity.position.setValue(new Cartesian3(0, 0, -2), app.user);
        geoBoxEntity.orientation.setValue(Cesium.Quaternion.IDENTITY);
        if (!Argon.convertEntityReferenceFrame(geoBoxEntity, frame.time, app.stage)) {
            console.warn('Unable to convert to stage frame!');
        }
    }
    // get the local coordinates of the local box, and set the THREE object
    var boxPose = app.getEntityPose(geoBoxEntity);
    if (geoBoxPose.poseStatus & Argon.PoseStatus.KNOWN) {
        boxGeoObject.position.copy(geoBoxPose.position);
        boxGeoObject.quaternion.copy(geoBoxPose.orientation);
        // update one end of the line to be at the local box
        lineGeometry.vertices[0].copy(geoBoxPose.position);
    }
    // get the local coordinates of the GT box, and set the THREE object
    var geoPose = app.getEntityPose(gatechGeoEntity);
    if (geoPose.poseStatus & Argon.PoseStatus.KNOWN) {
        gatechGeoTarget.position.copy(geoPose.position);
    }
    else {
        // initialize to a fixed location in case we can't convert to geospatial
        gatechGeoTarget.position.y = 0;
        gatechGeoTarget.position.z = -4000;
        gatechGeoTarget.position.x = 1000;
    }
    // add the additional box only in 6DOF realities
    if (app.userTracking === '6DOF') {
        // get the local coordinates of the local box, and set the THREE object
        var floorBoxPose = app.getEntityPose(app.context.floor);
        floorBox.position.copy(floorBoxPose.position);
        floorBox.quaternion.copy(floorBoxPose.orientation);
        // update the other end of the line to be at the floor box
        lineGeometry.vertices[1].copy(floorBoxPose.position);
        lineGeometry.verticesNeedUpdate = true;
        scene.add(floorBox);
        scene.add(boxToboxLine);
    }
    else {
        scene.remove(floorBox);
        scene.remove(boxToboxLine);
    }
    // rotate the boxes at a constant speed, independent of frame rates
    // to make it a little less boring
    buzz.rotateY(2 * frame.deltaTime / 10000);
    box.rotateY(3 * frame.deltaTime / 10000);
    //
    // stuff to print out the status message.  It's fairly expensive to convert FIXED
    // coordinates back to LLA, but those coordinates probably make the most sense as
    // something to show the user, so we'll do that computation.
    //
    // we'll compute the distance to the cube, just for fun. If the cube could be further away,
    // we'd want to use Cesium.EllipsoidGeodesic, rather than Euclidean distance, but this is fine here.



	var userPos = new THREE.Vector3;
	var buzzPos = new THREE.Vector3;
	var boxPos = new THREE.Vector3;
	var boxPos2 = new THREE.Vector3;
    user.getWorldPosition(userPos);
    buzz.getWorldPosition(buzzPos);
    box.getWorldPosition(boxPos);
    floorBox.getWorldPosition(boxPos2);
    var distanceToBox = userPos.distanceTo(boxPos);
    var distanceToBuzz = userPos.distanceTo(buzzPos);
    var distanceToBox2 = userPos.distanceTo(boxPos2);


    // cartographicDegrees is a 3 element array containing [longitude, latitude, height]
    var gpsCartographicDeg = [0, 0, 0];
    // create some feedback text
    var infoText = "Geospatial Argon example:<br>";
    // Why does user not move? check local movement & movement relative to fixed
    // get user position in global coordinates
    if (userPoseFIXED.poseStatus & Argon.PoseStatus.KNOWN) {
        var userLLA = Cesium.Ellipsoid.WGS84.cartesianToCartographic(userPoseFIXED.position);
        if (userLLA) {
            gpsCartographicDeg = [
                CesiumMath.toDegrees(userLLA.longitude),
                CesiumMath.toDegrees(userLLA.latitude),
                userLLA.height
            ];

			frameIncrementer+=1;
			if(frameIncrementer>100)
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
					var ref = firebase.database().ref().child('players').push(playerStructure, function(err) {
					if (err) {  // Data was not written to firebase.
					  console.warn(err);
					}
					else
					{
						console.warn("SENT");
					}
				  });
				});
			}
        }
    }

    var geoBoxFixedPose = app.getEntityPose(geoBoxEntity, ReferenceFrame.FIXED);
    if (geoBoxFixedPose.poseStatus & Argon.PoseStatus.KNOWN) {
        var boxLLA = Cesium.Ellipsoid.WGS84.cartesianToCartographic(geoBoxFixedPose.position);
        if (boxLLA) {
            boxCartographicDeg = [
                CesiumMath.toDegrees(boxLLA.longitude),
                CesiumMath.toDegrees(boxLLA.latitude),
                boxLLA.height
            ];
        }
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

function leftBtnClickEvent(){
  alert("timestamp");
}
