import React, { useState, useEffect } from "react";
import { Timestamp, FirestoreError, getDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { signOut, sendEmailVerification, sendPasswordResetEmail } from "firebase/auth";
import { firestore, auth } from "../../databases/firebase";
import { Modal, Toast, Form, Button, Placeholder, Alert } from "react-bootstrap";
import { format } from "date-fns";


const Profile: React.FC<{ email: string, isVerified: boolean }> = ({ email, isVerified }) => {
  interface User {
    address: string,
    birthdate: Timestamp,
    updatedAt: Timestamp,
    createdAt: Timestamp,
    firstname: string,
    lastname: string,
    email: string
  }

  const [editModal, setEditModal] = useState(false);
  const [validated, setValidated] = useState(false);
  const [verified, setVerified] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    show: false
  });
  const [information, setInformation] = useState({
    address: "",
    birthdate: "",
    updatedAt: "",
    createdAt: "",
    firstname: "",
    lastname: "",
    email: "",
    age: ""
  });

  const [editProfileInfo, setEditProfileInfo] = useState({
    address: "",
    birthdate: "",
    updatedAt: "",
    createdAt: "",
    firstname: "",
    lastname: "",
    email: "",
  });

  useEffect(() => {
    if (email === "") {
      return;
    }
    if (isVerified) {
      setVerified(true);
    } else {
      setVerified(false);
    }

    const fetchData = async () => {
      try {
        const docRef = doc(firestore, "users", email);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data() as User;
          setEditProfileInfo({
            address: data.address,
            birthdate: format(data.birthdate.toDate(), "yyyy-MM-dd") as string,
            updatedAt: format(data.updatedAt.toDate(), "MMMM do, yyyy hh:mm a") as string,
            createdAt: format(data.createdAt.toDate(), "MMMM do, yyyy hh:mm a") as string,
            firstname: data.firstname,
            lastname: data.lastname,
            email: email,
          });
        } else {
          setEditProfileInfo({
            address: "",
            birthdate: "",
            updatedAt: "",
            createdAt: "",
            firstname: "",
            lastname: "",
            email: "",
          });
        }
      } catch (error) {
        const message = (error as FirestoreError).message;
        return console.error(message);
      }
    }

    fetchData();

    const docRef = doc(firestore, "users", email);
    const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const user = docSnapshot.data();

        setInformation({
          address: user.address,
          birthdate: format(user.birthdate.toDate(), "yyyy-MM-dd") as string,
          updatedAt: format(user.updatedAt.toDate(), "MMMM do, yyyy hh:mm a") as string,
          createdAt: format(user.createdAt.toDate(), "MMMM do, yyyy hh:mm a") as string,
          firstname: user.firstname,
          lastname: user.lastname,
          email: email,
          age: (Timestamp.now().toDate().getFullYear() - ((user.birthdate as Timestamp).toDate().getFullYear())).toString()
        });
      }
    });

    return () => {
      unsubscribe();
      setInformation({
        address: "",
        birthdate: "",
        updatedAt: "",
        createdAt: "",
        firstname: "",
        lastname: "",
        email: "",
        age: ""
      });
    }
  }, [email, isVerified]);

  const logout = () => {
    signOut(auth);
  }

  const editProfile = () => {
    setEditModal(true);
  }

  const handleclose = () => {
    setEditModal(false);
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    const fetchData = async () => {
      try {
        const docRef = doc(firestore, "users", email);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data() as User;
          setEditProfileInfo({
            address: data.address,
            birthdate: format(data.birthdate.toDate(), "yyyy-MM-dd") as string,
            updatedAt: format(data.updatedAt.toDate(), "MMMM do, yyyy hh:mm a") as string,
            createdAt: format(data.createdAt.toDate(), "MMMM do, yyyy hh:mm a") as string,
            firstname: data.firstname,
            lastname: data.lastname,
            email: email,
          });
        } else {
          setEditProfileInfo({
            address: "",
            birthdate: "",
            updatedAt: "",
            createdAt: "",
            firstname: "",
            lastname: "",
            email: "",
          });
        }
      } catch (error) {
        const message = (error as FirestoreError).message;
        return console.error(message);
      }
    }

    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;

    if (form.checkValidity() === false) {
      return setValidated(true);
    }

    const email = form.email.value as string;
    const firstname = form.firstname.value as string;
    const lastname = form.lastname.value as string;
    const birthdate = form.birthdate.value as string;
    const address = form.address.value as string;
    const saveChangesButton = form.saveChangesButton as HTMLButtonElement;

    saveChangesButton.innerHTML = "Saving...";
    saveChangesButton.disabled = true;

    try {
      const docRef = doc(firestore, "users", email);
      await updateDoc(docRef, {
        firstname: firstname,
        lastname: lastname,
        birthdate: new Date(birthdate),
        address: address,
        updatedAt: new Date()
      });
      fetchData();
      setToast({
        message: "Your profile has been updated!",
        show: true
      });
      setEditModal(false);
      saveChangesButton.innerHTML = "Save Changes";
      saveChangesButton.disabled = false;
    } catch (error) {
      setToast({
        message: "Something went wrong while updating your profile, please try again.",
        show: true
      });
      const message = (error as FirestoreError).message;
      console.error(message);
      saveChangesButton.innerHTML = "Save Changes";
      saveChangesButton.disabled = false;
    }
  }

  const closeToast = () => {
    setToast({
      message: toast.message,
      show: false
    });
  }

  const verifyEmail = () => {
    if (auth.currentUser) {
      sendEmailVerification(auth.currentUser);
      setToast({
        message: "A verification link has been sent to your email.",
        show: true
      });
    }
  }

  const changePasswordClick = () => {
    if (auth.currentUser) {
      sendPasswordResetEmail(auth, email);
      setEditModal(false);
      setToast({
        message: `Your password reset link has been sent to ${email}`,
        show: true
      });
    }
  }

  return (
    <section className="profile-section mb-4">
      <Toast show={toast.show} className="position-fixed end-0 bottom-0 m-3" onClose={closeToast} animation={true} delay={5000} autohide>
        <Toast.Header>
          <strong className="me-auto">Notification</strong>
        </Toast.Header>
        <Toast.Body>
          {toast.message}
        </Toast.Body>
      </Toast>

      <h1 className="display-5 mb-3">{information.firstname !== "" ?
        `Welcome ${information.firstname.split(" ")[0]}!` :
        <Placeholder animation="glow">
          <Placeholder xs={6} />
        </Placeholder>}</h1>

      <h3 className="mb-3">Profile</h3>
      <div className="container bg-body-secondary p-3 rounded">

        {
          verified !== true ?
          <Alert variant="danger" key="danger">Please verify your email to access additional features.</Alert> :
          null
        }

        <div className="mb-1">{information.firstname !== "" && information.lastname !== "" ?
          `${information.firstname} ${information.lastname}` :
          <Placeholder animation="glow">
            <Placeholder xs={5} />
          </Placeholder>}</div>

        <div className="mb-1">{information.email !== "" ?
          information.email :
          <Placeholder animation="glow">
            <Placeholder xs={4} />
          </Placeholder>}</div>

        <div className="mb-1">{information.birthdate !== "" && information.age !== "" ?
          <div>
            {format(information.birthdate, "MMMM do, yyyy") as string}
            <small className="opacity-75"> - {information.age} Years old</small>
          </div> :
          <Placeholder animation="glow">
            <Placeholder xs={3} />
          </Placeholder>}</div>

        <div className="mb-1">{information.address !== "" ?
          `Lives in ${information.address}` :
          <Placeholder animation="glow">
            <Placeholder xs={2} />
          </Placeholder>}</div>

        <div className="mt-2 d-flex flex-row gap-2">
          {
            verified === true ? 
            <Button variant="outline-primary" onClick={editProfile}>Edit Profile</Button> :
            <Button variant="outline-primary" onClick={verifyEmail}>Verify Email</Button>
          }

          <Modal show={editModal} onHide={handleclose} animation={true} backdrop="static">
            <Modal.Header closeButton>
              <Modal.Title>Edit Profile</Modal.Title>
            </Modal.Header>
            <Modal.Body>

              <div className="mb-1 opacity-75"><small>Created at {editProfileInfo.createdAt}</small></div>
              <div className="opacity-75"><small>Last updated: {editProfileInfo.updatedAt}</small></div>

              <hr />

              <Form noValidate validated={validated} onSubmit={handleSubmit}>

                <Form.Group className="mb-3">
                  <Form.Label>Email <span className="text-danger">*</span> <small className="opacity-75">Readonly</small></Form.Label>
                  <Form.Control type="email" name="email" defaultValue={editProfileInfo.email} required readOnly />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>First name <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="firstname" pattern="[A-Za-z ]+" defaultValue={editProfileInfo.firstname} required />
                  <Form.Control.Feedback type="invalid">Only letters and spaces are allowed</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Last name <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="lastname" pattern="[A-Za-z ]+" defaultValue={editProfileInfo.lastname} required />
                  <Form.Control.Feedback type="invalid">Only letters and spaces are allowed</Form.Control.Feedback>
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Birthdate <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="date" name="birthdate" defaultValue={editProfileInfo.birthdate} required />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Address <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="address" defaultValue={editProfileInfo.address} required />
                </Form.Group>
                <div>
                  <Button type="submit" variant="primary" name="saveChangesButton">Save Changes</Button>
                </div>

              </Form>

              <hr />

              <h3 className="mb-3">Security</h3>
              <Button type="button" variant="primary" onClick={changePasswordClick}>Change Password</Button>

            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="secondary" onClick={() => setEditModal(!editModal)}>Close</Button>
            </Modal.Footer>
          </Modal>


          <Button variant="outline-danger" onClick={logout}>Sign Out</Button>
        </div>
      </div>

    </section>
  )
}

export default Profile;