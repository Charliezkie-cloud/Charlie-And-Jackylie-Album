import React from "react";

const Heart: React.FC = () => {
  return (
    <div style={{ height: "300px" }} className="d-flex justify-content-center align-items-center flex-column">
      <div id="heart">
        <div className="left"></div>
        <div className="right"></div>
        <div className="bottom"></div>
      </div>
      <div className="mt-5">Developed by Charles Henry Tinoy</div>
    </div>
  )
}

export default Heart;
