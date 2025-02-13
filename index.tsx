import React, { useEffect } from 'react';
    import { createRoot } from 'react-dom/client';
    import Peer, { DataConnection } from "peerjs";
    import './styles.css';

    const iceConfig = {
        iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            {
                urls: "turn:openrelay.metered.ca:443",  // primary TURN server
                username: "openrelayproject",
                credential: "openrelayproject"
            },
            {
                urls: "turn:openrelay.metered.ca:80",   // secondary TURN server
                username: "openrelayproject",
                credential: "openrelayproject"
            },
            {
                urls: "turn:openrelay.metered.ca:3478",  // tertiary TURN server
                username: "openrelayproject",
                credential: "openrelayproject"
            }
        ]
    };

    const reconnectConfig = {
        minDelaySec: 2,
        maxDelaySec: 15,
        maxRetries: 10
    };

    interface Connections {
        [key: string]: DataConnection[];
    }

    const peer: Peer = new Peer({
        config: iceConfig,
        debug: 3
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

        let retryCount = 0;

        const attemptReconnect = () => {
            if (retryCount < reconnectConfig.maxRetries) {
                const delay = Math.min(reconnectConfig.minDelaySec * 1000 * Math.pow(2, retryCount), reconnectConfig.maxDelaySec * 1000);
                setTimeout(() => {
                    console.log('Retrying connection...');
                    conn.peerConnection.restartIce();
                    retryCount++;
                }, delay);
            } else {
                console.log('Max retries reached. Connection failed.');
            }
        };

        conn.peerConnection.addEventListener('iceconnectionstatechange', () => {
            if (conn.peerConnection.iceConnectionState === 'failed') {
                console.log('Connection failed. Retrying...');
                attemptReconnect();
            }
        });
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

                    let retryCount = 0;

                    const attemptReconnect = () => {
                        if (retryCount < reconnectConfig.maxRetries) {
                            const delay = Math.min(reconnectConfig.minDelaySec * 1000 * Math.pow(2, retryCount), reconnectConfig.maxDelaySec * 1000);
                            setTimeout(() => {
                                console.log('Retrying connection...');
                                conn.peerConnection.restartIce();
                                retryCount++;
                            }, delay);
                        } else {
                            console.log('Max retries reached. Connection failed.');
                        }
                    };

                    conn.peerConnection.addEventListener('iceconnectionstatechange', () => {
                        if (conn.peerConnection.iceConnectionState === 'failed') {
                            console.log('Connection failed. Retrying...');
                            attemptReconnect();
                        }
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