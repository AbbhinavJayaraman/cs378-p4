// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { useState, useEffect } from 'react';
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {TextField} from '@mui/material';
import './App.css';


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB7rizjofDSJURgM4E-zDwqukKBiieCY4o",
  authDomain: "cs378-p4-3a14d.firebaseapp.com",
  databaseURL: "https://cs378-p4-3a14d-default-rtdb.firebaseio.com",
  projectId: "cs378-p4-3a14d",
  storageBucket: "cs378-p4-3a14d.appspot.com",
  messagingSenderId: "605082661757",
  appId: "1:605082661757:web:d582a23eef5285b40cd214",
  measurementId: "G-NP6GZWE8YH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const auth = getAuth(app);

const BASE_URL = "https://api.open-meteo.com/v1/forecast?latitude=LAT&longitude=LONG&daily=apparent_temperature_max,apparent_temperature_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_hours,windspeed_10m_max,winddirection_10m_dominant,shortwave_radiation_sum&timezone=America%2FChicago"
const AUSTIN = "30.27, -97.74" //35.00, -91.98
const DATA_KEYS = ['apparent_temperature_max', 'apparent_temperature_min', 'sunrise', 'sunset', 'uv_index_max', 'precipitation_sum', 'precipitation_hours', 'windspeed_10m_max', 'winddirection_10m_dominant', 'shortwave_radiation_sum']
const DATA_UNITS = {"apparent_temperature_max":"°C","apparent_temperature_min":"°C","sunrise":"","sunset":"","uv_index_max":"","precipitation_sum":"mm","precipitation_hours":"h","windspeed_10m_max":"km/h","winddirection_10m_dominant":"°","shortwave_radiation_sum":"MJ/m²"}
const DATA_TEXTS = {"apparent_temperature_max":"Feels Like Max Temp: ","apparent_temperature_min":"Feels Like Min Temp: ","sunrise":"Sunrise: ","sunset":"Sunset: ","uv_index_max":"UV Index: ","precipitation_sum":"Total Precipitation: ","precipitation_hours":"Precipitation Duration: ","windspeed_10m_max":"Max Windspeed: ","winddirection_10m_dominant":"Wind Direction: ","shortwave_radiation_sum":"Total Shortwave Radiation: "}

