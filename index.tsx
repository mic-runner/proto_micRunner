import React, { useEffect } from "react";
import { createRoot } from "react-dom/client";
import Peer, { DataConnection, MediaConnection } from "peerjs";
import "./styles.css";

// Validate required environment variables
if (!import.meta.env.VITE_TURN_USERNAME || !import.meta.env.VITE_TURN_CREDENTIAL) {
  console.warn("TURN server credentials not configured. WebRTC connections may fail in restrictive network environments.");
}

const iceConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" }, // Primary STUN
    {
      urls: "stun:stun.relay.metered.ca:80", // Other STUN
    },
    {
      urls: "turn:global.relay.metered.ca:80", //TURNs with credentials
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: import.meta.env.VITE_TURN_USERNAME,
      credential: import.meta.env.VITE_TURN_CREDENTIAL,
    },
  ],
};

interface Connections {
  [key: string]: DataConnection[];
}

let peer: Peer = new Peer({
  config: iceConfig,
  debug: 3, // Log debug info
});

let connections: Connections = {};

function setupPeer() {
  peer.on("open", (id) => {
    const peerIDText = document.getElementById("peer-id");
    if (peerIDText) {
      peerIDText.setAttribute("value", id);
    }
  });

  peer.on("connection", (conn: DataConnection) => {
    if (!connections[conn.peer]) {
      connections[conn.peer] = [];
    }
    connections[conn.peer].push(conn);

    conn.on("data", (data) => {
      const log = document.getElementById("log");
      if (log) {
        log.textContent += `Received from ${conn.peer}: ${data}\n`;
      }
    });

    conn.on("close", () => {
      connections[conn.peer] = connections[conn.peer].filter((c) => c !== conn);
      if (connections[conn.peer].length === 0) {
        delete connections[conn.peer];
      }
    });

    conn.on("error", (err) => {
      console.error("Connection error", err);
      const log = document.getElementById("log");
      log!.textContent += `Connection error: ${err}\n`;
    });

    conn.on("open", () => {
      const log = document.getElementById("log");
      log!.textContent += `Connection opened with ${conn.peer}\n`;
    });

    conn.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("New ICE candidate:", event.candidate);
      } else {
        console.log("ICE candidate gathering complete");
      }
    };
  });

  peer.on("call", (call: MediaConnection) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        call.answer(stream); // Answer the call with the audio stream
        call.on("stream", (remoteStream) => {
          const audio = document.createElement("audio");
          audio.srcObject = remoteStream;
          audio.play();
        });
      })
      .catch((err) => {
        console.error("Failed to get local stream", err);
      });
  });
}

setupPeer();

function configPeerConnectionToOther(conn: DataConnection, connectId: string) {
  conn.on("open", () => {
    if (!connections[connectId]) {
      connections[connectId] = [];
    }
    connections[connectId].push(conn);
    const log = document.getElementById("log");
    log!.textContent += `Connected to ${connectId}\n`;
  });

  conn.on("data", (data) => {
    const log = document.getElementById("log");
    if (log) {
      log.textContent += `Received from ${connectId}: ${data}\n`;
    }
  });

  conn.on("close", () => {
    connections[connectId] = connections[connectId].filter((c) => c !== conn);
    if (connections[connectId].length === 0) {
      delete connections[connectId];
    }
  });

  conn.on("error", (err) => {
    console.error("Connection error", err);
  });
}

function App() {
  let localStream: MediaStream | null = null;
  useEffect(() => {
    const connectButton = document.getElementById("connect-button");
    if (connectButton) {
      connectButton.addEventListener("click", () => {
        const connectId = (
          document.getElementById("connect-id") as HTMLInputElement
        ).value;
        const conn = peer.connect(connectId);

        configPeerConnectionToOther(conn, connectId);
      });
    }

    const startAudioButton = document.getElementById("start-audio-button");
    if (startAudioButton) {
      startAudioButton.addEventListener("click", () => {
        const connectId = (
          document.getElementById("connect-id") as HTMLInputElement
        ).value;
        navigator.mediaDevices
          .getUserMedia({ audio: true })
          .then((stream) => {
            const audioContext = new AudioContext();
            const gainNode = audioContext.createGain();
            gainNode.gain.value = 0.01;
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(gainNode);

            const destination = audioContext.createMediaStreamDestination();
            gainNode.connect(destination);

            localStream = destination.stream;

            const call = peer.call(connectId, localStream);
            call.on("stream", (remoteStream) => {
              applyBandpassFilter(remoteStream);
              //const audio = document.createElement("audio");
              //audio.srcObject = remoteStream;
              //audio.play();
            });
          })
          .catch((err) => {
            console.error("Failed to get local stream", err);
          });
      });
    }

    function applyBandpassFilter(remoteStream: MediaStream) {
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(remoteStream);
    
      // Create a bandpass filter
      const filter = audioContext.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 500; // Center frequency (e.g., 1kHz)
      filter.Q.value = 4; // Quality factor (adjust for width of the band)
    
      source.connect(filter);
    
      // Connect to the output (speakers)
      const destination = audioContext.destination;
      filter.connect(destination);
    }

    const stopAudioButton = document.getElementById("stop-audio-button");
    if (stopAudioButton) {
      stopAudioButton.addEventListener("click", () => {
        if (localStream) {
          localStream.getTracks().forEach((track) => track.stop());
          localStream = null;
          console.log("Audio transmission stopped");
        }
      });
    }

    const sendBtn = document.getElementById("send-button");
    const messageInput = document.getElementById("message") as HTMLInputElement;

    if (sendBtn) {
      sendBtn.addEventListener("click", () => {
        const message = messageInput.value;
        for (const conns of Object.values(connections)) {
          conns.forEach((c: DataConnection) => {
            c.send(message);
          });
        }
        messageInput.value = "";
      });

      messageInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          sendBtn.click();
        }
      });
    }

    const newBtn = document.getElementById("new-button");
    if (newBtn) {
      const newIdInput = document.getElementById("new-id") as HTMLInputElement;
      newBtn.addEventListener("click", () => {
        const newId = newIdInput.value;
        peer = new Peer(newId, {
          config: iceConfig,
          debug: 3,
        });
        setupPeer();
      });
    }
  }, []);

  return (
    <>
      <h1>ProtoMic</h1>
      <div>
        <label htmlFor="peer-id">Your ID:</label>
        <input type="text" id="peer-id" readOnly />
      </div>
      <div>
        <label htmlFor="new-id">New Peer ID:</label>
        <input type="text" id="new-id" />
        <button id="new-button">Create</button>
      </div>
      <div>
        <label htmlFor="connect-id">Connect to Peer ID:</label>
        <input type="text" id="connect-id" />
        <button id="connect-button">Connect</button>
      </div>
      <div>
        <label htmlFor="message">Message:</label>
        <input type="text" id="message" />
        <button id="send-button">Send</button>
      </div>
      <div>
        <label>Audio:</label>
      </div>
      <div>
        <button id="start-audio-button">Start Audio</button>
        <button id="stop-audio-button">Stop Audio</button>
      </div>
      <div>
        <label htmlFor="log">Log:</label>
        <textarea id="log" readOnly />
      </div>
    </>
  );
}

const rootElement = document.getElementById("root");
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
