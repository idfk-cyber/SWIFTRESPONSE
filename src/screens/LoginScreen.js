import { FontAwesome5 } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text, TextInput, TouchableOpacity,
    View
} from 'react-native';
import { auth, db } from '../../firebaseConfig';

export default function LoginScreen() {
    //Auth state
    const [isLogin, setIsLogin] = useState(false);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    //Registration state
    const [firstName, setFirstName] = useState('');
    const [surname, setSurname] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [role, setRole] = useState('responder'); //itaenda kwa responder kwanza

    //Date of bith
    const [dob, setDob] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);

    //Civilian details
    const [ailment, setAilment] = useState('None');
    const [otherAilment, setOtherAilment] = useState('')

    //Responder's specifics
    const [idImage, setIdImage] = useState(null);//in base64 string
    const [certImage, setCertImage] = useState(null);//In base64 string

    //helpers
    const onDateChange = (event, selectedDate) => {
    // Closing the picker immediately, no matter what preventing the kaloop when I type in other fields.
    setShowDatePicker(false);

    // Only update the date if user actually picked something and didn't cancel
    if (selectedDate) {
      setDob(selectedDate);
    }
  };


// Just adjusted a bit from Expo documentation for Base64 image conversion
    const pickImage = async (setImageFunction) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.2, //very compressed to save storage in db
            base64: true,
        });

        if (!result.canceled) {
            const imageUri = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setImageFunction(imageUri);
        }
    };

// This Authentication logic is also adapted from Firebase Web Password Auth guide
    const handleAuthentication = async () => {
        setLoading(true);

        try {
            if (isLogin) {
                //Login logic
                if(!email || !password) throw new Error("Please enter email and password");
                await signInWithEmailAndPassword(auth, email, password);
                Alert.alert("Success", "Welcome back");
                //navigation stuff is in index.js(auth state)
            } else {
                //sign up logic
                if (!email || !password || !firstName || !surname) throw new Error("All fields are required");
                if (password !== confirmPassword) throw new Error("Passwords do not match");

                if (role === 'responder' && (!idImage || !certImage)) {
                    throw new Error("Responders must upload ID and Certificate.");
                }

                //creating a user
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                let profileData = {
                    email: user.email,
                    firstName,
                    surname,
                    dob: dob.toISOString().split('T')[0],
                    role,
                    createdAt: new Date(),
                };

                if(role === 'civilian') {
                    profileData.medicalHistory = ailment === 'Other' ? otherAilment : ailment;
                } else {
                    profileData.verificationStatus = "PENDING";
                    profileData.documents = {
                        idCard: idImage,
                        certificate: certImage
                    };
                }

                //saving the datat to firestore
                await setDoc(doc(db, "users", user.uid), profileData);
                Alert.alert("Success", role === 'responder' ? "Account created. Awaiting verification" : "Account Created");
            }
        } catch (error) {
            Alert.alert("Error", error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style = {styles.container}
        >
            <ScrollView contentContainerStyle = {styles.scrollContent}>

                {/* Header */}
                <View style = {styles.headerContainer}>
                    <Text style = {styles.title}>Swift Response</Text>
                    <Text style = {styles.subtitle}>{isLogin ? 'Welcome back' : 'Join the Network'}</Text>
                </View>

                <View style = {styles.toggleContainer}>
                    <TouchableOpacity
                        style = {[styles.toggleBtn, role === 'civilian' && styles.toggleBtnActive]}
                        onPress = {() => setRole('civilian')}
                    >
                        <Text style = {[styles.toggleText, role === 'civilian' && styles.toggleTextActive]}>Civilian</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style = {[styles.toggleBtn, role === 'responder' && styles.toggleBtnActive]}
                        onPress={() => setRole('responder')}
                    >
                        <Text style = {[styles.toggleText, role === 'responder' && styles.toggleTextActive]}>Responder</Text>
                    </TouchableOpacity>
                </View>

                {/*input fields*/}
                <View style={styles.formContainer}>
                    {!isLogin && (
                        <>
                            {/* Names Row */}
                            <View style={styles.row}>
                                <TextInput 
                                    style={[styles.input, styles.halfInput]} 
                                    placeholder="Jane" 
                                    placeholderTextColor="#71717a"
                                    value={firstName}
                                    onChangeText={setFirstName}
                                />
                                <TextInput 
                                    style={[styles.input, styles.halfInput]} 
                                    placeholder="Doe" 
                                    placeholderTextColor="#71717a"
                                    value={surname}
                                    onChangeText={setSurname}
                                />
                            </View>

                            {/* Date of Birth Trigger */}
                            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
                                <Text style={{color: '#fff'}}>{dob.toISOString().split('T')[0]}</Text>
                            </TouchableOpacity>
                            
                            {showDatePicker && (
                                <DateTimePicker
                                    value={dob}
                                    mode="date"
                                    display="default"
                                    onChange={onDateChange}
                                    maximumDate={new Date()}
                                />
                            )}
                        </>
                    )}

                    <TextInput 
                        style={styles.input} 
                        placeholder="jane@medic.com" 
                        placeholderTextColor="#71717a"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        value={email}
                        onChangeText={setEmail}
                    />
                    <TextInput 
                        style={styles.input} 
                        placeholder="Password" 
                        placeholderTextColor="#71717a"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />
                    
                    {!isLogin && (
                        <TextInput 
                        style={styles.input} 
                        placeholder="Confirm Password" 
                        placeholderTextColor="#71717a"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        />
                    )}

                    {/* VERIFICATION SECTION (Responder Only) */}
                    {!isLogin && role === 'responder' && (
                        <View style={styles.verificationBox}>
                        <Text style={styles.verifLabel}>Verification (Required)</Text>
                        <View style={styles.row}>
                            
                            {/* ID Card Button */}
                            <TouchableOpacity 
                            style={[styles.verifBtn, idImage ? styles.verifBtnSuccess : styles.verifBtnDefault]} 
                            onPress={() => pickImage(setIdImage)}
                            >
                            <FontAwesome5 name="id-card" size={16} color="white" />
                            <Text style={styles.verifBtnText}>{idImage ? " ID Added" : " ID Card"}</Text>
                            </TouchableOpacity>

                            {/* Certificate Button */}
                            <TouchableOpacity 
                            style={[styles.verifBtn, certImage ? styles.verifBtnSuccess : styles.verifBtnSuccess]} 
                            onPress={() => pickImage(setCertImage)}
                            >
                            <FontAwesome5 name="file-medical" size={16} color="white" />
                            <Text style={styles.verifBtnText}>{certImage ? " Cert Added" : " Cert"}</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.verifNote}>*Images saved securely via Base64</Text>
                        </View>
                    )}
          
                    {/* CIVILIAN AILMENTS */}
                    {!isLogin && role === 'civilian' && (
                        <View style={styles.verificationBox}>
                            <Text style={styles.verifLabel}>Medical Conditions</Text>
                            <View style={styles.pickerWrapper}>
                            <Picker
                                selectedValue={ailment}
                                onValueChange={(itemValue) => setAilment(itemValue)}
                                style={{color: 'white'}}
                                dropdownIconColor="white"
                            >
                                <Picker.Item label="None" value="None" />
                                <Picker.Item label="Asthma" value="Asthma" />
                                <Picker.Item label="Diabetes" value="Diabetes" />
                                <Picker.Item label="Other" value="Other" />
                            </Picker>
                            </View>
                            {ailment === 'Other' && (
                                <TextInput 
                                    style={[styles.input, {marginTop: 10}]} 
                                    placeholder="Specify condition..." 
                                    placeholderTextColor="#71717a"
                                    value={otherAilment}
                                    onChangeText={setOtherAilment}
                                />
                            )}
                        </View>
                    )}

                    {/* ACTION BUTTON */}
                    <TouchableOpacity style={styles.actionBtn} onPress={handleAuthentication} disabled={loading}>
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.actionBtnText}>
                                {isLogin ? "Log In" : "Register Account"}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* FOOTER LINK */}
                    <View style={styles.footer}>
                        <Text style={styles.footerText}>
                            {isLogin ? "Don't have an account? " : "Already have an account, "}
                        </Text>
                        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                            <Text style={styles.linkText}>
                                {isLogin ? "Register" : "Log-in"}
                            </Text>
                        </TouchableOpacity>
                    </View>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

