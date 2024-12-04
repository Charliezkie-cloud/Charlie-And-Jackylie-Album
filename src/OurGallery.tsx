import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./databases/firebase";

import NavBar from "./components/NavBar";
import Gallery from "./components/OurGallery/Gallery";
import Login from "./components/App/Login";

const OurGallery: React.FC = () => {
  const [isSignedIn, setIsSignedIn] = useState(true);
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);
  useEffect(() => {
    document.title = `Our Gallery`;

    onAuthStateChanged(auth, async (User) => {
      if (!User) {
        console.log(`You have been signed out`);
        setEmail("");
        return setIsSignedIn(false);
      }

      setIsVerified(User.emailVerified);

      console.log(`Logged in as ${User.email}`);
      setIsSignedIn(true);
      setEmail(User.email as string);
    });
  }, []);

  return (
    <>
      <NavBar/>
      <Login isSignedIn={isSignedIn} />
      <main className="py-3">
        <Gallery email={email} isVerified={isVerified}/>
      </main>
    </>
  )
}

export default OurGallery;
