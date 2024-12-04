import React, { useEffect, useRef, useState } from "react";
import { Button, Container, Image, Modal, Alert } from "react-bootstrap";
import { supabase } from "../../databases/supabase";
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../../databases/firebase";

import ImagePlaceholder from "../ImagePlaceholder";

const Gallery: React.FC<{ email: string, isVerified: boolean }> = ({ email, isVerified }) => {
  const [images, setImages] = useState<string[]>([]);
  const [loadedImages, setLoadedImages] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [previewModal, setPreviewModal] = useState(false);
  const [previewImage, setPreviewImage] = useState({
    url: "",
    uploadedBy: ""
  });
  const [isView, setIsView] = useState(false);

  useEffect(() => {
    if (!email) return setImages([]);

    if (isVerified) {
      setIsView(true);
    } else {
      setIsView(false); 
    }

    const fetchInitialImages = async () => {
      const allFiles = await getAllFilesWithSignedUrls('charlzk-storage');
      setImages(allFiles.filter((url) => {
        return !url.includes(".emptyFolderPlaceholder");
      }));
      setLoadedImages(20);
    };

    fetchInitialImages();
  }, [email, isVerified]);

  const getAllFilesWithSignedUrls = async (bucketName: string): Promise<string[]> => {
    const files: string[] = [];

    const { data, error } = await supabase.storage.from(bucketName).list("");
    if (error) return [];

    const folders = data.map((item) => {
      if (item.name === ".emptyFolderPlaceholder") return "";
      return item.name;
    })

    const signedUrls = await Promise.all(folders.map(async (folder) => {
      if (folder === "") return "";

      const { data, error } = await supabase.storage.from(bucketName).list(`${folder}`);
      if (error) return [];

      const urls = await Promise.all(data.map(async (url) => {
        const { data: signedUrl } = await supabase.storage.from(bucketName).createSignedUrl(`${folder}/${url.name}`, 3600);
        return signedUrl?.signedUrl ?? "";
      }));

      return urls;
    }));

    files.push(...signedUrls.flat());

    return files;
  };

  const handleScroll = () => {
    const container = containerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setLoadedImages((prev) => Math.min(prev + 5, images.length));
      }
    }
  };

  window.addEventListener("scroll", handleScroll);

  const modalShowHandle = () => {
    setPreviewModal(!previewModal);
  }

  const imagePreviewOnClick = async (e: React.SyntheticEvent<HTMLImageElement>) => {
    const image = e.currentTarget;

    const url = image.src;
    const regex = /\/storage\/v1\/object\/sign\/charlzk-storage\/([^?]+)/;
    const match = url.match(regex);

    if (match && match[1]) {
      const uploaderEmail = match[1].split("/")[0];
      const docRef = doc(firestore, "users", uploaderEmail);
      const snapshot = await getDoc(docRef);
      setPreviewImage({
        url: url,
        uploadedBy: `${snapshot.data()?.firstname} ${snapshot.data()?.lastname}`
      });
      setPreviewModal(true);
    }
  }

  return (
    <section>
      <Modal size="lg" show={previewModal} onHide={modalShowHandle} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            {
              (previewImage.url) ?
              <Image src={previewImage.url} className="w-100" rounded /> :
              "Image not available"
            }
          </div>
          <div>
            {
              (previewImage.uploadedBy) ?
              `Uploaded by ${previewImage.uploadedBy}` :
              "Uploaded by: Unavailable"
            }
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={modalShowHandle}>Close</Button>
        </Modal.Footer>
      </Modal>

      <Container>
        {
          isView !== true ?
          <Alert variant="danger" key="danger">Please verify your email to view our letters</Alert> :
          null
        }

        <h3 className="mb-3">Our Gallery</h3>
        <div ref={containerRef} className="d-flex justify-content-center align-items-start flex-wrap overflow-y-auto pe-3 overflow-x-hidden gap-2 h-100">
          {
            (!isView) ? null :
            (email) ?
              images.slice(0, loadedImages).map((url, index) => (
                url !== "" ?
                <Image src={url} className="image-item shadow" key={index} rounded onClick={imagePreviewOnClick} /> :
                null
              )) :
            <ImagePlaceholder/>
          }
        </div>
      </Container>
    </section>
  );
};

export default Gallery;
