import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../../databases/supabase";
import { Image, Button, Modal, Form, Toast } from "react-bootstrap";
import ImagePlaceholder from "../ImagePlaceholder";
import ImagePlaceholderSrc from "../../assets/img/ImagePlaceholderSrc.jpg";

const MyGallery: React.FC<{ email: string, isVerified: boolean }> = ({ email, isVerified }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<string[]>([]);
  const [visibleImages, setVisibleImages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  const [uploadModal, setUploadModal] = useState(false);
  const [validated, setValidated] = useState(false);
  const [imagesPreview, setImagesPreview] = useState<string[]>([]);
  const imagesRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState({
    message: "",
    show: false
  });
  const [viewImageModal, setViewImageModal] = useState(false);
  const [viewImageUrl, setViewImageUrl] = useState("");
  const [isUpload, setIsUpload] = useState(false);

  useEffect(() => {
    if (!email) {
      setImages([])
      return setVisibleImages([]);
    }

    if (!isVerified) {
      setIsUpload(true);
    } else {
      setIsUpload(false);
    }

    const fetchAllGallery = async () => {
      const { data, error } = await supabase.storage.from("charlzk-storage").list(email);

      if (error) {
        console.error("Error fetching files:", error.message);
        return;
      }

      const urls = await Promise.all(
        data.map(async (item) => {
          if (item.name === ".emptyFolderPlaceholder") return "";
          const { data } = await supabase.storage.from("charlzk-storage").createSignedUrl(`${email}/${item.name}`, 3600);
          return data?.signedUrl ?? "";
        })
      );

      setImages(urls.filter((url) => url !== ""));
      setVisibleImages(urls.slice(0, itemsPerPage).filter((url) => url !== ""));
    };

    fetchAllGallery();
  }, [email, isVerified]);

  const scrollHandle = () => {
    const e = containerRef.current;
    if (!e) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    if (scrollTop + clientHeight >= scrollHeight) {
      loadMoreImages();
    }
  };

  const loadMoreImages = () => {
    const nextPage = currentPage + 1;
    const newImages = images.slice(nextPage * itemsPerPage, (nextPage + 1) * itemsPerPage);
    if (newImages.length > 0) {
      setVisibleImages((prev) => [...prev, ...newImages]);
      setCurrentPage(nextPage);
    }
  };

  const uploadModalOnHide = () => {
    setUploadModal(!uploadModal);
  }

  const uploadButtonOnClick = () => {
    setImagesPreview([]);
    setUploadModal(!uploadModal);
    setValidated(false);
    const imagesInput = imagesRef.current;
    if (!imagesInput) return;
    imagesInput.files = null;
  }

  const imagesOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImagesPreview([]);

    const files = e.currentTarget.files;
    if (!files) return;

    const newImages: string[] = [];
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          newImages.push(reader.result.toString());
          if (newImages.length === files.length) {
            setImagesPreview((imagesPreview) => [...imagesPreview, ...newImages]);
          }
        }
      };
      reader.readAsDataURL(file);
    });
  }

  const uploadFormOnSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const form = e.currentTarget;
    if (!form.checkValidity()) {
      return setValidated(true);
    }
    const imagesInput: HTMLInputElement = form.images;
    const uploadButton: HTMLButtonElement = form.uploadButton;

    uploadButton.innerHTML = "Uploading...";
    uploadButton.disabled = true;

    const files = imagesInput.files ? Array.from(imagesInput.files) : [];
    if (files.length === 0) return;

    try {
      let urls: string[] = [];
      for (const file of files) {
        const filePath = `${email}/${file.name}`;

        const { data, error } = await supabase.storage.from('charlzk-storage').upload(filePath, file);
        if (error) return;

        const { data: signedUrl } = await supabase.storage.from('charlzk-storage').createSignedUrl(data.path, 3600);

        urls.push(signedUrl?.signedUrl as string);
      }

      setImages([...images, ...urls]);
      setVisibleImages([...visibleImages, ...urls]);
      setUploadModal(!uploadModal);
      setToast({
        message: "Your pictures has been uploaded!",
        show: true
      });

      uploadButton.innerHTML = "Upload";
      uploadButton.disabled = false;
    } catch (error) {
      console.error(error);
      uploadButton.innerHTML = "Upload";
      uploadButton.disabled = false;
    }
  }

  const closeToast = () => {
    setToast({
      message: toast.message,
      show: !toast.message
    });
  }

  const viewImageModalOnHide = () => {
    setViewImageModal(!viewImageModal);
  }

  const imageOnClick = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const src = e.currentTarget.src;
    setViewImageModal(!viewImageModal);
    setViewImageUrl(src);
  }

  const deleteImageOnClick = async () => {
    try {
      const regex = /\/storage\/v1\/object\/sign\/charlzk-storage\/([^?]+)/;
      const match = viewImageUrl.match(regex);

      if (match && match[1]) {
        const { error } = await supabase.storage.from("charlzk-storage").remove([match[1]]);
        
        if (error) throw error;

        setImages([...images.filter(url => url !== viewImageUrl)]);
        setVisibleImages([...visibleImages.filter(url => url !== viewImageUrl)]);
        setToast({
          message: "The image has been deleted!",
          show: true
        });
        setViewImageModal(!viewImageModal);

        console.log(images);
        console.log(visibleImages);
      } else {
        setToast({
          message: "Failed to delete the image, please try again.",
          show: true
        });
        setViewImageModal(!viewImageModal);
      }
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <section className="mb-4">
      <h3 className="my-gallery-section mb-3">My Gallery</h3>

      <Toast show={toast.show} className="position-fixed end-0 bottom-0 m-3" onClose={closeToast} animation={true} delay={5000} autohide>
        <Toast.Header>
          <strong className="me-auto">Notification</strong>
        </Toast.Header>
        <Toast.Body>
          {toast.message}
        </Toast.Body>
      </Toast>

      <div className="mb-3">
        <Button type="button" variant="outline-primary mb-1" onClick={uploadButtonOnClick} disabled={isUpload}>Upload</Button>
        <div className="mb-1 opacity-75">Tap the image to view or remove.</div>
      </div>
      <Modal size="xl" show={uploadModal} onHide={uploadModalOnHide} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Upload to your gallery</Modal.Title>
        </Modal.Header>
        <Modal.Body>

          <Form validated={validated} onSubmit={uploadFormOnSubmit} noValidate>
            <Form.Group className="mb-3">
              <Form.Label>Images <span className="text-danger">*</span></Form.Label>
              <Form.Control ref={imagesRef} type="file" name="images" multiple accept="images/*" onChange={imagesOnChange} required />
            </Form.Group>
            {
              (imagesPreview.length > 0) ?
                <div className="mb-3 d-flex justify-content-center align-items-start flex-wrap overflow-y-auto pe-3 overflow-x-hidden gap-2">
                  {imagesPreview.map((url, index) => (
                    <Image key={index} src={url} className="image-item shadow" rounded />
                  ))}
                </div> :
              null
            }
            <div>
              <Button type="submit" variant="primary" name="uploadButton">Upload</Button>
            </div>
          </Form>

        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={uploadModalOnHide}>Close</Button>
        </Modal.Footer>
      </Modal>

      <Modal size="lg" show={viewImageModal} onHide={viewImageModalOnHide} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Preview</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            {(viewImageUrl) ?
            <Image src={viewImageUrl} className="w-100" rounded />:
            <Image src={ImagePlaceholderSrc} className="w-100" rounded />}
          </div>
          <div>
            <Button type="button" variant="outline-danger" onClick={deleteImageOnClick}>Delete</Button>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button type="button" variant="secondary" onClick={viewImageModalOnHide}>Close</Button>
        </Modal.Footer>
      </Modal>

      <div className="container">
        <div ref={containerRef} className="d-flex justify-content-center align-items-start flex-wrap overflow-y-auto pe-3 overflow-x-hidden gap-2" onScroll={scrollHandle} style={{ height: "500px" }}>
          {
          (email) ?
            visibleImages.map(item =>
              item !== "" ?
                <Image src={item} className="image-item shadow" key={item.split("?")[0]} onClick={imageOnClick} rounded /> :
                null
            ) :
          <ImagePlaceholder />
          }
        </div>
      </div>
    </section>
  )
}

export default MyGallery;