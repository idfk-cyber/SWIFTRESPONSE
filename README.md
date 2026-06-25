# SwiftResponse
### An Emergency Response Mobile Application
> Final Year Project — Catholic University of Eastern Africa  
> Mark Mwangi Ndirangu | BSc. Computer Science | 2026

SwiftResponse is a React Native mobile application that connects civilians in distress with verified community responders nearby, reducing the critical gap in emergency response during the "golden hour."

---

## How It Works

- A civilian presses the SOS button, which captures their GPS location and logs the incident to Firebase Firestore.
- Nearby verified responders receive an alert with the incident location and victim details.
- The civilian immediately receives offline first-aid instructions while they wait.
- The responder navigates to the scene using Google Maps.

---

## Project Structure

```
swiftresponse/
├── app/
│   └── index.js                  # Root routing logic (auth state)
├── src/
│   ├── screens/
│   │   ├── LoginScreen.js         # Registration and login
│   │   ├── CivilianHomeScreen.js  # SOS button and first-aid modal
│   │   └── ResponderDashboardScreen.js  # Live map and incident alerts
│   └── components/
│       └── AlertModal.js          # Swipe-to-accept incident modal
├── firebaseConfig.example.js      # Template — rename and fill in your credentials
├── app.json                       # Expo configuration
├── package.json
├── setup.bat                      # Windows quick-setup script
└── .gitignore
```

---

## Prerequisites

Before setting up, make sure you have the following installed on your machine.

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [Expo Go](https://expo.dev/client) installed on your physical Android or iOS device
- A Google account to create a Firebase project
- A Google Maps API key with the Maps SDK for Android and Directions API enabled

---

## Setup Instructions

### 1. Clone or Download the Repository

Download the project as a ZIP from GitHub and extract it, or clone it if you have Git installed.

```bash
git clone https://github.com/YOUR_USERNAME/swiftresponse.git
cd swiftresponse
```

### 2. Set Up Firebase

You need your own Firebase project for the backend to work.

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
2. Inside the project, go to **Project Settings → Your Apps → Add App → Web**.
3. Copy the config object that Firebase gives you.
4. In the project folder, find `firebaseConfig.example.js`.
5. Make a copy of it and rename the copy to `firebaseConfig.js`.
6. Paste your credentials into the file replacing the placeholder values.

```js
const firebaseConfig = {
  apiKey: "API_KEY",
  authDomain: "AUTH_DOMAIN",
  projectId: "PROJECT_ID",
  storageBucket: "STORAGE_BUCKET",
  messagingSenderId: "MESSAGING_SENDER_ID",
  appId: "APP_ID"
};
```

7. In the Firebase Console, enable **Authentication → Email/Password**.
8. In the Firebase Console, enable **Firestore Database** and start it in test mode.

### 3. Set Up Google Maps

1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Enable the **Maps SDK for Android** and the **Directions API**.
3. Create an API key and copy it.
4. Open `app.json` and find the `googleMaps` config block, then paste your key there.

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_GOOGLE_MAPS_API_KEY"
    }
  }
}
```

### 4. Install Dependencies

#### Option A — Windows Quick Setup (Recommended)

Double-click `setup.bat` in the project folder. It will check for Node.js, install Expo CLI, and run `npm install` automatically.

#### Option B — Manual

Open a terminal in the project folder and run:

```bash
npm install
```

### 5. Run the App

```bash
npx expo start
```

Then scan the QR code with the **Expo Go** app on your phone. Make sure your phone and computer are connected to the same WiFi network.

If you have network issues, run this instead:

```bash
npx expo start --tunnel
```

---

## Firestore Database Structure

The app uses two main collections in Firestore.

**users** — stores civilian and responder profiles  
**incidents** — stores emergency events created when the SOS button is pressed

For the app to route correctly, each user document must have a `role` field set to either `civilian` or `responder`, and responder documents must have a `verificationStatus` field set to `VERIFIED` to access the dashboard.

---

## Known Limitations

- Push notifications are not yet implemented. Responders are alerted via a real-time Firestore listener while the app is open.
- The responder verification is manual. An admin must update the `verificationStatus` field directly in the Firebase Console.
- GPS-based routing was tested on a physical device. Same-device emulator testing will show zero distance and duration, which is expected behaviour.

---

## Built With

- [React Native](https://reactnative.dev/) via [Expo](https://expo.dev/)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Google Maps SDK for Android](https://developers.google.com/maps/documentation/android-sdk)
- [react-native-maps](https://github.com/react-native-maps/react-native-maps)

---

## Author

Mark Mwangi Ndirangu  
The Catholic University of Eastern Africa  
Faculty of Science, 
Department of Computer and Information Science  
2026
