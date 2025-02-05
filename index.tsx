import React from 'react';
import { createRoot } from 'react-dom/client';
import Peer from "peerjs";

const iceConfig = {
    iceServers: [
        { urls: "stun.l.google.com:19302" }, // Primary STUN
        {
            urls: "turn:openrelay.metered.ca:80",   // Primary TURN
            username: "openrelayproject",
            credential: "openrelayproject"
        }
    ]
};

interface Connections { // copilot generated interface to represent the connections object for typing
    [key: string]: any; // or a more specific type if known
}

const peer: Peer & { connections: Connections } = new Peer({
    config: iceConfig
});


peer.on('open', (id) => {
    const peerIDText = document.getElementById('peer-id');
    if (peerIDText) {
        peerIDText.setAttribute('value', id);
    }
});

const connectButton = document.getElementById('connect-button');
if (connectButton) {
    connectButton.addEventListener('click', () => {
        const connectId = (document.getElementById('connect-id') as HTMLInputElement).value;
        const conn = peer.connect(connectId);
        peer.connections[connectId] = [conn];
    });
}

const sendBtn = document.getElementById('send-button');
if (sendBtn) {
    sendBtn.addEventListener('click', () => {
        const message = (document.getElementById('message') as HTMLInputElement).value;
        for (const conn of Object.values(peer.connections)) {
            conn.forEach((c: { send: (arg0: string) => void; }) => {
                c.send(message);
            });
        }
    });
}

peer.on('connection', (conn) => {
    conn.on('data', (data) => {
        console.log('Received', data);
    });
});





function App() {
    return (
        <>
            <h1>PeerJS WebRTC Application</h1>
            <div>
                <label htmlFor="peer-id">Your ID:</label>
                <input type="text" id="peer-id" readOnly/>
            </div>
            <div>
                <label htmlFor="connect-id">Connect to Peer ID:</label>
                <input type="text" id="connect-id"/>
                <button id="connect-button">Connect</button>
            </div>
            <div>
                <label htmlFor="message">Message:</label>
                <input type="text" id="message"/>
                <button id="send-button">Send</button>
            </div>
        </>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<App/>);
}