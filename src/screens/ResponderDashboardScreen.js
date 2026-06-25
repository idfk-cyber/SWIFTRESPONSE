import { FontAwesome5, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { signOut } from 'firebase/auth';
import { collection, doc, getDoc, onSnapshot, query, updateDoc, where } from 'firebase/firestore';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Platform,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import MapView, { Circle, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { auth, db } from '../../firebaseConfig';
import AlertModal from '../components/AlertModal';

export default function ResponderDashboardScreen() {
  const [isOnline, setIsOnline] = useState(true);
  const [location, setLocation] = useState(null);
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [userName, setUserName] = useState("Responder")
  const [selectedIncident, setSelectedIncident] = useState(null);
  /*useEffect(() => {
    console.log("selectedIncident changed to:", selectedIncident);
  }, [selectedIncident]);*/
  const hasAlerted = useRef(false);
  const selectedIncidentRef = useRef(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [acceptedDestination, setAcceptedDestination] = useState(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);
    })();

    const fetchProfile = async () => {
      if (!auth.currentUser) return null;
      if (auth.currentUser) {
        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          // The firstName during registration
          setUserName(userDoc.data().firstName);
          setVerificationStatus(userDoc.data().verificationStatus);
          return data.verificationStatus;
        }
      }
      return null;
    };

    let unsubscribeIncidents = null;

    fetchProfile().then((status) => {
      const q = query(
        collection(db, "incidents"),
        where("status", "==", "PENDING")
      );
      
      unsubscribeIncidents = onSnapshot(q, (snapshot) => {
        const incidents = [];
        snapshot.forEach((doc) => {
          incidents.push({ id: doc.id, ...doc.data() });
        });
        setActiveIncidents(incidents);
        
        if (incidents.length > 0 && isOnline && !hasAlerted.current && status === 'VERIFIED') {
          hasAlerted.current = true;
          setSelectedIncident(incidents[0]);
          selectedIncidentRef.current = incidents[0];
          setModalVisible(true);
        }
        
        if (incidents.length === 0) {
          hasAlerted.current = false;
        }
      });
    });

    return () => {
      if (unsubscribeIncidents) unsubscribeIncidents();
    };
  }, [isOnline]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      
      {/* HEADER CARD */}
      <View style={styles.headerCard}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Hello, Medic {userName}</Text>
            
            <View style={styles.statusBadge}>
              <View style={[styles.statusDot, {backgroundColor: isOnline ? '#22c55e' : '#8A7A6D'}]} />
              <Text style={[styles.statusText, {color: isOnline ? '#22c55e' : '#8A7A6D'}]}>
                {isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>
          
          <View style={{flexDirection: 'row', alignItems: 'center', gap: 15}}>
             <Switch
                trackColor={{ false: "#E0CFBE", true: "#22c55e" }}
                thumbColor={"#f4f3f4"}
                onValueChange={() => setIsOnline(!isOnline)}
                value={isOnline}
             />
             
             {/* LOGOUT BUTTON */}
             <TouchableOpacity onPress={handleLogout} style={{padding: 5}}>
                <Ionicons name="log-out-outline" size={24} color="#ef4444" />
             </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* MAP AREA */}
      <View style={styles.mapContainer}>
        {location ? (
          // Map is picked from React Native Maps Community guidelines
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            userInterfaceStyle="light"
          >
            {/* Responder Location */}
            <Marker coordinate={location}>
              <View style={styles.responderMarker}>
                 <FontAwesome5 name="user-md" size={16} color="white" />
              </View>
            </Marker>
            
            {/* Range Circle set to 500m*/}
            <Circle 
              center={location}
              radius={500}
              fillColor="rgba(59, 130, 246, 0.1)"
              strokeColor="rgba(59, 130, 246, 0.3)"
            />

            {/* Render Incidents as Red Points */}
            {isOnline && activeIncidents.map(incident => (
               <Marker 
                 key={incident.id}
                 coordinate={incident.location}
                 title="Emergency"
                 description="Tap to Respond"
               >
                 <View style={styles.incidentMarker}>
                    <FontAwesome5 name="exclamation" size={14} color="white" />
                 </View>
               </Marker>
            ))}

            {/* Routing Line to the Accepted Incident */}
            {acceptedDestination && location && (
              <MapViewDirections
                origin={location}
                destination={acceptedDestination}
                apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_KEY}
                strokeWidth={4}
                strokeColor="#ef4444"
                onReady={(result) => {
                  console.log("Route ready:", result.distance, result.duration);
                  setRouteInfo({
                    distance: result.distance.toFixed(1),
                    duration: Math.ceil(result.duration)
                  });
                }}
                onError={(error) => console.log("Directions error:", error)}
              />
            )}

          </MapView>
        ) : (
          <View style={styles.loadingMap}>
            <Text style={{color: '#8A7A6D'}}>Loading Map...</Text>
          </View>
        )}

        {/* STATUS OVERLAY */}
        <View style={styles.bottomCard}>
           <View style={styles.statusContent}>
              <View>
                 <Text style={styles.statusLabel}>STATUS</Text>
                 <Text style={styles.statusValue}>
                    {routeInfo
                       ? `${routeInfo.distance} km • ${routeInfo.duration} min away`
                       : activeIncidents.length > 0 
                       ? `${activeIncidents.length} Active Incidents` 
                       : "Monitoring Area..."}
                 </Text>
              </View>
              <View style={styles.radarIcon}>
                 <Ionicons name="radar" size={24} color="#22c55e" />
              </View>
           </View>
        </View>
      </View>

      <AlertModal 
        visible={modalVisible}
        incident={selectedIncident}
        onAccept = {async () => {
          //console.log("selectedIncident at time of accept:", selectedIncident);
          try {
            //Points to that specific incident in the db
            const incidentRef = doc(db, "incidents", selectedIncidentRef.current.id);

            //Updates the status and also attach responder's ID
            await updateDoc(incidentRef, {
              status: "ACCEPTED",
              responderId: auth.currentUser.uid
            });

            //Closing thee alert modal and display successful
            setAcceptedDestination(selectedIncidentRef.current.location);
            console.log("Destination set to:", selectedIncidentRef.current.location);
            setModalVisible(false);
            Alert.alert("LET'S START", "Routimg to victim...");
          } catch (error) {
            Alert.alert("Error", error.message);
          }
        }}
        onReject={() => setModalVisible(false)}
      />

      {verificationStatus === 'PENDING' && (
        <View style = {styles.pendingOverlay}>
          <MaterialIcons name="lock" size={48} color="#f59e0b" />
          <Text style={styles.pendingTitle}>Account Pending Verification</Text>
          <Text style={styles.pendingText}>
            Your credentials are under review by an admin, please wait to be approved.
          </Text>
        </View>
      )}

    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5EDE4',
    paddingTop: Platform.OS === 'android' ? 40 : 0,
  },
  headerCard: {
    backgroundColor: '#F5EDE4',
    padding: 20,
    zIndex: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E0CFBE',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#000000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#E0CFBE',
    margin: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0CFBE',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  loadingMap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  responderMarker: {
    backgroundColor: '#3b82f6',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  incidentMarker: {
    backgroundColor: '#ef4444',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'white',
  },
  bottomCard: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  statusContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    color: '#5C4A3A',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 2,
  },
  statusValue: {
    color: '#000000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  radarIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F5EDE4',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(24, 24, 27, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 16,
  },
  pendingTitle: {
    color: '#f59e0b',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  pendingText: {
    color: '#5C4A3A',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
  }
});
