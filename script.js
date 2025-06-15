const socket = new WebSocket(`wss://${location.host}`);
const video = document.getElementById('screen');
const isSharer = window.location.pathname.includes('share');
let peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });

socket.onopen = () => {
  socket.send(JSON.stringify({ type: isSharer ? 'sharer' : 'viewer' }));
};

socket.onmessage = async ({ data }) => {
  const message = JSON.parse(data);

  if (message.sdp) {
    await peer.setRemoteDescription(new RTCSessionDescription(message.sdp));
    if (message.sdp.type === 'offer') {
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      socket.send(JSON.stringify({ sdp: answer, target: 'sharer' }));
    }
  } else if (message.candidate) {
    await peer.addIceCandidate(new RTCIceCandidate(message.candidate));
  }
};

peer.onicecandidate = ({ candidate }) => {
  if (candidate) {
    socket.send(JSON.stringify({ candidate, target: isSharer ? 'viewer' : 'sharer' }));
  }
};

if (isSharer) {
  navigator.mediaDevices.getDisplayMedia({ video: true }).then(stream => {
    video.srcObject = stream;
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.createOffer().then(offer => {
      peer.setLocalDescription(offer);
      socket.send(JSON.stringify({ sdp: offer, target: 'viewer' }));
    });
  });
} else {
  peer.ontrack = ({ streams }) => {
    video.srcObject = streams[0];
  };
}
