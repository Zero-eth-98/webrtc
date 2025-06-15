// SCRIPT JS - GESTIONE PEER WEBRTC E SCAMBIO DATI VIA WEBSOCKET

const socket = new WebSocket(`wss://${location.host}`);
const video = document.getElementById('screen');
const isSharer = window.location.pathname.includes('share');

let peer = new RTCPeerConnection({
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
});

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
    try {
      await peer.addIceCandidate(new RTCIceCandidate(message.candidate));
    } catch (e) {
      console.warn('❌ ICE Candidate scartato:', e);
    }
  }
};

peer.onicecandidate = ({ candidate }) => {
  if (candidate) {
    socket.send(JSON.stringify({ candidate, target: isSharer ? 'viewer' : 'sharer' }));
  }
};

if (isSharer) {
  navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 30 } }).then(stream => {
    video.srcObject = stream;
    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.createOffer().then(offer => {
      peer.setLocalDescription(offer);
      socket.send(JSON.stringify({ sdp: offer, target: 'viewer' }));
    });

    // Termina condivisione
    document.getElementById('stopBtn').onclick = () => {
      stream.getTracks().forEach(t => t.stop());
      alert('Condivisione interrotta.');
      location.reload();
    };
  });
} else {
  peer.ontrack = ({ streams }) => {
    video.srcObject = streams[0];
  };

  // Connessione spettatore manuale
  const connectBtn = document.getElementById('connectBtn');
  if (connectBtn) {
    connectBtn.onclick = () => {
      socket.send(JSON.stringify({ type: 'viewer' }));
    };
  }
}
