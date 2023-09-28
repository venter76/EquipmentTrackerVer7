function startQRScanning() {


  let video = document.getElementById("video");

  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }) // 'environment' to use the rear camera if available
  .then(function(stream) {
    // let video = document.getElementById("video");  // TARGET THE MODAL VIDEO ELEMENT
    video.srcObject = stream;
    video.setAttribute("playsinline", true); // required for iPhones
    video.play();

    requestAnimationFrame(tick);
    
    function tick() {
      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        let canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        let ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        let code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        
        if (code) {
          console.log("Found QR code:", code.data);

// Stopping the video stream before redirecting.
if (video.srcObject) {
  let tracks = video.srcObject.getTracks();
  tracks.forEach(track => track.stop());
}

          window.location.href = `/detail?itemName=${code.data}`;
          // More code ....
        }
      }
      
      requestAnimationFrame(tick);
    }
  })


 
}
