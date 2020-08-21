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

function addPhoto(fileContent, fileName) {
    //var files = document.getElementById('photoupload').files;
    if (!files.length) {
      return alert('Please choose a file to upload first.');
    }
    var file = fileContent;
    var fileName = file.name;
    //var albumPhotosKey = encodeURIComponent(albumName) + '//';
  
    var photoKey = fileName;
    s3.upload({
      Key: photoKey,
      Body: file,
      ACL: 'public-read'
    }, function(err, data) {
      if (err) {
        //console.log(JSON.stringify(err));
        alert(err);
        alert(data);
        return alert('There was an error uploading your photo: ', err.message);
      }
      alert('Successfully uploaded photo.');
      //viewAlbum(albumName);
    });
  }

  function refAddPhoto(fileContent,fileName) {
    var files = fileContent;
    if (!files.length) {
      return alert('Please choose a file to upload first.');
    }
    var file = files;
    //var fileName = file.name;
    var albumPhotosKey = encodeURIComponent('uploads') + '//';
    var photoKey = albumPhotosKey + fileName;
    s3.upload({
      Key: photoKey,
      Body: file,
      ACL: 'public-read'
    }, function(err, data) {
      if (err) {
        //console.log(JSON.stringify(err));
        alert(err);
        alert(data);
        return alert('There was an error uploading your photo: ', err.message);
      }
      alert('Successfully uploaded photo.');
      //viewAlbum(albumName);
    });
  }