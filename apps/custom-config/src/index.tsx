import { StrictMode } from 'react';
import ReactDOM from 'react-dom';

import YotiFaceCapture from './components/ACS/views/YotiFaceCapture';

const main = async () => {
  ReactDOM.render(
    <StrictMode>
      <YotiFaceCapture />
    </StrictMode>,
    document.getElementById('root')
  );
};

export default main;
