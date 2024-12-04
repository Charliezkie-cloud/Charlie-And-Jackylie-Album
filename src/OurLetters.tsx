import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./databases/firebase";

import NavBar from "./components/NavBar";
import Letters from "./components/OurLetters/Letters";
import Login from "./components/App/Login";

const OurLetters: React.FC = () => {
  const [isSignedIn, setIsSignedIn] = useState(true);
  const [email, setEmail] = useState("");
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    document.title = `Our Letters`;

    onAuthStateChanged(auth, (User) => {
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
      <NavBar />
      <Login isSignedIn={isSignedIn} />
      <main className="py-3">
        <Letters email={email} isVerified={isVerified}/>
      </main>
    </>
  )
}

export default OurLetters;
