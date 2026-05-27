import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import DealDetail from './pages/DealDetail';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Favorites from './pages/Favorites';
import Submit from './pages/Submit';
import ProductDetail from './pages/ProductDetail';
import Search from './pages/Search';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/deal/:id" element={<DealDetail />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/submit" element={<Submit />} />
        <Route path="/search" element={<Search />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}