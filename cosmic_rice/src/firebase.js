// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCoxGtyOssbziGqATmJRqQNJq3lS6CUOfk",
  authDomain: "woju-bap.firebaseapp.com",
  projectId: "woju-bap",
  storageBucket: "woju-bap.firebasestorage.app",
  messagingSenderId: "136561090819",
  appId: "1:136561090819:web:7b9d5bd3324c0f463c0936",
  measurementId: "G-0DXD0BJ4KG"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
