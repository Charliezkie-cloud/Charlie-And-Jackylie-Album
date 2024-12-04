import React, { useState, useEffect } from "react";
import { Timestamp, FirestoreError, getDoc, doc, onSnapshot, updateDoc, DocumentReference, collection, deleteDoc, addDoc, where, query, orderBy } from "firebase/firestore";
import { firestore } from "../../databases/firebase";
import { Modal, Toast, Form, Button, Placeholder, Card, CardText, CardBody, CardTitle } from "react-bootstrap";
import { format } from "date-fns";
import CardPlaceholder from "../CardPlaceholder";

const MyLetters: React.FC<{ email: string, isVerified: boolean }> = ({ email, isVerified }) => {
  interface User {
    address: string,
    birthdate: Timestamp,
    updatedAt: Timestamp,
    createdAt: Timestamp,
    firstname: string,
    lastname: string,
    email: string
  }

  interface UserLetter {
    id: string,
    author: DocumentReference,
    createdAt: Timestamp,
    updatedAt: Timestamp,
    title: string,
    message: string,
    user: User | null,
  }

  const [letters, setLetters] = useState<UserLetter[]>([]);
  const [editLetterModal, setEditLetterModal] = useState(false);
  const [editLetterForm, setEditLetterForm] = useState({
    createdAt: "",
    updatedAt: "",
    id: "",
    title: "",
    message: ""
  });
  const [validated, setValidated] = useState(false);
  const [toast, setToast] = useState({
    message: "",
    show: false
  });
  const [continueReadingModal, setContinueReadingModal] = useState(false);
  const [continueReadingContent, setContinueReadingContent] = useState<UserLetter>();
  const [newLetterModal, setNewLetterModal] = useState(false);
  const [newLetterValidate, setNewLetterValidate] = useState(false);
  const [isUpload, setIsUpload] = useState(false);

  useEffect(() => {
    if (!email) {
      return;
    }

    if (!isVerified) {
      setIsUpload(true);
    } else {
      setIsUpload(false); 
    }

    const colRef = collection(firestore, "letters");
    const q = query(colRef,
        where("author", "==", doc(firestore, "users", email)),
        orderBy("updatedAt", "desc")
      );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const lettersData = await Promise.all(snapshot.docs.map(async (doc) => {
        const userRef = doc.data().author as DocumentReference;
        const userSnapshot = await getDoc(userRef);
        let userData = null;

        if (userSnapshot.exists()) {
          userData = userSnapshot.data();
        } else {
          userData = null;
        }

        return {
          id: doc.id,
          ...doc.data(),
          user: userData
        } as UserLetter;
      }));

      setLetters(lettersData);
    });

    return () => {
      unsubscribe();
      setLetters([]);
    }
  }, [email, isVerified]);

  const editHandle = async (id: string) => {
    setEditLetterModal(true);

    const docRef = doc(firestore, "letters", id);
    const snapshot = await getDoc(docRef);
    const data = snapshot.data();

    setEditLetterForm({
      createdAt: format((data?.createdAt as Timestamp).toDate(), "MMMM do, yyyy hh:mm a") as string,
      updatedAt: format((data?.updatedAt as Timestamp).toDate(), "MMMM do, yyyy hh:mm a") as string,
      id: snapshot.id as string,
      title: data?.title as string,
      message: data?.message as string,
    });
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      return setValidated(true);
    }
    const id = form.letterId.value as string;
    const title = form.letterTitle.value as string;
    const message = form.letterMessage.value as string;
    const saveChangesButton = form.saveChangesButton as HTMLButtonElement;

    saveChangesButton.innerHTML = "Saving...";
    saveChangesButton.disabled = true;

    try {
      const docRef = doc(firestore, "letters", id);
      await updateDoc(docRef, {
        title: title,
        message: message,
        updatedAt: new Date()
      });
      setToast({
        message: "The letter has been updated!",
        show: true
      });
      setEditLetterModal(!editLetterModal);
      setEditLetterForm({
        createdAt: "",
        updatedAt: "",
        id: "",
        title: "",
        message: ""
      });
      saveChangesButton.innerHTML = "Save Changes";
      saveChangesButton.disabled = false;
    } catch (error) {
      const message = (error as FirestoreError).message;
      console.error(message);
      setToast({
        message: "Something went wrong while updating your letter, please try again.",
        show: true
      });
      setEditLetterModal(!editLetterModal);
      setEditLetterForm({
        createdAt: "",
        updatedAt: "",
        id: "",
        title: "",
        message: ""
      });
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

  const continueReadingHandle = async (id: string) => {
    try {
      const docRef = doc(firestore, "letters", id);
      const snapshot = await getDoc(docRef);
      const letterData = snapshot.data();
      const userRef = letterData?.author;
      const userSnapshot = await getDoc(userRef);
      const userData = userSnapshot.data();

      setContinueReadingContent({
        id: snapshot.id,
        ...letterData,
        user: userData
      } as UserLetter);
      setContinueReadingModal(true);
    } catch (error) {
      const message = (error as FirestoreError).message;
      console.error(message);
      setContinueReadingModal(false);
    }
  }

  const deleteHandle = async (id: string) => {
    try {
      const docRef = doc(firestore, "letters", id);
      await deleteDoc(docRef);
      setToast({
        message: "The letter has been deleted!",
        show: true
      });
    } catch (error) {
      const message = (error as FirestoreError).message;
      console.error(message);
    }
  }

  const newLetterHandle = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    if (form.checkValidity() === false) return setNewLetterValidate(true);

    const title = form.letterTitle.value as string;
    const message = form.letterMessage.value as string;
    const postButton = form.postButton as HTMLButtonElement;

    postButton.innerHTML = "Posting...";
    postButton.disabled = true;

    try {
      const userRef = doc(firestore, "users", email);
      const colRef = collection(firestore, "letters");
      await addDoc(colRef, {
        author: userRef,
        createdAt: new Date(),
        updatedAt: new Date(),
        title: title,
        message: message,
      });
      setToast({
        message: "Your letter has been posted!",
        show: true
      });
      setNewLetterModal(false);
      setNewLetterValidate(false);
      postButton.innerHTML = "Post";
      postButton.disabled = false;
    } catch (error) {
      const message = (error as FirestoreError).message;
      console.error(message);
      setToast({
        message: "Something went wrong while uploading your letter, please try again.",
        show: true
      });
      setNewLetterModal(false);
      postButton.innerHTML = "Post";
      postButton.disabled = false;
    }
  }

  const continueReadingCloseHandle = () => {
    setContinueReadingModal(!continueReadingModal);
  }

  const handleEditLetterClose = () => {
    setEditLetterForm({
      createdAt: "",
      updatedAt: "",
      id: "",
      title: "",
      message: ""
    });
    setEditLetterModal(!editLetterModal)
  }

  return (
    <section className="my-letters-section mb-4">
      <Toast show={toast.show} className="position-fixed end-0 bottom-0 m-3" onClose={closeToast} animation={true} delay={5000} autohide>
        <Toast.Header>
          <strong className="me-auto">Notification</strong>
        </Toast.Header>
        <Toast.Body>
          {toast.message}
        </Toast.Body>
      </Toast>

      <Modal show={continueReadingModal} onHide={continueReadingCloseHandle} size="xl" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>{continueReadingContent?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ textAlign: "justify" }}>
          {continueReadingContent?.message.split("\n").map((paragraph, index) => (
            paragraph === "" ?
            <div><br/></div> :
            <div key={index}>{paragraph}</div>
          ))}
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={continueReadingCloseHandle}>Close</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={editLetterModal} onHide={handleEditLetterClose} size="xl" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Edit Letter</Modal.Title>
        </Modal.Header>
        <Modal.Body>

          <div className="mb-1 opacity-75"><small>Created at {editLetterForm.createdAt !== "" ?
            editLetterForm.createdAt :
            <Placeholder as={CardText} animation="glow">
              <Placeholder xs={5} />
            </Placeholder>}</small></div>

          <div className="opacity-75"><small>Last updated: {editLetterForm.updatedAt !== "" ?
            editLetterForm.updatedAt :
            <Placeholder as={CardText} animation="glow">
              <Placeholder xs={4} />
            </Placeholder>}</small></div>

          <hr />

          <Form noValidate validated={validated} onSubmit={handleSubmit}>
            <Form.Control type="text" name="letterId" defaultValue={editLetterForm.id} required hidden></Form.Control>
            <Form.Group className="mb-3">
              <Form.Label>Title <span className="text-danger">*</span></Form.Label>
              <Form.Control type="text" defaultValue={editLetterForm.title} name="letterTitle" required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Message <span className="text-danger">*</span></Form.Label>
              <Form.Control as="textarea" defaultValue={editLetterForm.message} name="letterMessage" style={{ height: "300px" }} required />
            </Form.Group>
            <div>
              <Button type="submit" name="saveChangesButton">Save Changes</Button>
            </div>

          </Form>

        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={handleEditLetterClose}>Close</Button>
        </Modal.Footer>
      </Modal>

      <Modal show={newLetterModal} onHide={() => { setNewLetterModal(!newLetterModal) }} size="xl" backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Write to your letters</Modal.Title>
        </Modal.Header>
        <Modal.Body>

          <Form noValidate validated={newLetterValidate} onSubmit={newLetterHandle}>
            <Form.Group className="mb-3">
              <Form.Label>Title <span className="text-danger">*</span></Form.Label>
              <Form.Control type="text" name="letterTitle" required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Message <span className="text-danger">*</span></Form.Label>
              <Form.Control as="textarea" name="letterMessage" style={{ height: "300px" }} required />
            </Form.Group>
            <div>
              <Button type="submit" variant="primary" name="postButton">Post</Button>
            </div>
          </Form>

        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={() => { setNewLetterModal(!newLetterModal) }}>Close</Button>
        </Modal.Footer>
      </Modal>

      <h3 className="mb-3">My Letters</h3>
      <Button type="button" variant="outline-primary" className="mb-3" onClick={() => { setNewLetterModal(!newLetterModal) }} disabled={isUpload}>Write</Button>
      <div className="container">
        <div className="d-flex flex-nowrap gap-2 overflow-x-auto overflow-y-hidden pb-3">
          {
            (email) ?
              letters.map((letter) => (
                <Card key={letter.id} className="position-relative overflow-hidden" style={{ minWidth: "16rem", width: "16rem", height: "18rem", whiteSpace: "pre-line", textAlign: "justify" }}>
                  <CardBody>
                    <CardTitle>
                      {letter.title}
                    </CardTitle>
                    <CardText>
                      {letter.message.split(" ").splice(0, 25).join(" ")}... <Button type="button" size="sm" variant="outline-secondary" onClick={() => { continueReadingHandle(letter.id) }}>Continue reading</Button>
                      <div className="position-absolute bottom-0 end-0 start-0 p-3 d-flex justify-content-center align-items-center gap-1">
                        <Button type="button" variant="primary" className="w-100" onClick={() => { editHandle(letter.id) }}>Edit</Button>
                        <Button type="button" variant="outline-danger" className="w-100" onClick={() => { deleteHandle(letter.id) }}>Delete</Button>
                      </div>
                    </CardText>
                  </CardBody>
                </Card>
              )) :
            <CardPlaceholder />
          }
        </div>
      </div>
    </section>
  )
}

export default MyLetters;