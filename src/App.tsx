import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';
import Enter from './pages/Enter';
import Room from './pages/Room';
import Panel from './pages/Panel';
import Present from './pages/Present';
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
        <Route path="/presentar" element={<Present />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
