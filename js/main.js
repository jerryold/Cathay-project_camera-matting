/*

>> kasperkamperman.com - 2018-04-18
>> kasperkamperman.com - 2020-05-17
>> https://www.kasperkamperman.com/blog/camera-template/

*/
var albumBucketName = 'layer-opencv-test-akira';
var bucketRegion = 'us-east-2';
var IdentityPoolId = 'us-east-2:68269b12-b8e8-4713-afc5-30bae6a1f3a1';

AWS.config.update({
  region: bucketRegion,
  credentials: new AWS.CognitoIdentityCredentials({
    IdentityPoolId: IdentityPoolId
  })
});

var s3 = new AWS.S3({
  apiVersion: '2006-03-01',
  params: {Bucket: albumBucketName}
});

var takeSnapshotUI = createClickFeedbackUI();

var video;
var takePhotoButton;
var toggleFullScreenButton;
var switchCameraButton;
var amountOfCameras = 0;
var currentFacingMode = 'environment';


function convertURIToImageData(URI) {
  return new Promise(function(resolve, reject) {
    if (URI == null) return reject();
    var canvas = document.createElement('canvas'),
        context = canvas.getContext('2d'),
        image = new Image();
    image.addEventListener('load', function() {
      canvas.width = image.width;
      canvas.height = image.height;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(context.getImageData(0, 0, canvas.width, canvas.height));
    }, false);
    image.src = URI;
  });
}

function createToken(length=10) {
  length=typeof length==='number'?(length<4?4:length>2048?2048:length):16;
  var r = '';
  while (r.length<length) {
     r+=Math.ceil(Math.random()*Number.MAX_SAFE_INTEGER).toString(36);
  }
  return r.substr(Math.floor((r.length/2)-length/2),length);
}

//var URI = "data:image/x-icon;base64,AAABAAEAEBAAAAEAIABoBAAAFgAAACgAAAAQAAAAIAAAAAEAIAAAAAAAQAQAABMLAAATCwAAAAAAAAAAAABsiqb/bIqm/2yKpv9siqb/bIqm/2yKpv9siqb/iKC3/2yKpv9siqb/bIqm/2yKpv9siqb/bIqm/2yKpv9siqb/bIqm/2yKpv9siqb/bIqm/2yKpv9siqb/2uLp///////R2uP/dZGs/2yKpv9siqb/bIqm/2yKpv9siqb/bIqm/2yKpv9siqb/bIqm/2yKpv9siqb/bIqm/////////////////+3w9P+IoLf/bIqm/2yKpv9siqb/bIqm/2yKpv9siqb/bIqm/2yKpv9siqb/bIqm/2yKpv///////////+3w9P+tvc3/dZGs/2yKpv9siqb/bIqm/2yKpv9siqb/TZbB/02Wwf9NlsH/TZbB/02Wwf9NlsH////////////0+Pv/erDR/02Wwf9NlsH/TZbB/02Wwf9NlsH/TZbB/02Wwf9NlsH/TZbB/02Wwf9NlsH/TZbB//////////////////////96sNH/TZbB/02Wwf9NlsH/TZbB/02Wwf9NlsH/TZbB/02Wwf9NlsH/TZbB/02Wwf////////////////+Ft9T/TZbB/02Wwf9NlsH/TZbB/02Wwf9NlsH/E4zV/xOM1f8TjNX/E4zV/yKT2P/T6ff/////////////////4fH6/z+i3f8TjNX/E4zV/xOM1f8TjNX/E4zV/xOM1f8TjNX/E4zV/xOM1f+m1O/////////////////////////////w+Pz/IpPY/xOM1f8TjNX/E4zV/xOM1f8TjNX/E4zV/xOM1f8TjNX////////////T6ff/Tqng/6bU7////////////3u/5/8TjNX/E4zV/xOM1f8TjNX/AIv//wCL//8Ai///AIv/////////////gMX//wCL//8gmv////////////+Axf//AIv//wCL//8Ai///AIv//wCL//8Ai///AIv//wCL///v+P///////+/4//+Axf//z+n/////////////YLf//wCL//8Ai///AIv//wCL//8Ai///AIv//wCL//8Ai///gMX/////////////////////////////z+n//wCL//8Ai///AIv//wCL//8Ai///AHr//wB6//8Aev//AHr//wB6//+Avf//7/f/////////////v97//xCC//8Aev//AHr//wB6//8Aev//AHr//wB6//8Aev//AHr//wB6//8Aev//AHr//wB6//8Aev//AHr//wB6//8Aev//AHr//wB6//8Aev//AHr//wB6//8Aev//AHr//wB6//8Aev//AHr//wB6//8Aev//AHr//wB6//8Aev//AHr//wB6//8Aev//AHr//wB6//8Aev//AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA==";
// testing usage
function dataURItoBlob(dataURI) {
  var binary = atob(dataURI.split(',')[1]);
  var array = [];
  for(var i = 0; i < binary.length; i++) {
      array.push(binary.charCodeAt(i));
  }
  return new Blob([new Uint8Array(array)], {type: 'image/jpeg'});
}


