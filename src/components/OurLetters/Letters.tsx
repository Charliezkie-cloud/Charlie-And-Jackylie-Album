import React, { useEffect, useState } from "react";
import { Container, Card, CardBody, CardTitle, CardText, Button, Modal, Collapse, Alert } from "react-bootstrap";
import CardPlaceholder from "../CardPlaceholder";
import { collection, DocumentReference, onSnapshot, orderBy, query, getDoc, Timestamp, doc } from "firebase/firestore";
import { firestore } from "../../databases/firebase";
import { format } from "date-fns";

const Letters: React.FC<{ email: string, isVerified: boolean }>= ({ email, isVerified }) => {
  interface User {
    birthdate: Timestamp,
    updatedAt: Timestamp,
    createdAt: Timestamp,
    address: string,
    firstname: string,
    lastname: string,
  }

  interface UserLetter {
    id: string,
    author: DocumentEventMap,
    createdAt: Timestamp,
    updatedAt: Timestamp,
    title: string,
    message: string,
    user: User
  }

  const [letters, setLetters] = useState<UserLetter[]>([]);
  const [continueReadingModal, setContinueReadingModal] = useState(false);
  const [continueReadingContent, setContinueReadingContent] = useState<UserLetter>();
  const [collapse, setCollapse] = useState(false);
  const [isView, setIsView] = useState(false);

  useEffect(() => {
    if (!email) {
      return;
    }

    if (isVerified) {
      setIsView(true);
    } else {
      setIsView(false); 
    }

    const colRef = collection(firestore, "letters");
    const q = query(colRef, orderBy("updatedAt", "desc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {

      const lettersData = await Promise.all(snapshot.docs.map(async (doc) => {
        const letterData = doc.data();
        const userRef = letterData.author as DocumentReference;
        const userSnapshot = await getDoc(userRef);
        const userData = userSnapshot.data();

        return {
          id: doc.id,
          ...letterData,
          user: userData
        } as UserLetter
      }));

      setLetters([...lettersData]);
    });

    return () => unsubscribe();
  }, [email, isVerified]);

  const continueReadingOnClick = async (id: string) => {
    try {
      const docRef = doc(firestore, "letters", id);
      const snapshot = await getDoc(docRef);
      const letterData = snapshot.data();
      const userRef = letterData?.author as DocumentReference;
      const userSnapshot = await getDoc(userRef);

      setContinueReadingContent({
        id: letterData?.id,
        ...letterData,
        user: userSnapshot.data()
      } as UserLetter);
      setContinueReadingModal(true);
    } catch (error) {
      console.error(error);
      setContinueReadingModal(false);
    }
  }

  return (
      <section>
        <Container>
          {
            isView !== true ?
            <Alert variant="danger" key="danger">Please verify your email to view our letters</Alert> :
            null
          }

          <h3 className="mb-3">Our Letters</h3>

          <Modal show={continueReadingModal} onHide={() => setContinueReadingModal(false)} size="xl" backdrop="static">
            <Modal.Header closeButton>
              <Modal.Title>{continueReadingContent?.title}</Modal.Title>
            </Modal.Header>
            <Modal.Body style={{ textAlign: "justify" }}>
              {
                continueReadingContent?.message.split("\n").map((paragraph, index) => (
                  paragraph === "" ?
                  <div><br/></div> :
                  <div key={index}>{paragraph}</div>
                ))
              }
              <hr/>
              <div>
                <Button type="button" variant="outline-secondary" size="sm" onClick={() => setCollapse(!collapse)}>Information</Button>
                <Collapse in={collapse} className="mt-3">
                  <div>
                    <div className="mb-3">
                      <h5 className="mb-3">Letter Information</h5>
                      <Container>
                        <div className="mb-1">
                          {
                            continueReadingContent?.createdAt ?
                            `Created At: ${format(continueReadingContent?.createdAt.toDate(), "MMMM do, yyyy hh:mm:a")}` :
                            "Created At: Not available"
                          }
                        </div>

                        <div className="mb-1">
                          {
                            continueReadingContent?.createdAt ?
                            `Last updated at ${format(continueReadingContent?.updatedAt.toDate(), "MMMM do, yyyy hh:mm:a")}` :
                            "Last Updated At: Not available"
                          }
                        </div>
                      </Container>
                    </div>
                    
                    <div className="mb-3">
                      <h5 className="mb-3">Author Information</h5>
                      <Container>
                        <div className="mb-1">{continueReadingContent?.user.firstname} {continueReadingContent?.user.lastname}</div>

                        <div className="mb-1">
                          {
                            continueReadingContent?.user.birthdate ?
                            format(continueReadingContent?.user.birthdate.toDate(), "MMMM do, yyyy") :
                            "Birthdate not available"
                          }
                        </div>
                        
                        <div className="mb-1">Lives in {continueReadingContent?.user.address}</div>
                      </Container>
                    </div>
                  </div>
                </Collapse>
              </div>
            </Modal.Body>
            <Modal.Footer>
              <Button type="button" variant="secondary" onClick={() => setContinueReadingModal(false)}>Close</Button>
            </Modal.Footer>
          </Modal>

          <Container>
            <div className="d-flex justify-content-center align-items-start gap-2 flex-wrap">
              {
                (!isView) ? null :
                (email) ?
                  letters.map((letter) => (
                    <Card key={letter.id} className="position-relative overflow-hidden" style={{ minWidth: "16rem", width: "16rem", height: "16rem", whiteSpace: "pre-line", textAlign: "justify" }}>
                      <CardBody>
                        <CardTitle>{letter.title}</CardTitle>
                        <CardText>{letter.message.split(" ").splice(0, 25).join(" ")}...</CardText>
                        <div className="position-absolute bottom-0 start-0 end-0 p-3 bg-body-secondary">
                          <Button type="button" size="sm" variant="outline-secondary w-100" onClick={() => continueReadingOnClick(letter.id)}>Continue reading</Button>
                        </div>
                      </CardBody>
                    </Card>
                  )) :
                <CardPlaceholder/>
              }
            </div>
          </Container>
        </Container>
      </section>
    );
}

export default Letters;
