import React, { useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Peer, { DataConnection } from "peerjs";
import './styles.css';

const iceConfig = {
    iceServers: [
        { urls: "stun:stun.l.google.com:19302" }, // Primary STUN
        {
            urls: "turn:openrelay.metered.ca:80",   // Primary TURN
            username: "openrelayproject",
            credential: "openrelayproject"
        }
    ]
};

interface Connections {
    [key: string]: DataConnection[];
}

const peer: Peer = new Peer({
    config: iceConfig,
    debug: 3    // Log debug info
});

let connections: Connections = {};

peer.on('open', (id) => {
    const peerIDText = document.getElementById('peer-id');
    if (peerIDText) {
        peerIDText.setAttribute('value', id);
    }
});

peer.on('connection', (conn: DataConnection) => {
    if (!connections[conn.peer]) {
        connections[conn.peer] = [];
    }
    connections[conn.peer].push(conn);

    conn.on('data', (data) => {
        const log = document.getElementById('log');
        if (log) {
            log.textContent += `Received from ${conn.peer}: ${data}\n`;
        }
    });

    conn.on('close', () => {
        connections[conn.peer] = connections[conn.peer].filter(c => c !== conn);
        if (connections[conn.peer].length === 0) {
            delete connections[conn.peer];
        }
    });

    conn.on('error', (err) => {
        console.error('Connection error', err);
        const log = document.getElementById('log');
        log!.textContent += `Connection error: ${err}\n`;
    });

    conn.on('open', () => {
        const log = document.getElementById('log');
        log!.textContent += `Connection opened with ${conn.peer}\n`;
    });

    conn.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            console.log('New ICE candidate:', event.candidate);
        } else {
            console.log('ICE candidate gathering complete');
        }
    };
});

function App() {

    useEffect(() => {
        const connectButton = document.getElementById('connect-button');
        if (connectButton) {
            connectButton.addEventListener('click', () => {
                const connectId = (document.getElementById('connect-id') as HTMLInputElement).value;
                const conn = peer.connect(connectId);

                conn.on('open', () => {
                    if (!connections[connectId]) {
                        connections[connectId] = [];
                    }
                    connections[connectId].push(conn);
                    const log = document.getElementById('log');
                    log!.textContent += `Connected to ${connectId}\n`;
                });

                conn.on('data', (data) => {
                    const log = document.getElementById('log');
                    if (log) {
                        log.textContent += `Received from ${connectId}: ${data}\n`;
                    }
                });

                conn.on('close', () => {
                    connections[connectId] = connections[connectId].filter(c => c !== conn);
                    if (connections[connectId].length === 0) {
                        delete connections[connectId];
                    }
                });

                conn.on('error', (err) => {
                    console.error('Connection error', err);
                });
            });
        }

        const sendBtn = document.getElementById('send-button');
        const messageInput = document.getElementById('message') as HTMLInputElement;

        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                const message = messageInput.value;
                for (const conns of Object.values(connections)) {
                    conns.forEach((c: DataConnection) => {
                        c.send(message);
                    });
                }
                messageInput.value = '';
            });

            messageInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    sendBtn.click();
                }
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
                <label htmlFor="connect-id">Connect to Peer ID:</label>
                <input type="text" id="connect-id" />
                <button id="connect-button">Connect</button>
            </div>
            <div>
                <label htmlFor="message">Message:</label>
                <input type="text" id="message"  />
                <button id="send-button">Send</button>
            </div>
            <div>
                <label htmlFor="log">Log:</label>
                <textarea id="log" readOnly />
            </div>
        </>
    );
}

const rootElement = document.getElementById('root');
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<App />);
}