// this function counts the amount of video inputs
// it replaces DetectRTC that was previously implemented.
function deviceCount() {
  return new Promise(function (resolve) {
    var videoInCount = 0;

    navigator.mediaDevices
      .enumerateDevices()
      .then(function (devices) {
        devices.forEach(function (device) {
          if (device.kind === 'video') {
            device.kind = 'videoinput';
          }

          if (device.kind === 'videoinput') {
            videoInCount++;
            console.log('videocam: ' + device.label);
          }
        });

        resolve(videoInCount);
      })
      .catch(function (err) {
        console.log(err.name + ': ' + err.message);
        resolve(0);
      });
  });
}

document.addEventListener('DOMContentLoaded', function (event) {
  // check if mediaDevices is supported
  if (
    navigator.mediaDevices &&
    navigator.mediaDevices.getUserMedia &&
    navigator.mediaDevices.enumerateDevices
  ) {
    // first we call getUserMedia to trigger permissions
    // we need this before deviceCount, otherwise Safari doesn't return all the cameras
    // we need to have the number in order to display the switch front/back button
    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: true,
      })
      .then(function (stream) {
        stream.getTracks().forEach(function (track) {
          track.stop();
        });

        deviceCount().then(function (deviceCount) {
          amountOfCameras = deviceCount;

          // init the UI and the camera stream
          initCameraUI();
          initCameraStream();
        });
      })
      .catch(function (error) {
        //https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
        if (error === 'PermissionDeniedError') {
          alert('Permission denied. Please refresh and give permission.');
        }

        console.error('getUserMedia() error: ', error);
      });
  } else {
    alert(
      'Mobile camera is not supported by browser, or there is no camera detected/connected',
    );
  };
  
  
});

function getElement(elem)
{
  return document.querySelector(elem);
}

function initCameraUI() {
  video = document.getElementById('video');

  takePhotoButton = document.getElementById('takePhotoButton');
  toggleFullScreenButton = document.getElementById('toggleFullScreenButton');
  switchCameraButton = document.getElementById('switchCameraButton');

  // https://developer.mozilla.org/nl/docs/Web/HTML/Element/button
  // https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Techniques/Using_the_button_role

  takePhotoButton.addEventListener('click', function () {
    takeSnapshotUI();
    takeSnapshot();
  });
  

  
  


  // -- fullscreen part

  function fullScreenChange() {
    if (screenfull.isFullscreen) {
      toggleFullScreenButton.setAttribute('aria-pressed', true);
    } else {
      toggleFullScreenButton.setAttribute('aria-pressed', false);
    }
  }

  if (screenfull.isEnabled) {
    screenfull.on('change', fullScreenChange);

    toggleFullScreenButton.style.display = 'block';

    // set init values
    fullScreenChange();

    toggleFullScreenButton.addEventListener('click', function () {
      screenfull.toggle(document.getElementById('container')).then(function () {
        console.log(
          'Fullscreen mode: ' +
            (screenfull.isFullscreen ? 'enabled' : 'disabled'),
        );
      });
    });
  } else {
    console.log("iOS doesn't support fullscreen (yet)");
  }

  // -- switch camera part
  if (amountOfCameras > 1) {
    switchCameraButton.style.display = 'block';

    switchCameraButton.addEventListener('click', function () {
      if (currentFacingMode === 'environment') currentFacingMode = 'user';
      else currentFacingMode = 'environment';

      initCameraStream();
    });
  }

  // Listen for orientation changes to make sure buttons stay at the side of the
  // physical (and virtual) buttons (opposite of camera) most of the layout change is done by CSS media queries
  // https://www.sitepoint.com/introducing-screen-orientation-api/
  // https://developer.mozilla.org/en-US/docs/Web/API/Screen/orientation
  window.addEventListener(
    'orientationchange',
    function () {
      // iOS doesn't have screen.orientation, so fallback to window.orientation.
      // screen.orientation will
      if (screen.orientation) angle = screen.orientation.angle;
      else angle = window.orientation;

      var guiControls = document.getElementById('gui_controls').classList;
      var vidContainer = document.getElementById('vid_container').classList;

      if (angle == 270 || angle == -90) {
        guiControls.add('left');
        vidContainer.add('left');
      } else {
        if (guiControls.contains('left')) guiControls.remove('left');
        if (vidContainer.contains('left')) vidContainer.remove('left');
      }

      //0   portrait-primary
      //180 portrait-secondary device is down under
      //90  landscape-primary  buttons at the right
      //270 landscape-secondary buttons at the left
    },
    false,
  );
}

