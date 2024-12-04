import "./assets/css/App.css";
import { useEffect, useState } from "react";
import { auth, firestore } from "./databases/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Login from "./components/App/Login";
import Profile from "./components/App/Profile";
import MyLetters from "./components/App/MyLetters";
import MyGallery from "./components/App/MyGallery";
import NavBar from "./components/NavBar";
import Heart from "./components/Heart";


function App() {
  const [isSignedIn, setIsSignedIn] = useState(true);
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    document.title = "Home";

    onAuthStateChanged(auth, async (User) => {
      if (!User) {
        console.log(`You have been signed out`);
        setEmail("");
        document.title = "Login | Register";
        return setIsSignedIn(false);
      }

      try {
        const docRef = doc(firestore, "users", email);
        const snapshot = await getDoc(docRef);
        const userData = snapshot.data();
        const firstname = userData?.firstname.split(" ")[0];
        document.title = `${firstname} - Home`;
      } catch (error) {
        console.error(error);
      }

      setIsVerified(User.emailVerified);

      console.log(`Logged in as ${User.email}`);
      setIsSignedIn(true);
      setEmail(User.email as string);
    });
  }, [email]);

  return (
    <>
      <NavBar/>
      {<Login isSignedIn={isSignedIn} />}
      <main className="container py-3">
        <Heart />
        <Profile email={email} isVerified={isVerified} />
        <MyLetters email={email} isVerified={isVerified} />
        <MyGallery email={email} isVerified={isVerified} />
      </main>

      <script src="https://cdn.jsdelivr.net/npm/react/umd/react.production.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/react-dom/umd/react-dom.production.min.js"></script>
      <script src="https://cdn.jsdelivr.net/npm/react-bootstrap@next/dist/react-bootstrap.min.js"></script>
    </>
  );
}

export default App;
