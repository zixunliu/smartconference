import React,{Component} from 'react'

class Video extends Component{
    constructor(props){
        super(props);
        let constraints  = {
            audio: true,
            video: true
          };
          this.audio = React.createRef()
          this.video = React.createRef()
          this.canvas = React.createRef()

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

    componentDidMount(){
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            
            navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            }).then(this.handleSuccess
            ).catch(this.handleError);
        }else if(navigator.getMedia){
            console.log('in this one!')
            navigator.getMedia({
                video: true
            }).then(this.handleSuccess).catch(this.handleError);
        }

    }

    render(){
        return (
        <div id="container">
            <audio id="gum-local" ref={this.audio} controls autoplay></audio>
            <video playsInline autoPlay ref={this.video}></video>
            <button onClick={this.handleclick}>Take snapshot</button>
            <canvas ref={this.canvas}></canvas>

        </div>
        );
    }
}

export default Video;


