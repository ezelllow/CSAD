import { Routes, Route } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './components/HomePage';
import Home from './components/Home';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/homePage" element={<HomePage />} />
        {/* Other routes */}
      </Routes>
    </BrowserRouter>
  );
}

export default App; 