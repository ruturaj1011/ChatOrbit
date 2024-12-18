import React, { useEffect, useRef, useState } from 'react';
import "../styles/vedioMeet.css";
import { Button, TextField } from '@mui/material';


const serverUrl = "http://localhost:8000";

var connections = {};

const peerConfigConnections = {
    "iceServers":[
        { 'urls' : "stun:stun.l.google.com:19302"}
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
            console.log(error);
        }
    };

    useEffect( () => {

        getPermissions();
    }, []);

    let getUserMediaSuccess = (stream) => {

    }

    let getUserMedia = () => {
        if((video && videoAvailable) || (audio && audioAvailable) ){
            navigator.mediaDevices.getUserMedia({video: video, audio: audio})
            .then(getUserMediaSuccess)
            .then((stream) => {})
            .catch((e) => {
                console.log(e);
            })
        }else{
            try{
                let tracks = localVideoref.current.srcObject.getTracks();

                tracks.forEach(track => track.stop())
            }
            catch(e){
                console.log(e);
            }
        }
    }

    useEffect( () => {
        if(video !== undefined && audio !== undefined){
            getUserMedia();
        }
    }, [audio, video]);

    let gotMessageFromServer = (fromId, message) => {

    }
    let addMessage = () => {

    }

    let connectToSocketServer = () => {
        socketRef.current = io.connect(serverUrl, {secure: false});

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
                        if(event.candidate != null){

                            socketListId.current.emit("signal", socketListId, JSON.stringify({"ice":event.candidate}));

                            
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {

                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if(videoExists){

                            setVideo(videos => {

                                const updatedVideos = videos.map(video => video.socketId === socketListId ? {...video, stream:event.stream} : video);

                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        }else{

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

                    if(window.localStream !== undefined && window.localStream !== null){
                        connections[socketListId].addStream(window.localStream);
                    }else{
                        // let blackSilence
                    }
                })

                if(id === socketId.current){
                    for(let id2 in connections){

                        if(id2 === socketIdRef.current) continue;

                        try{
                            connections[id2].addStream(window.localStream)
                        }catch(e){

                        }

                        connections[id2].createOffer().then((description) => {
                            connections[id2].setLocalDescription(description)
                            .then(()=>{
                                socketRef.current.emit("signal", id2, JSON.stringify({"sdp": connections[id2].localDescription}))
                            })
                            .catch((e)=>{
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


    // if(isChrome() === false){

    // }

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
                </div> : <></>
            }
        </div>
    );
}

export default VideoMeet;