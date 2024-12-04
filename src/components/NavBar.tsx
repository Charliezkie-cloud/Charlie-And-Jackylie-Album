import React, { useEffect, useState } from "react";
import { Container, Nav, Navbar, Offcanvas } from "react-bootstrap";

const NavBar: React.FC = () => {
  const [activeLink, setActiveLink] = useState("");

  useEffect(() => {
    const currentLocation = window.location.hash;
    setActiveLink(currentLocation);
  }, []);

  return (
    <>
      <Navbar expand="md" className="bg-body-secondary">
        <Container>
          <Navbar.Brand href="/">Charlie and Jackylie Album</Navbar.Brand>
          <Navbar.Toggle/>
          <Navbar.Offcanvas>
            <Offcanvas.Header closeButton>
              <Offcanvas.Title>Charlie and Jackylie Album</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
              <Nav className="justify-content-end flex-grow-1">
                <Nav.Link href="/" active={activeLink === ""}>Home</Nav.Link>
                <Nav.Link href="#our-letters" active={activeLink === "#our-letters"}>Our Letters</Nav.Link>
                <Nav.Link href="#our-gallery" active={activeLink === "#our-gallery"}>Our Gallery</Nav.Link>
              </Nav>
            </Offcanvas.Body>
          </Navbar.Offcanvas>
        </Container>
      </Navbar>
    </>
  )
}

export default NavBar;
