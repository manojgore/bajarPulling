import './App.css';
import Table from './component/Table';
import WebSocketComponent from './component/WebSocketComponent';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/pulling-data/:secret-key" element={<WebSocketComponent />} />
        <Route path="/:marketType/:code" element={<Table />} />
      </Routes>
    </Router>
  );
}

export default App;
