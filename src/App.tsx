import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Inversiones from './pages/Inversiones';
import Comparaciones from './pages/Comparaciones';
import Prestamo from './pages/Prestamo';
import Benchmarks from './pages/Benchmarks';
import Configuracion from './pages/Configuracion';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="inversiones" element={<Inversiones />} />
          <Route path="comparaciones" element={<Comparaciones />} />
          <Route path="prestamo" element={<Prestamo />} />
          <Route path="benchmarks" element={<Benchmarks />} />
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
