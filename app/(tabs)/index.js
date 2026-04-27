import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { auth, db } from '../../firebaseConfig';

// The three main screens
import AdminScreen from '../../src/screens/AdminScreen';
import CivilianHomeScreen from '../../src/screens/CivilianHomeScreen';
import LoginScreen from '../../src/screens/LoginScreen';
import ResponderDashboardScreen from '../../src/screens/ResponderDashboardScreen';

export default function Index() {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Listen for authentication state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          // 2. If logged in, fetch the user's role from the database
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setRole(userData.role);
            console.log("Role fetched from Firestore:", userData.role);
          } else {
            // Fallback if profile doesn't exist
            setRole('civilian');
          }
          setUser(currentUser);
        } catch (error) {
          console.error("Error fetching user role:", error);
        }
      } else {
        // User is logged out
        setUser(null);
        setRole(null);
      }
      
      // 3. Stop the kaloading thing
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  //loadig state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={styles.loadingText}>Connecting to Network...</Text>
      </View>
    );
  }

  // routing logic
  
  // f not logged in then it will show Login
  if (!user) {
    return <LoginScreen />;
  }

  if (role === 'admin'){
    return <AdminScreen />;
  }

  if (role === 'responder') {
    return <ResponderDashboardScreen />;
  }

  return <CivilianHomeScreen />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#18181b',
  },
  loadingText: {
    color: '#71717a',
    marginTop: 12,
    fontSize: 14,
  }
});