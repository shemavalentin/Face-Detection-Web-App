import React, {Component} from 'react';
import ParticlesBg from 'particles-bg';
//import Clarifai from 'clarifai';
//import axios, * as others from 'axios';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import Navigation from './components/Navigation/Navigation';
import Signin from './components/Signin/Signin';
import Register from './components/Register/Register';
import Logo from './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Rank from './components/Rank/Rank';
import './App.css';

// const app = new Clarifai.App({
//   apiKey: 'c4a2f601353947ef93a79b71588a0f7a'

// });
const returnClarifaiRequestOptions = (imageUrl) => {
  // Your PAT (Personal Access Token) can be found in the portal under Authentification
    const PAT = '07c1d1e7681f463ca490af5df20e7327';
    // Specify the correct user_id/app_id pairings
    // Since you're making inferences outside your app's scope
    const USER_ID = 'shemavalen';       
    const APP_ID = 'test';
    // Change these to whatever model and image URL you want to use
    const MODEL_ID = 'face-detection';
    // const MODEL_VERSION_ID = 'aa7f35c01e0642fda5cf400f543e7c40';    
    const IMAGE_URL = 'imageUrl';

    const raw = JSON.stringify({
        "user_app_id": {
            "user_id": USER_ID,
            "app_id": APP_ID
        },
        "inputs": [
            {
                "data": {
                    "image": {
                        "url": IMAGE_URL
                    }
                }
            }
        ]
    });
    const requestOptions = {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Authorization': 'Key ' + PAT
        },
        body: raw
    };
    return requestOptions
}

const initialState = {
      input:'',
      imageUrl: '',
      box: {},
      //We need this state to keep track of where we are in the app
      route: 'signin',
      isSignedIn: false,
      user: {
        id: '',
        name: '',
        email:'',
        entries: 0,
        joined: ''
      }
}

class App extends Component{
  // Creating state to remember what input users enters in and update is when changes.
  constructor(){
    super();
    this.state = initialState;
  }

  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email:data.email,
      entries: data.entries,
      joined:data.joined
    }})
  }

  // componentDidMount(){
  //   fetch('http://localhost:3001/')
  //   .then(response => response.json())
  //   .then(console.log)
  // }

  calculateFaceLocation = (data) =>{
    const clarifaiFace= data.outputs[0].data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    return {
      leftCol: clarifaiFace.left_col*width,
      topRow: clarifaiFace.top_row*height,
      rightCol: width - (clarifaiFace.right_col * width),
      bottomRow: height - (clarifaiFace.bottom_row * height)
    }
  }

  displayFaceBox = (box) => {
    this.setState({box:box});
  }

  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }

  onButtonSubmit = () => {
    this.setState({imageUrl: this.state.input});

    // app.models
    // .predict(
    //     Clarifai.FACE_DETECT_MODEL,
    //     this.state.input)

    fetch("https://api.clarifai.com/v2/models/" + 'face-detection'  + "/outputs", returnClarifaiRequestOptions(this.state.input))
        .then(response => response.json())
          .then(response => {
            console.log('hi', response)
            if(response){
              fetch('http://localhost:3001/image',{
                method: 'put',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                  id: this.state.user.id
                })
              })
              .then(response => response.json())
              .then(count => {
                this.setState(Object.assign(this.state.user, {entries:count}))
              })
            }
            this.displayFaceBox(this.calculateFaceLocation(response))
          })        
      .catch(err => console.log(err));   
  }

  onRouteChange = (route) => {
    if (route === 'signout'){
      this.setState(initialState)
    } else if (route === 'home') {
      this.setState({isSignedIn: true})
    }
    this.setState({route: route});
  }
  render (){
    const{isSignedIn, imageUrl, route, box} = this.state;
    return (
      <div className="App">
      <ParticlesBg className = 'particles'
        color = "#FFFFFF" num={100} type="cobweb" bg={true} 
        />
      <Navigation isSignedIn = { isSignedIn } onRouteChange = {this.onRouteChange}/>
      { route === 'home'
        ? <div>
            <Logo/>
            <Rank
            name = {this.state.user.name}
            entries ={ this.state.user.entries }
            />
            <ImageLinkForm 
            onInputChange = { this.onInputChange }
            onButtonSubmit = {this.onButtonSubmit}
            />
            <FaceRecognition box = { box } imageUrl = { imageUrl }/>
         </div>
        : (
          route === 'signin' 
          ? <Signin loadUser={this.loadUser}  onRouteChange = {this.onRouteChange}/>
          : <Register loadUser = { this.loadUser } onRouteChange = {this.onRouteChange}/>
          ) 
      }
      </div>
   );
  } 
}
export default App;
