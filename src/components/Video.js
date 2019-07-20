import React,{Component} from 'react'
//import {ScaleDrone} from '../assets/scaledrone'

class Video extends Component{
    constructor(props){
        super(props);

        let configuration = {
            iceServers: [{
            urls: 'stun:stun.l.google.com:19302' // Google's public STUN server
            }]
        };
          if (!window.location.hash) {
            window.location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
           }
          this.roomHash = window.location.hash.substring(1);
          this.pc = new RTCPeerConnection(configuration);
          this.audio = React.createRef()
          this.video = React.createRef()
          this.remotevideo = React.createRef()
          this.canvas = React.createRef()
          this.roomName = 'observable-' + this.roomHash;
        
        this.drone = new window.ScaleDrone('sXJT2grQOdaK4zdB');
        this.room= this.drone.subscribe(this.roomName);
        console.log(this.pc);
    }
    handleSuccess = (stream)=> {
        console.log(this.audio)
        console.log(this.video)
        let audio = this.audio.current;
        let video = this.video.current;
        const audioTracks = stream.getAudioTracks();
        console.log('Got stream with constraints:', this.constraints);
        
        stream.oninactive = function() {
          console.log('Stream ended');
        };
        window.stream = stream; // make variable available to browser console
        audio.srcObject = stream;
        video.srcObject = stream;
      }
    handleError=(error) =>{
        console.log('navigator.MediaDevices.getUserMedia error: ', error.message, error.name);
    }
    handleclick = () => {
        let video = this.video.current;
        let canvas = this.canvas.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      };
    sendMessage = (message) => {
        this.drone.publish({
          room: this.roomName,
          message
        });
       }
    
    localDescCreated = (desc) => {
        this.pc.setLocalDescription(
          desc,
          () => this.sendMessage({'sdp': this.pc.localDescription}),
          onError
        );
       }
    startWebRTC = (isOfferer) => {
        
        // 'onicecandidate' notifies us whenever an ICE agent needs to deliver a
        // message to the other peer through the signaling server
        this.pc.onicecandidate = event => {
          if (event.candidate) {
            this.sendMessage({'candidate': event.candidate});
          }
        };
        
        // If user is offerer let the 'negotiationneeded' event create the offer
        if (isOfferer) {
          this.pc.onnegotiationneeded = () => {
            this.pc.createOffer().then(this.localDescCreated).catch(onError);
          }
        }
        
        // When a remote stream arrives display it in the #remoteVideo element
        this.pc.onaddstream = event => {
          this.remotevideo.current.srcObject = event.stream;
        };
        console.log("in this one !")
        navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        }).then(stream => {
          // Display your local video in #localVideo element
          this.video.current.srcObject = stream;
          // Add your stream to be sent to the conneting peer
          this.pc.addStream(stream);
        }, onError);
       }

    startListentingToSignals = () =>{
        // Listen to signaling data from Scaledrone
        this.room.on('data', (message, client) => {
          // Message was sent by us
          if (!client || client.id === this.drone.clientId) {
            return;
          }
          if (message.sdp) {
            // This is called after receiving an offer or answer from another peer
            this.pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
              // When receiving an offer lets answer it
              if (this.pc.remoteDescription.type === 'offer') {
                this.pc.createAnswer().then(this.localDescCreated).catch(onError);
              }
            }, onError);
          } else if (message.candidate) {
            // Add the new ICE candidate to our connections remote description
            this.pc.addIceCandidate(
              new RTCIceCandidate(message.candidate), onSuccess, onError
            );
          }
        });
       }
    componentDidMount(){
        // if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            
        //     navigator.mediaDevices.getUserMedia(this.constraints).then(this.handleSuccess
        //     ).catch(this.handleError);
        // }else if(navigator.getMedia){
        //     console.log('in this one!')
        //     navigator.getMedia({
        //         video: true
        //     }).then(this.handleSuccess).catch(this.handleError);
        // }

        
        
        this.drone.on('open', error => {
        if (error) {
        return onError(error);
        }
        
        this.room.on('open', error => {
        if (error) {
            onError(error);
        }
        });
        // We're connected to the room and received an array of 'members'
        // connected to the room (including us). Signaling server is ready.
        this.room.on('members', members => {
        if (members.length >= 3) {
            return alert('The room is full');
        }
        // If we are the second user to connect to the room we will be creating the offer
        const isOfferer = members.length === 2;
        console.log("in this?")
        this.startWebRTC(isOfferer);
        this.startListentingToSignals();
        });
});

    }

    render(){
        return (
        <div id="container">
            <audio id="gum-local" ref={this.audio} controls autoplay></audio>
            <video id="localvideo" playsInline autoPlay ref={this.video}></video>
            <video id="remotevideo" autoPlay ref={this.remotevideo}></video>
            <button onClick={this.handleclick}>Take snapshot</button>
            <canvas ref={this.canvas}></canvas>

        </div>
        );
    }
}

export default Video;


function onSuccess() {};
function onError(error) {
  console.error(error);
};
