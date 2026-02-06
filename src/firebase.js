import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

const firebaseConfig = {
    apiKey: "AIzaSyA4ExNQiUpOa5tOfmciBH5iNVPT8GjiIRc",
    authDomain: "vtm-converter.firebaseapp.com",
    projectId: "vtm-converter",
    storageBucket: "vtm-converter.firebasestorage.app",
    messagingSenderId: "79847677230",
    appId: "1:79847677230:web:cd87d7f9e3da2b2559aebf"
};

const app = initializeApp(firebaseConfig);
export const functions = getFunctions(app);

if (typeof window !== 'undefined' && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")) {
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
}