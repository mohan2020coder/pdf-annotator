import React from 'react';
import PDFAnnotator from './components/PDFAnnotator';

function App() {
  return (
    <div style={{ height: '100vh' }}>
      <PDFAnnotator url="/sample.pdf" />
    </div>
  );
}

export default App;
