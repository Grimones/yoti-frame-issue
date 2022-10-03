import React, { useState } from "react";
import FaceCapture, { CAPTURE_METHOD } from "@getyoti/react-face-capture";
import "@getyoti/react-face-capture/index.css";
import Container from "@material-ui/core/Container";
import { createStyles, makeStyles } from "@material-ui/core/styles";
import { Button, Modal, Box, Typography } from "@material-ui/core";
import ReplayIcon from "@material-ui/icons/Replay";
import { Api } from "./api/api";

const service = new Api();

const useStyles = makeStyles((theme) =>
  createStyles({
    root: {
      height: "100%",
    },
    img: {
      width: "100%",
      borderRadius: 20,
    },
    imgContainer: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      width: "50vw",
      margin: "auto",
    },
    button: {
      marginTop: theme.spacing(3),
    },
    faceCapture: {
      background: "black",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      height: "100%",
      "& video": {
        height: "100%",
        width: "100%",
        objectFit: "cover",
      },
      "& > div, & > div > div": {
        height: "100%",
        width: "100%",
      },
    },
    response: {
      marginTop: theme.spacing(2),
      minHeight: "180px",
      border: "2px solid",
      borderColor: theme.palette.primary.main,
      borderRadius: 20,
      minWidth: "80%",
      padding: theme.spacing(1),
    },
    error: { borderColor: theme.palette.error.main },
    responseTitle: {
      fontWeight: theme.typography.fontWeightBold,
      color: theme.palette.primary.main,
    },
    responseTitleError: {
      color: theme.palette.error.main,
    },
  })
);

const modalStyles = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: 400,
  bgcolor: "background.paper",
  border: "2px solid #000",
  boxShadow: 24,
  p: 4,
};

const useRestartCapture = (status) => {
  const [key, setKey] = React.useState(0);
  const previousStatusRef = React.useRef(status);

  React.useEffect(() => {
    // Internally we have something like
    // previousStatusRef.current === AcsStatus.ERROR && status === AcsStatus.NORMAL
    if (previousStatusRef.current === true && status === false) {
      setKey((prev) => prev + 1);
    }
    previousStatusRef.current = status;
  });

  return key;
};

const App = () => {
  const [response, setResponse] = useState();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const key = useRestartCapture(hasError);

  const classes = useStyles();

  const onSuccess = ({ img }) => {
    service
      .predict(img)
      .then((res) => setResponse(JSON.stringify(res.data, null, 2)))
      .catch((err) => {
        setHasError(true);
        setIsModalOpen(true);
        const errorMessage = err.response.data;
        setResponse(
          typeof errorMessage === "object" && errorMessage !== null
            ? JSON.stringify(errorMessage, null, 2)
            : errorMessage
        );
      });
  };
  const onError = (error) => console.log("Error =", error);

  const reset = () => {
    setResponse(undefined);
    setHasError(false);
    setIsModalOpen(false);
  };

  return (
    <div className={classes.root}>
      <Container style={{ padding: 0, height: "100%" }}>
        <div className={classes.faceCapture}>
          <FaceCapture
            secure
            key={key}
            captureMethod={CAPTURE_METHOD.AUTO}
            onSuccess={onSuccess}
            onError={onError}
          />
        </div>
        <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
          <Box sx={modalStyles}>
            <Typography variant="h6" component="h2">
              {response}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              size="large"
              className={classes.button}
              onClick={reset}
              endIcon={<ReplayIcon />}
            >
              Restart
            </Button>
          </Box>
        </Modal>
      </Container>
    </div>
  );
};

export default App;
