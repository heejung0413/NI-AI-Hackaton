import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import ChatRoom from "./ChatRoom";
import Calendar from "./Calendar";
import Call from "./Call";
import Officemail from "./Officemail";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/calendar" replace />} />
        <Route path="/chat" element={<ChatRoom />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/call" element={<Call />} />
        <Route path="/officemail" element={<Officemail />} />
      </Routes>
    </Router>
  );
}

export default App;
