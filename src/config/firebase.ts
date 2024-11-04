import { initializeApp } from "firebase/app";
import {getAuth, GoogleAuthProvider} from "firebase/auth"


const firebaseConfig = {
  apiKey: "AIzaSyD4kKb0oGdNtkpMyQCKq0MGPZxZMuEyEJw",
  authDomain: "ameer-s-ai.firebaseapp.com",
  projectId: "ameer-s-ai",
  storageBucket: "ameer-s-ai.firebasestorage.app",
  messagingSenderId: "95382970394",
  appId: "1:95382970394:web:c53cf8a5ee6c5183a931a3",
  measurementId: "G-WBP2088NV7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// email and password aunthentication
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider();
