import { Feather, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { signOut } from 'firebase/auth';
import { addDoc, collection, doc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Platform, SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

// Offline Knowledge Base
const FIRST_AID_DATA = {
  "General": [
    "Stay calm and ensure your own safety first.",
    "Do not move the patient unless they are in danger.",
    "Keep the patient warm and reassure them.",
    "Wait for the responder to arrive."
  ],
  "Cardiac Arrest": [
    "Check for breathing and pulse.",
    "If no pulse, begin CPR immediately.",
    "Push hard and fast in the center of the chest.",
    "Continue compressions until help arrives."
  ],
  "Severe Bleeding": [
    "Apply direct pressure to the wound with a clean cloth.",
    "Elevate the injured limb above the heart if possible.",
    "Do not remove the cloth if it soaks through; add more layers.",
    "Keep the patient lying down."
  ],
  "Burns / Fire": [
    "Cool the burn with cool (not cold) running water for 20 mins.",
    "Remove tight items (rings, watches) from the area immediately.",
    "Cover with a sterile, non-fluffy dressing or cling film.",
    "Do not break any blisters."
  ]
};

export default function CivilianHomeScreen() {
  const [location, setLocation] = useState(null);
  const [sending, setSending] = useState(false);
  const [emergencyType, setEmergencyType] = useState("General");
  const [showInstructions, setShowInstructions] = useState(false); // Controls the pop-up
  const [incidentStatus, setIncidentStatus] = useState("PENDING");
  const [activeIncidentId, setActiveIncidentId] = useState(null);

  // Pulse Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulse Animation Loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();

    // GPS logic is majorly derived from the official Expo Location documentation
    // Get GPS Location
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc);
    })();
  }, []);

  //only runs when activeIncidentId changes
  useEffect(() => {
    //won't run if there's no active incident
    if (!activeIncidentId) return;

    //make it listen to this specific incident document
    const incidentRef = doc(db, "incidents", activeIncidentId);
    const unsubscribe = onSnapshot(incidentRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setIncidentStatus(data.status);
      }
    });

    //will clean up the listener when inncident changes or component unmounts
    return () => unsubscribe();
  }, [activeIncidentId]);

  const handlePanic = async () => {
    if (!location) {
      Alert.alert("Locating...", "Please wait for GPS lock.");
      return;
    }

    setSending(true);

    try {
      // DB insert logic adapted from Firebase Firestore documentation
      // 1. Send Alert to DB with the specific type
      const incidentRef = await addDoc(collection(db, "incidents"), {
        requesterId: auth.currentUser ? auth.currentUser.uid : "ANON",
        location: {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        },
        type: emergencyType, // Save the type to help the responder prepare
        status: "PENDING",
        timestamp: serverTimestamp(),
      });

      setActiveIncidentId(incidentRef.id);
      setIncidentStatus("PENDING");

      // 2. Open the Instructions immediately (Internal Logic)
      setSending(false);
      setShowInstructions(true);
      
    } catch (error) {
      setSending(false);
      Alert.alert("Error", error.message);
    }
  };

  const handleLogout = async () => {
    try { await signOut(auth); } catch (error) { console.error(error); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        
        {/* TOP BAR */}
        <View style={styles.topBar}>
          <View style={styles.gpsBadge}>
            <Feather name="map-pin" size={16} color="#22c55e" />
            <Text style={styles.gpsText}>GPS Accuracy: {location ? "High" : "Locating..."}</Text>
          </View>
          <View style={{flexDirection: 'row', gap: 10}}>
            <TouchableOpacity style={styles.menuBtn} onPress={handleLogout}>
               <Feather name="log-out" size={24} color="#ef4444" />
            </TouchableOpacity>
          </View>
        </View>

        {/* EMERGENCY SELECTOR */}
        <View style={styles.selectorContainer}>
           <Text style={styles.selectorLabel}>What is the emergency?</Text>
           <View style={styles.pickerWrapper}>
             <Picker
                selectedValue={emergencyType}
                onValueChange={(itemValue) => setEmergencyType(itemValue)}
                style={{color: 'white', backgroundColor: '#27272a'}}
                dropdownIconColor="white"
             >
                <Picker.Item label="General / Unsure" value="General" />
                <Picker.Item label="Cardiac Arrest" value="Cardiac Arrest" />
                <Picker.Item label="Severe Bleeding" value="Severe Bleeding" />
                <Picker.Item label="Burns / Fire" value="Burns / Fire" />
             </Picker>
           </View>
        </View>

        {/* SOS BUTTON */}
        <View style={styles.centerSection}>
          <View style={styles.pulseContainer}>
             <Animated.View style={[styles.glowRing, { transform: [{ scale: pulseAnim }] }]} />
             <TouchableOpacity activeOpacity={0.8} onPress={handlePanic} disabled={sending}>
               <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.sosButton}>
                 {sending ? <ActivityIndicator size="large" color="white" /> : (
                    <>
                      <FontAwesome5 name="ambulance" size={48} color="white" style={{marginBottom: 8}} />
                      <Text style={styles.sosText}>SOS</Text>
                    </>
                 )}
               </LinearGradient>
             </TouchableOpacity>
          </View>
          <Text style={styles.helpText}>Press for{'\n'}Immediate Help</Text>
        </View>

        {/* INSTRUCTIONS MODAL (The "Integrated Guidance") */}
        <Modal visible={showInstructions} animationType="slide" transparent={true}>
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <View style={styles.modalHeader}>
                        <MaterialIcons name="medical-services" size={32} color="#ef4444" />
                        <Text style={styles.modalTitle}>{emergencyType} Protocol</Text>
                    </View>
                    
                    {incidentStatus === "PENDING" ? (
                      <View style={styles.statusBannerPending}>
                        <ActivityIndicator size="small" color="#f59e0b" />
                        <Text style={styles.statusBannerTextPending}>Searching for a responder nearby...</Text>
                      </View>
                    ) : (
                      <View style={styles.statusBannerAccepted}>
                        <MaterialIcons name="check-circle" size={18} color="#22c55e" />
                        <Text style={styles.statusBannerTextAccepted}>Responder accepted, help is on the way.</Text>
                      </View>
                    )}
                    
                    <ScrollView style={styles.stepsContainer}>
                        {FIRST_AID_DATA[emergencyType].map((step, index) => (
                            <View key={index} style={styles.stepRow}>
                                <Text style={styles.stepNumber}>{index + 1}</Text>
                                <Text style={styles.stepText}>{step}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    <TouchableOpacity 
                        style={styles.closeBtn} 
                        onPress={() => setShowInstructions(false)}
                    >
                        <Text style={styles.closeBtnText}>I Understand</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

        {/* BOTTOM NAV */}
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navItem}><Feather name="home" size={28} color="#ef4444" /></TouchableOpacity>
          <TouchableOpacity style={styles.navItem}><Feather name="book-open" size={28} color="#71717a" /></TouchableOpacity>
          <TouchableOpacity style={styles.navItem}><Feather name="user" size={28} color="#71717a" /></TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#18181b', paddingTop: Platform.OS === "android" ? 40 : 0 },
  contentContainer: { flex: 1, flexDirection: 'col', justifyContent: 'space-between' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20 },
  gpsBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  gpsText: { color: '#22c55e', fontWeight: '600', fontSize: 14 },
  menuBtn: { padding: 8, backgroundColor: '#27272a', borderRadius: 8 },
  
  selectorContainer: { marginHorizontal: 24, marginTop: 20 },
  selectorLabel: { color: '#a1a1aa', marginBottom: 8, fontSize: 14, fontWeight: 'bold' },
  pickerWrapper: { backgroundColor: '#27272a', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#3f3f46' },

  centerSection: { alignItems: 'center', justifyContent: 'center', marginBottom: 40 },
  pulseContainer: { alignItems: 'center', justifyContent: 'center', width: 300, height: 300 },
  glowRing: { position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(239, 68, 68, 0.2)' },
  sosButton: { width: 200, height: 200, borderRadius: 100, alignItems: 'center', justifyContent: 'center', elevation: 15, borderWidth: 4, borderColor: '#fca5a5' },
  sosText: { color: 'white', fontSize: 48, fontWeight: 'bold', letterSpacing: 2 },
  helpText: { color: '#a1a1aa', textAlign: 'center', fontSize: 16, marginTop: 32 },
  
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, borderTopWidth: 1, borderTopColor: '#27272a', backgroundColor: '#18181b' },
  navItem: { padding: 12 },

  // MODAL STYLES
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#27272a', borderRadius: 24, padding: 24, maxHeight: '70%', borderWidth: 1, borderColor: '#3f3f46' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: 'white' },
  subTitle: { color: '#a1a1aa', marginBottom: 20, fontSize: 14 },
  stepsContainer: { marginBottom: 20 },
  stepRow: { flexDirection: 'row', marginBottom: 16, paddingRight: 10 },
  stepNumber: { color: '#ef4444', fontWeight: 'bold', fontSize: 18, marginRight: 12, width: 24 },
  stepText: { color: 'white', fontSize: 16, lineHeight: 24, flex: 1 },
  closeBtn: { backgroundColor: '#ef4444', padding: 16, borderRadius: 12, alignItems: 'center' },
  closeBtnText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  statusBannerPending: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(245, 158, 11, 0.1)', borderWidth: 1, borderColor: '#f59e0b', borderRadius: 8, padding: 10, marginBottom: 16 },
  statusBannerTextPending: { color: '#f59e0b', fontSize: 13, fontWeight: '600', flex: 1 },
  statusBannerAccepted: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(34, 197, 94, 0.1)', borderWidth: 1, borderColor: '#22c55e', borderRadius: 8, padding: 10, marginBottom: 16 },
  statusBannerTextAccepted: { color: '#22c55e', fontSize: 13, fontWeight: '600', flex: 1 }
});