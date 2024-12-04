import React from "react";
import { Image } from "react-bootstrap";
import ImagePlaceholderSrc from "../assets/img/ImagePlaceholderSrc.jpg";

const ImagePlaceholder: React.FC = () => {
  const renderedItems: JSX.Element[] = [];

  for (let i = 0; i < 10; i++) {
    renderedItems.push(
      <Image key={i} src={ImagePlaceholderSrc} className="image-item shadow" rounded />
    )
  }

  return (
    <>
      {renderedItems};
    </>
  )
}

export default ImagePlaceholder;