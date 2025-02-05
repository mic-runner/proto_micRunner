import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import Peer, { DataConnection } from "peerjs";

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
    config: iceConfig
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
    });
});

function App() {
    const [message, setMessage] = useState('');

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
        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                for (const conns of Object.values(connections)) {
                    conns.forEach((c: DataConnection) => {
                        c.send(message);
                    });
                }
            });
        }
    }, []); // Empty dependency array to run only once

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
                <input type="text" id="message" value={message} onChange={(e) => setMessage(e.target.value)} />
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