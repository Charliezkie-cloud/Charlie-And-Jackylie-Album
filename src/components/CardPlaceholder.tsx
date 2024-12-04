import React from "react";
import { Card, CardBody, CardTitle, Placeholder, CardText } from "react-bootstrap";

const CardPlaceholder: React.FC = () => {
  const renderedItems: JSX.Element[] = [];

  for (let i = 0; i < 10; i++) {
    renderedItems.push(
      <Card key={i} style={{ minWidth: "16rem", width: "16rem", height: "18rem", whiteSpace: "pre-line", textAlign: "justify" }}>
        <CardBody>
          <CardTitle>
            <Placeholder as={CardText} animation="glow">
              <Placeholder xs={9} />
            </Placeholder>
          </CardTitle>
          <CardText>
            <Placeholder as={CardText} animation="glow">
              <Placeholder xs={12} />
              <Placeholder xs={9} />
              <Placeholder xs={6} />
            </Placeholder>
          </CardText>
        </CardBody>
      </Card>
    )
  }

  return (
    <>
      {renderedItems}
    </>
  )
}

export default CardPlaceholder;