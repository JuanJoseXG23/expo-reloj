import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Enter from './pages/Enter';
import Room from './pages/Room';
import Panel from './pages/Panel';
import Presentation from './pages/Presentation';
import Rehearsal from './pages/Rehearsal';
import { firebaseConfigured } from './firebase';

export default function App() {
  return (
    <HashRouter>
      {!firebaseConfigured && (
        <div className="bg-naranja px-4 py-1 text-center text-xs font-bold text-white">
          Firebase sin configurar: la app funciona solo en modo local (ver README).
        </div>
      )}
      <Routes>
        <Route path="/" element={<Enter />} />
        <Route path="/sala" element={<Room />} />
        <Route path="/panel" element={<Panel />} />
        <Route path="/presentacion" element={<Presentation />} />
        <Route path="/presentacion/ensayo/:id?" element={<Rehearsal />} />
        <Route path="/presentar" element={<Navigate to="/presentacion" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
