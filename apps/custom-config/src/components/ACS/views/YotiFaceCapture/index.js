/* eslint-disable react/prop-types */
/* eslint-disable no-unused-vars */

import YOTIFaceCapture, { CAPTURE_METHOD, IMAGE_TYPE, QUALITY_TYPE } from '@getyoti/react-face-capture';
import '@getyoti/react-face-capture/index.css';

const YotiFaceCapture = () => (
  <YOTIFaceCapture
    secure
    onSuccess={async ({ img, secure }) => {
      console.log('Debug ~ file: index.js ~ line 60 ~ onSuccess={ ~ secure', secure);
      console.log('Debug ~ file: index.js ~ line 60 ~ onSuccess={ ~ img', img);
    }}
    onError={console.log}
  />
);

export default YotiFaceCapture;