//Styles 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
  },
  scrollContent: {
    padding: 24,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ef4444', // text-red-500
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#a1a1aa', // text-zinc-400
  },
  toggleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12, // rounded-xl
    backgroundColor: 'rgba(39, 39, 42, 0.4)', // bg-zinc-800/40
  },
  toggleBtnActive: {
    backgroundColor: '#ef4444', // bg-red-500 for Responder
  },
  toggleText: {
    color: '#71717a', // text-zinc-500
    fontWeight: '600',
  },
  toggleTextActive: {
    color: 'white',
  },
  formContainer: {
    gap: 16,
  },
  input: {
    backgroundColor: '#27272a', // bg-zinc-800
    color: 'white',
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  verificationBox: {
    borderWidth: 2,
    borderColor: '#3f3f46', // border-zinc-700
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  verifLabel: {
    color: '#a1a1aa', // text-zinc-400
    fontSize: 14,
    marginBottom: 12,
  },
  verifBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
  },
  verifBtnDefault: {
    backgroundColor: '#3f3f46', // bg-zinc-700
  },
  verifBtnSuccess: {
    backgroundColor: '#16a34a', // bg-green-600
  },
  verifBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  verifNote: {
    textAlign: 'center',
    color: '#52525b', // text-zinc-600
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 12,
  },
  pickerWrapper: {
    backgroundColor: '#27272a',
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionBtn: {
    backgroundColor: '#ef4444', // bg-red-500
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#ef4444',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  actionBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  footerText: {
    color: '#a1a1aa', // text-zinc-400
  },
  linkText: {
    color: '#ef4444',
    fontWeight: '600',
  }
});