function App() {
  const [user, setUser] = useState("Not Signed In");
  const [search, setSearch] = useState("");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [curLoc, setCurLoc] = useState(AUSTIN);
  const [locs, setLocs] = useState([AUSTIN]);
  const [weatherDatas, setWeatherDatas] = useState([]);


  const logIn = () => {
    signInWithEmailAndPassword(auth, email, pass)
    .then((userCredential) => {
      // Signed in 
      let userEmail = email.split('.')
      setUser(email);
      setEmail("");
      setPass("");
      // gotta pull up their data...
      console.log(userEmail[0])
      fetch(`${firebaseConfig.databaseURL}/users/${userEmail[0]}.json`)
      .then((res) => {
        if (res.status !== 200) {
          // The User most likely doesn't have any data yet or doesn't exist
          console.log(`User ${userEmail[0]} doesn't have any data`)
          console.log(res)
        } else {
          // restore state
          return res.json()
        }
      })
      .then((res) => {
        console.log("We have the data")
        console.log(res);
        let cl = res["curLoc"]
        let l = JSON.parse(res["locs"])
        let wd = JSON.parse(res["weatherDatas"])
        console.log(cl)
        console.log(l)
        console.log(wd)
        setCurLoc(cl)
        setLocs(l)
        setWeatherDatas(wd)
      })
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      alert(errorCode + " " + errorMessage)
    })
   
  }

  const logOut = () => {
    signOut(auth).then(() => {
      // Sign-out successful.
      let sampleDict = {
        curLoc: curLoc,
        locs: JSON.stringify(locs),
        weatherDatas: JSON.stringify(weatherDatas)
      }
  
      let oldUser = user.split(".")
      console.log(oldUser[0])
  
      setEmail("")
      setPass("")
      setUser("Not Signed In")
      setCurLoc(AUSTIN)
      setLocs([AUSTIN])
      setWeatherDatas([])
      
      return fetch(`${firebaseConfig.databaseURL}/users/${oldUser[0]}.json`, {
        method: "PUT",
        body: JSON.stringify(sampleDict)
      }).then((res) => {
        if (res.status !== 200) {
          console.log("There was an error saving user data out")
          console.log(res)
        } else {
          console.log(`logged out`)
          return
        }
      })
    }).catch((error) => {
      // An error happened.
      const errorCode = error.code;
      const errorMessage = error.message;
      alert(errorCode + " " + errorMessage)
    });
    
  }

  const showTheWeather = (key) => {
    if (weatherDatas.length === 0 || weatherDatas[curLoc] === undefined) {
      console.log("No data yet...")
      return <div key={key} className={"daily-stat"}>loading...</div>
    }
    return <div key={key} className={"daily-stat"}>
      <div className={"col text"}>{DATA_TEXTS[key]}</div>
      <div className={"col data"}>{weatherDatas[curLoc][key][0]}{DATA_UNITS[key]}</div>
    </div>
  }
  
  const getWeatherData = async (latlong) => {
    let nums = latlong.split(', ')
    if (nums.length !== 2) {
      console.log("What the user typed in : " + nums)
      alert("Please type in the longitude and latitude as specified")
      return;
    }
    setCurLoc(latlong)
    let lat = nums[0]
    let long = nums[1]
    let url = (BASE_URL.replace("LAT", lat)).replace("LONG", long)
    let json = null
    try {
      const response = await fetch(url)
      json = await response.json()
      if (!locs.includes(latlong)) {
        setLocs((list) => [...list, latlong]);
        console.log("added new thing")
      }
      let daily = json["daily"]
      console.log(daily)
      let rise = (daily["sunrise"][0].replace("T0", " "))
      let set = (daily["sunset"][0].replace("T1", " "))
      daily["sunrise"][0] = rise
      daily["sunset"][0] = set
      setWeatherDatas({...weatherDatas, [latlong]:daily})
    }
    catch (err) {
      console.log(err)
      alert("Error retrieving data, woohoo I'm quirky")
    }
    finally {
      setSearch("")
    }
  }

  useEffect(() => {
    getWeatherData(AUSTIN);
  }, []);
  
  return (
    <div className="App">
      <header className="App-header">
        <Container>
          <Row><div id="currentUser">{user}</div></Row>
          <Row>
            <Col><TextField id="outlined-basic" label="Email" fullWidth value={email} onChange={(event) => setEmail(event.target.value)} variant="filled"/></Col>
            <Col><TextField id="outlined-basic" label="Password" fullWidth value={pass} onChange={(event) => setPass(event.target.value)} variant="filled"/></Col>
            <Col><button key={"login"} onClick={() => logIn()}>Log in</button></Col>
            <Col><button key={"logout"} onClick={() => logOut()}>Log Out</button></Col>
          </Row>
        </Container>
        <h1> The Extra Weather App</h1>
        <em> The weather app, that is sooo extra</em>
        <div className={"Search-Bar"}>
          <TextField id="outlined-basic" label="Latitude, Longitude" fullWidth value={search} onChange={(event) => setSearch(event.target.value)} variant="filled"/>
          <button key={"add"} onClick={() => getWeatherData(search)}>+</button>
        </div>
        {locs.map((loc, i) => (
            <button
              className={`Location ${loc === curLoc ? "Current" : ""}`}
              key={i}
              onClick={() => getWeatherData(loc)}
            >{loc}</button>
        ))}
        <div><br></br></div>
        <div 
          className={"row"}
          key={"weather"}>{DATA_KEYS.map((key) => (showTheWeather(key)))}
        </div>
      </header>
    </div>
  );
}

export default App;
