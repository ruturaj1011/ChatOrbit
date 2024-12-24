import React, { useEffect, useRef, useState } from 'react';
import styles from "../styles/videoMeet.module.css";
import { CallEnd, Chat, Mic, MicOff, ScreenShare, StopScreenShare, Videocam, VideocamOff } from "@mui/icons-material"
import { Badge, Button, IconButton, TextField } from '@mui/material';
import io from "socket.io-client";

const serverUrl = "http://localhost:8000";

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { 'urls': "stun:stun.l.google.com:19302" }
    ]
}


function VideoMeet() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoref = useRef();

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState();
    let [audio, setAudio] = useState();
    let [screen, setScreen] = useState();

    let [showModel, setShowModel] = useState();

    let [screenAvailable, setScreenAvailable] = useState();

    let [messages, setMessages] = useState([]);
    let [message, setMessage] = useState("");
    let [newMessages, setNewMessages] = useState(0);

    let [askForUserName, setAskForUsername] = useState(true);
    let [username, setUsername] = useState("");

    const videoRef = useRef([]);

    let [videos, setVideos] = useState([]);


    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoPermission) {
                setVideoAvailable(true);
                console.log('Video permission granted');
            } else {
                setVideoAvailable(false);
                console.log('Video permission denied');
            }

            const audioPermission = await navigator.mediaDevices.getUserMedia({ audio: true });
            if (audioPermission) {
                setAudioAvailable(true);
                console.log('Audio permission granted');
            } else {
                setAudioAvailable(false);
                console.log('Audio permission denied');
            }

            if (navigator.mediaDevices.getDisplayMedia) {
                setScreenAvailable(true);
            } else {
                setScreenAvailable(false);
            }

            if (videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: videoAvailable, audio: audioAvailable });
                if (userMediaStream) {
                    window.localStream = userMediaStream;
                    if (localVideoref.current) {
                        localVideoref.current.srcObject = userMediaStream;
                    }
                }
            }
        } catch (error) {
            console.log(error + " Permission Denied");
        }
    };

    useEffect(() => {

        getPermissions();
    }, []);

    let getUserMediaSuccess = (stream) => {

        try {
            window.localStream.getTracks().forEach(track => track.stop())
        }
        catch (e) {
            console.log(e);
        }

        window.localStream = stream;
        localVideoref.current.srcObject = stream;

        for (let id in connections) {
            if (id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream);

            connections[id].createOffer()
                .then((description) => {

                    connections[id].setLocalDescription(description)
                        .then(() => {
                            socketIdRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }))
                        })
                        .catch(e => console.log(e));
                })
                .catch(e => console.log(e));
        }

        stream.getTracks().forEach(track.onended = () => {
            setVideo(false);
            setAudio(false);

            try {

                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())

            } catch (error) {
                console.log(error);
            }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);

            window.localStream = blackSilence();
            localVideoref.current.srcObject = window.localStream;

            for (let id in connections) {
                let stream = window.localStream;

                stream.getTracks().forEach(track => connections[id].addTrack(track, stream));

                connections[id].createOffer()
                    .then(description => {
                        connections[id].setLocalDescription(description)
                            .then(() => {
                                socketIdRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription }));
                            })
                            .catch(e => console.log("Error setting local description:", e));
                    })
                    .catch(e => console.log("Error creating offer:", e));
            }
        })
    }

    let black = ({ width = 640, height = 400 } = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), { width, height });
        let ctx = canvas.getContext("2d");
        ctx.fillStyle = "black";
        ctx.fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false });
    };

    let silence = () => {
        let ctx = new AudioContext();
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        let track = dst.stream.getAudioTracks()[0];
        return Object.assign(track, { enabled: false });
    };


    let getUserMedia = () => {
        if ((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({ video: video, audio: audio })
                .then(getUserMediaSuccess)
                .then((stream) => { })
                .catch((e) => {
                    console.log(e);
                })
        } else {
            try {
                let tracks = localVideoref.current.srcObject.getTracks();

                tracks.forEach(track => track.stop())
            }
            catch (e) {
                console.log(e);
            }
        }
    }

    useEffect(() => {
        if (video !== undefined && audio !== undefined) {
            getUserMedia();
        }
    }, [audio, video]);

    let gotMessageFromServer = (fromId, message) => {
        var signal = JSON.parse(message);

        if (fromId !== socketIdRef.current) {
            if (signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp))
                    .then(() => {

                        if (signal.sdp.type === "offer") {
                            connections[fromId].createAnswer()
                                .then((description) => {

                                    connections[fromId].setLocalDescription(description)
                                        .then(() => {
                                            socketIdRef.current.emit("signal", fromId, JSON.stringify({ "sdp": connections[fromId].localDescription }))
                                        })
                                        .catch((e) => {
                                            console.log(e);
                                        })

                                })
                                .catch((e) => {
                                    console.log(e);
                                })
                        }
                    })
                    .catch((e) => {
                        console.log(e);
                    })
            }
        }

        if (signal.ice) {
            connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice))
                .catch((e) => {
                    console.log(e);
                })
        }
    }
    let addMessage = () => {

    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(serverUrl, { secure: false });

        socketRef.current.on('signal', gotMessageFromServer)

        socketRef.current.on("connect", () => {
            socketRef.current.emit("join-call", window.location.href);

            socketIdRef.current = socketRef.current.id;

            socketRef.current.on("chat-message", addMessage);

            socketRef.current.on("user-left", (id) => {
                setVideo((videos) => videos.filter((video) => video.socketId !== id))
            });

            socketRef.current.on("user-joined", (id, clients) => {
                clients.forEach((socketListId) => {

                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections);

                    connections[socketListId].onicecandidate = (event) => {
                        if (event.candidate != null) {

                            socketListId.current.emit("signal", socketListId, JSON.stringify({ "ice": event.candidate }));


                        }
                    }

                    connections[socketListId].onaddstream = (event) => {

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {

                            setVideo(videos => {

                                const updatedVideos = videos.map(video => video.socketId === socketListId ? { ...video, stream: event.stream } : video);

                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        } else {

                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoPlay: true,
                                playsinline: true
                            }

                            setVideos(videos => {
                                const updatedVideos = [...videos, newVideo];
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    if (window.localStream !== undefined && window.localStream !== null) {
                        connections[socketListId].addStream(window.localStream);
                    } else {

                        let blackSilence = (...args) => new MediaStream([black(...args), silence()]);

                        window.localStream = blackSilence();

                        connections[socketListId].addStream(window.localStream);
                    }
                })

                if (id === socketIdRef.current) {
                    for (let id2 in connections) {

                        if (id2 === socketIdRef.current) continue;

                        try {
                            connections[id2].addStream(window.localStream)
                        } catch (e) {

                        }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                                .then(() => {
                                    socketRef.current.emit("signal", id2, JSON.stringify({ "sdp": connections[id2].localDescription }))
                                })
                                .catch((e) => {
                                    console.log(e);
                                })
                        })
                    }
                }
            })
        })
    }

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);

        connectToSocketServer();
    }

    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }

    let handleVideo = () => {
        setVideo(!video);
    }
    let handleAudio = () => {
        setAudio(!audio);
    }

    let getDisplayMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach( track => track.stop())
        } catch (error) {
            console.log(error);
        }

        window.localStream = stream;
        localVideoref.current.srcObject = stream;

        for(let id in connections){
            if(id === socketIdRef.current) continue;

            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description) => {
                connections[id].setLocalDescription(description
                ).then(() => {
                    socketRef.current.emit("signal", id, JSON.stringify({"sdp":connections[id].localDescription}))
                })
                .catch((e) => {
                    console.log(e);
                })
            })
            .catch((e) => {
                console.log(e);
            })
        }

        stream.getTracks().forEach(track.onended = () => {
            
            setScreen(false);

            try {

                let tracks = localVideoref.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())

            } catch (error) {
                console.log(error);
            }

            let blackSilence = (...args) => new MediaStream([black(...args), silence()]);

            window.localStream = blackSilence();
            localVideoref.current.srcObject = window.localStream;

            getUserMedia();
        })
    }
    let getDisplayMedia = () => {
        if(screen){
            if( navigator.mediaDevices.getDisplayMedia){
                navigator.mediaDevices.getDisplayMedia({video:true, audio:true})
                .then(getDisplayMediaSuccess)
                .then((stream) => {})
                .catch((e) => console.log(e));
            }
        }
    }

    useEffect(() => {
        if(screen !== undefined){
            getDisplayMedia();
        }
    }, [screen])

    let handleScreen = () => {
        setScreen(!screen);
    }

    return (
        <div>

            {askForUserName === true ?

                <div>

                    <h2>Enter into Lobby</h2>
                    <TextField id='outlined-basic' label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        variant='outlined'></TextField>
                    <Button variant="contained" onClick={connect}>Connect</Button>

                    <div>
                        <video ref={localVideoref} autoPlay muted style={{ width: "400px", height: "300px" }}></video>
                    </div>
                </div> : <div className={styles.meetVideoCont}>

                    {}
                    <div className={styles.chatRoom}>
                        <h2>Chat</h2>

                    </div>

                    <div className={styles.buttonsCont}>

                        <IconButton onClick={handleVideo} style={{ color: "white" }}>

                            {(video === true) ? <Videocam /> : <VideocamOff />}
                        </IconButton>

                        <IconButton style={{ color: "Red" }}>

                            <CallEnd />
                        </IconButton>

                        <IconButton onClick={handleAudio} style={{ color: "white" }}>

                            {(audio === true) ? <Mic /> : <MicOff />}
                        </IconButton>

                        {screenAvailable == true ?
                            <IconButton onClick={handleScreen} style={{ color: "white" }}>
                                {screen == true ? <ScreenShare /> : <StopScreenShare />}
                            </IconButton> : <></>
                        }

                        <Badge badgeContent={newMessages} max={99} color='secondary'>
                            <IconButton style={{ color: "white" }}>
                                <Chat />
                            </IconButton>
                        </Badge>
                    </div>

                    <video className={styles.meetUserVideo} ref={localVideoref} autoPlay muted></video>

                    <div className={styles.conferenceView}>
                        {videos.map((video) => (
                            <div key={video.socketId}>
                                <video
                                    data-socket={video.socketId}
                                    ref={ref => {
                                        if (ref && video.stream) {
                                            ref.srcObject = video.stream;
                                        }
                                    }}
                                    autoPlay
                                >
                                </video>
                            </div>
                        ))}
                    </div>
                </div>
            }
        </div>
    );
}

export default VideoMeet;