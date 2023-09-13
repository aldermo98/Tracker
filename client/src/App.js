import './App.css';
import { useEffect, useState, useRef } from 'react'
import Select from 'react-select'
import axios from 'axios';

function App() {
    const MAX_IDLE = 1000 * 60 * 60;    //max idle time is 1 hour before setting to inactive. time in milliseconds

    const [isTracking, setIsTracking] = useState(false);
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [discoverDistance, setDiscoverDistance] = useState(1000);
    const [location, setLocation] = useState({});
    const {nearbyUsers} = useDiscoverNearby(isDiscovering, location, discoverDistance);
    const [timestamp, setTimestamp] = useState(new Date().getTime());
    const [watchId, setWatchId] = useState(0);
    
    
    /*************************  Callbacks for Geolocation.watchPosition()************************************* */

        //real-time location callback method. update latest time and db with coordinates
        const positionFound = (position) => {
            setLocation(position.coords);
            setTimestamp(position.timestamp);
            axios.post(`/track`, {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            })
                .then(res => console.log(res.data))
                .catch(err => console.log(err));
            
        };

        //error callback method for Geolocation.watchPosition
        const errorCallback = (error) => {
            switch (error.code) {
                case 1: alert("Tracking permission denied. Please allow location tracking for this site.");
                    break;
                case 2: console.log(error);
                    break;
                case 3: alert("Timed out: location could not be found");
                    break;
                default:
            }
        };

        //options for Geolocation.watchPosition
        const options = {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        };
    /************************************************************************************************************ */

    //cleanup method and update db active status
    const inactivate = () => {
        setIsDiscovering(false);
        navigator.geolocation.clearWatch(watchId);
        axios.get(`/stop-tracking`)
            .then(res => console.log(res.data))
            .catch(err => console.log(err));
    }


    //timer
    useInterval(() => {
        if (isTracking) {
            if (new Date().getTime() - timestamp > MAX_IDLE) {    //if position hasnt moved in over MAX_IDLE time
                inactivate();
                setIsTracking(!isTracking);
                alert(`Tracker timed out: You haven't relocated in ${MAX_IDLE / 1000 / 60} minutes.`);
            }
        }
    }, MAX_IDLE);


    //start tracking on track button click
    useEffect(() => {
        if (!(navigator.geolocation)) {
            alert("Browser is not supported for Geolocation");
            return;
        }

        if (isTracking) {
            const id = navigator.geolocation.watchPosition(positionFound, errorCallback, options);
            setWatchId(id);
        } else if (watchId > 0)    //do not inactivate on initial load to avoid infinite loop. only inactivate if currently tracking
            inactivate();

    }, [isTracking]);

    const selectOptions = [
        { value: 1000, label: "1 km", color: "black", backgroundColor: "grey" },
        { value: 5000, label: "5 km", color: "black", backgroundColor: "grey" },
        { value: 10000, label: "10 km", color: "black", backgroundColor: "grey" }
    ]
    return (
        <div className="App">
            <header className="App-header">
                <button className="bigButton red" onClick={() => setIsTracking(!isTracking)}>{isTracking ? "Stop Tracking" : "Track Me"}</button>
                { isTracking &&
                    <>
                        <div className='discover'>
                            <button className="bigButton blue" disabled={!isTracking} onClick={() => setIsDiscovering(!isDiscovering)}>{!isDiscovering ? "Get Nearby Users Around" : "Hide Nearby Users"}</button>                      
                            <Select
                                defaultValue={selectOptions[0]}
                                options={selectOptions}
                                onChange={(selected)=>setDiscoverDistance(selected.value)}
                                styles={{
                                    control: (styles) => ({...styles, color: "black", height: "100%" }),
                                    option: (styles, { data }) => {
                                        return { ...styles, color: data.color };
                                    }
                                }}
                            />
                        </div>
                        <ul>
                            {isDiscovering && 
                                nearbyUsers.map((user) => {
                                    return nearbyUsers.length > 0 ? 
                                        <li key={user._id}>UserIP: {user.ip} @ {user.location.coordinates[1]}, {user.location.coordinates[0]}</li>
                                    : 
                                        <p>"No users found nearby, loner"</p>
                            })}
                        </ul>
                    </>
                }
            </header>
        </div>
    );
}

function useDiscoverNearby(isDiscovering, location, distanceFilter) {
    const [nearbyUsers, setNearbyUsers] = useState([]);
    
    useEffect(() => {
        if (isDiscovering) {
            axios.post(`/get-nearby-users`, {
                latitude: location.latitude,
                longitude: location.longitude,
                distance: distanceFilter
            })
                .then(res => {
                    setNearbyUsers(res.data);
                })
                .catch(err => console.log(err));
        }
    }, [isDiscovering, distanceFilter]);

    return {nearbyUsers}
}

//custom setInterval hook for persisting states in setInterval. timeout if user hasnt oved in MAX_IDLE time
/*
    [reference]: https://overreacted.io/making-setinterval-declarative-with-react-hooks/
*/
function useInterval(callback, delay) {
    const savedCallback = useRef();

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        function tick() {
            savedCallback.current();
        }
        if (delay !== null) {
            let id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}

export default App;
