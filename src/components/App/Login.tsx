import React, { useState, useEffect } from "react";
import { signInWithEmailAndPassword, AuthError, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, firestore } from "../../databases/firebase";
import { Modal, Toast, Form, InputGroup, Button, Collapse } from "react-bootstrap";
import { doc, setDoc, Timestamp } from "firebase/firestore";

const Login: React.FC<{ isSignedIn: boolean }> = ({ isSignedIn }) => {
  const [type, setType] = useState("password");
  const [validated, setValidated] = useState(false);
  const [show, setShow] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    show: false
  });
  const [signUpCollapse, setSignUpCollapse] = useState(false);
  const [signUpValidated, setSignUpValidated] = useState(false);
  const [signUpPasswordType, setSignUpPasswordType] = useState("password");
  const [confirmPasswordType, setConfirmPasswordType] = useState("password");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const form = e.currentTarget;

      if (form.checkValidity() === false) {
        return setValidated(true);
      }

      const email = form.email.value as string;
      const password = form.password.value as string;

      await signInWithEmailAndPassword(auth, email, password);
      setToast({
        message: toast.message,
        show: false
      });
    } catch (error) {
      const message = (error as AuthError).message;
      console.error(message);
      setToast({
        message: "Invalid email or password, please try again.",
        show: true
      });
      setValidated(true);
    }
  }

  const viewPassword = () => {
    if (type === "password") {
      setType("text");
    } else {
      setType("password");
    }
  }

  const closeToast = () => {
    setToast({
      message: toast.message,
      show: false
    });
  }

  useEffect(() => {
    if (isSignedIn) {
      setShow(false);
    } else {
      setShow(true);
    }
  }, [isSignedIn]);

  const signUpFormOnSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    if (!form.checkValidity()) {
      return setSignUpValidated(true);
    }

    const email = form.email.value;
    const password = form.password.value as string;
    const passwordConfirmation = form.passwordConfirmation.value;
    const firstname = form.firstname.value;
    const lastname = form.lastname.value;
    const birthdate = form.birthdate.value;
    const address = form.address.value;
    const createAccountButton = form.createAccountButton as HTMLButtonElement;

    createAccountButton.innerHTML = "Creating...";
    createAccountButton.disabled = true;

    if (password !== passwordConfirmation) {
      (form.password as HTMLInputElement).scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      setSignUpValidated(false);
      return setToast({
        message: "Passwords must be identical.",
        show: true
      });
    }

    if (password.length < 6) {
      (form.password as HTMLInputElement).scrollIntoView({
        behavior: "smooth",
        block: "center"
      });
      setSignUpValidated(false);
      return setToast({
        message: "Password must be at least 6 characters",
        show: true
      });
    }

    try {
      const docRef = doc(firestore, "users", email);

      const status = await Promise.all([
        await createUserWithEmailAndPassword(auth, email, password),
        await setDoc(docRef, {
          address: address,
          firstname: firstname,
          lastname: lastname,
          birthdate: Timestamp.fromDate(new Date(birthdate)),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        })
      ]);

      if (!status) {
        (form.password as HTMLInputElement).scrollIntoView({
          behavior: "smooth",
          block: "center"
        });
        setSignUpValidated(false);
        return setToast({
          message: "Something went wrong while creating your account, please try again.",
          show: true
        });
      }

      await signOut(auth);

      setToast({
        message: "Your account has been successfully created!",
        show: true
      });
      setSignUpCollapse(false);
      createAccountButton.innerHTML = "Creating...";
      createAccountButton.disabled = true;
    } catch (error) {
      console.error(error);
      setToast({
        message: "Something went wrong while creating your account, please try again.",
        show: true
      });
      setSignUpCollapse(false);
      createAccountButton.innerHTML = "Creating...";
      createAccountButton.disabled = true;
    }
  }

  const signUpViewPasswordOnClick = () => {
    if (signUpPasswordType === "password") {
      setSignUpPasswordType("text");
    } else {
      setSignUpPasswordType("password");
    }
  }

  const confirmPasswordOnClick = () => {
    if (confirmPasswordType === "password") {
      setConfirmPasswordType("text");
    } else {
      setConfirmPasswordType("password");
    }
  }

  return (
    <>
      <Modal show={show} variant="primary" backdrop={true}>
        <Modal.Header>
          <Modal.Title>Sign in</Modal.Title>
        </Modal.Header>
        <Modal.Body>

          <Toast show={toast.show} className="position-fixed end-0 bottom-0 m-3" onClose={closeToast} animation={true} delay={5000} autohide>
            <Toast.Header>
              <strong className="me-auto">Notification</strong>
            </Toast.Header>
            <Toast.Body>
              {toast.message}
            </Toast.Body>
          </Toast>

          <Form noValidate onSubmit={handleSubmit} validated={validated}>

            <Form.Group className="mb-3">
              <Form.Label>Email <span className="text-danger">*</span></Form.Label>
              <Form.Control type="email" placeholder="name@example.com" name="email" required></Form.Control>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Password <span className="text-danger">*</span></Form.Label>
              <InputGroup>
                <Form.Control type={type} name="password" required></Form.Control>
                <Button variant="primary" onClick={viewPassword}>
                  {type === "password" ? <i className="bi bi-eye-fill"></i> : <i className="bi bi-eye-slash-fill"></i>}
                </Button>
              </InputGroup>
            </Form.Group>

            <div className="d-flex justify-content-end align-items-center gap-1">
              <Button variant="primary" type="submit">Sign in</Button>
              <Button variant="outline-primary" type="button" onClick={() => setSignUpCollapse(!signUpCollapse)}>Sign up</Button>
            </div>

          </Form>

          <Collapse in={signUpCollapse}>
            <div>
              <hr/>
              <h3 className="mb-3">Sign up</h3>

              <Form noValidate onSubmit={signUpFormOnSubmit} validated={signUpValidated}>
                <Form.Group className="mb-3">
                  <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="email" name="email" placeholder="name@example.com" required />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                  <InputGroup>
                    <Form.Control type={signUpPasswordType} name="password" required></Form.Control>
                    <Button variant="primary" onClick={signUpViewPasswordOnClick}>
                      {signUpPasswordType === "password" ? <i className="bi bi-eye-fill"></i> : <i className="bi bi-eye-slash-fill"></i>}
                    </Button>
                  </InputGroup>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Confirm Password <span className="text-danger">*</span></Form.Label>
                  <InputGroup>
                    <Form.Control type={confirmPasswordType} name="passwordConfirmation" required></Form.Control>
                    <Button variant="primary" onClick={confirmPasswordOnClick}>
                      {confirmPasswordType === "password" ? <i className="bi bi-eye-fill"></i> : <i className="bi bi-eye-slash-fill"></i>}
                    </Button>
                  </InputGroup>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>First Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" pattern="[A-Za-z ]+" name="firstname" required />
                  <Form.Control.Feedback type="invalid">Only letters and spaces are allowed</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Last Name <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" pattern="[A-Za-z ]+" name="lastname" required />
                  <Form.Control.Feedback type="invalid">Only letters and spaces are allowed</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Birthdate <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="date" name="birthdate" required />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Address <span className="text-danger">*</span></Form.Label>
                  <Form.Control type="text" name="address" required />
                </Form.Group>

                <div>
                  <Button type="submit" name="createAccountButton">Create Account</Button>
                </div>

              </Form>
            </div>
          </Collapse>

        </Modal.Body>
      </Modal>
    </>
  )
}

export default Login;