// https://github.com/webrtc/samples/blob/gh-pages/src/content/devices/input-output/js/main.js
function initCameraStream() {
  // stop any active streams in the window
  if (window.stream) {
    window.stream.getTracks().forEach(function (track) {
      console.log(track);
      track.stop();
    });
  }

  // we ask for a square resolution, it will cropped on top (landscape)
  // or cropped at the sides (landscape)
  var size = 1280;

  var constraints = {
    audio: false,
    video: {
      width: { ideal: size },
      height: { ideal: size },
      //width: { min: 1024, ideal: window.innerWidth, max: 1920 },
      //height: { min: 776, ideal: window.innerHeight, max: 1080 },
      facingMode: currentFacingMode,
    },
  };

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(handleSuccess)
    .catch(handleError);

  function handleSuccess(stream) {
    window.stream = stream; // make stream available to browser console
    video.srcObject = stream;

    if (constraints.video.facingMode) {
      if (constraints.video.facingMode === 'environment') {
        switchCameraButton.setAttribute('aria-pressed', true);
      } else {
        switchCameraButton.setAttribute('aria-pressed', false);
      }
    }

    const track = window.stream.getVideoTracks()[0];
    const settings = track.getSettings();
    str = JSON.stringify(settings, null, 4);
    console.log('settings ' + str);
  }

  function handleError(error) {
    console.error('getUserMedia() error: ', error);
  }
}
function downloadImage(data, filename = 'untitled.png') {
    var a = document.createElement('a');
    a.href = data;
    a.download = filename;
    console.log(a.href);
    //document.body.appendChild(a);
    a.click();
}
function takeSnapshot() {
  // if you'd like to show the canvas add it to the DOM
  $('#all').html(
    
    `<div class="container">

    <div class="rain">
      <div class="drop"></div>
      <div class="waves">
        <div></div>
        <div></div>
      </div>
      <div class="splash"></div>
      <div class="particles">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  
    <div class="rain">
      <div class="drop"></div>
      <div class="waves">
        <div></div>
        <div></div>
      </div>
      <div class="splash"></div>
      <div class="particles">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  
    <div class="rain">
      <div class="drop"></div>
      <div class="waves">
        <div></div>
        <div></div>
      </div>
      <div class="splash"></div>
      <div class="particles">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  
    <div class="rain">
      <div class="drop"></div>
      <div class="waves">
        <div></div>
        <div></div>
      </div>
      <div class="splash"></div>
      <div class="particles">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  
    <div class="rain">
      <div class="drop"></div>
      <div class="waves">
        <div></div>
        <div></div>
      </div>
      <div class="splash"></div>
      <div class="particles">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  
    <div class="rain">
      <div class="drop"></div>
      <div class="waves">
        <div></div>
        <div></div>
      </div>
      <div class="splash"></div>
      <div class="particles">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  
    <div class="rain">
      <div class="drop"></div>
      <div class="waves">
        <div></div>
        <div></div>
      </div>
      <div class="splash"></div>
      <div class="particles">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  
    <div class="rain">
      <div class="drop"></div>
      <div class="waves">
        <div></div>
        <div></div>
      </div>
      <div class="splash"></div>
      <div class="particles">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  
    <div class="rain">
      <div class="drop"></div>
      <div class="waves">
        <div></div>
        <div></div>
      </div>
      <div class="splash"></div>
      <div class="particles">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  
  </div>`);
  var canvas = document.createElement('canvas');

  var width = 640;
  var height = 480;

  canvas.width = width;
  canvas.height = height;

  context = canvas.getContext('2d');
  context.drawImage(video, 0, 0, width, height);
  var token = createToken();
  function getCanvasBlob(canvas,token) {
    console.log('getting canvas');
    var image = canvas.toDataURL("image/png");//.replace("image/png", "image/output");
    // Transform dataurl to blob
    var blobData = dataURItoBlob(image);
    params = {Key:`uploads/img_${token}.png`, ContentType:"image/png", Body:blobData};
    // upload blob to s3
    s3.upload(params, function(err, data){
      if(err){
        console.log(err)
      };
      setTimeout(lbtrigger(token),3000);
      console.log('called');
    });

    return new Promise(function (resolve, reject) {
      canvas.toBlob(function (blob) {
        resolve(blob);
      }, 'image/png');
    });
  }
  function blobtoDataURL(blob, callback) {
    var fr = new FileReader();
    fr.onload = function(e) {
        callback(e.target.result);
    };
    fr.readAsDataURL(blob);
  } 
  

 
  function lbtrigger(token){
    $.ajax({
      url: 'https://znxdh5vzyc.execute-api.us-east-2.amazonaws.com/ms/opencv-matting-dontChargeMePlz?token='+token,
      type: 'POST',
      headers: {
        Accept: "application/json"
      },
      //async:false,
      complete: function(data){
          //alert("status = "+data.response+" description "+data.description);
        },
      error: function (error) { 
          //alert("error" + JSON.stringify(error) )
          alert('ready for download');
          
          $('#all').html(
           
            `
          <button type="button" class="icon">
          <div class="cloud">
            
            <div class="puff puff-1"></div>
            <div class="puff puff-2"></div>
            <div class="puff puff-3"></div>
            <div class="puff puff-4"></div>
            <div class="puff puff-5"></div>
            <div class="puff puff-6"></div>
            <div class="puff puff-7"></div>
            <div class="puff puff-8"></div>
            <div class="puff puff-9"></div>
            <div class="puff puff-10"></div>
            <div class="cloud-core">
            <a href="https://layer-opencv-test-akira.s3.us-east-2.amazonaws.com/output/output_${token}.png">Download</a>
            </div>
            <div class="check"></div>
            <div class="arrow">
              <div class="arrow-stem">
                <div class="arrow-l-tip"></div>
                <div class="arrow-r-tip"></div>
              </div>
            </div>
          </div>
          <div class="preload">
            <div class="drop drop-1"></div>
            <div class="drop drop-2"></div>
            <div class="drop drop-3"></div>
          </div>
          <div class="progress"></div>
        </button>`);
        
          
          
        }, 
      success: function(response){
             //alert(JSON.stringify(response));
        }
    });
  }
  // some API's (like Azure Custom Vision) need a blob with image data
  getCanvasBlob(canvas,token).then(function (blob) {
    // do something with the image blob
    console.log(token);
    //setTimeout(lbtrigger(token),3000);
    blobtoDataURL(blob, function (dataURL){
      //console.log(dataURL);
    });
    //var file = new File([blob], "shot.jpeg");
    //console.log(blob);
  });
}

// https://hackernoon.com/how-to-use-javascript-closures-with-confidence-85cd1f841a6b
// closure; store this in a variable and call the variable as function
// eg. var takeSnapshotUI = createClickFeedbackUI();
// takeSnapshotUI();

function createClickFeedbackUI() {
  // in order to give feedback that we actually pressed a button.
  // we trigger a almost black overlay
  var overlay = document.getElementById('video_overlay'); //.style.display;

  // sound feedback
  var sndClick = new Howl({ src: ['snd/click.mp3'] });

  var overlayVisibility = false;
  var timeOut = 80;

  function setFalseAgain() {
    overlayVisibility = false;
    overlay.style.display = 'none';
  }

  return function () {
    if (overlayVisibility == false) {
      sndClick.play();
      overlayVisibility = true;
      overlay.style.display = 'block';
      setTimeout(setFalseAgain, timeOut);
    }
  };
}
