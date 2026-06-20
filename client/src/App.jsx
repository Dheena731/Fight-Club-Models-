import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './lib/theme';
import Home from './screens/Home';
import Battle from './screens/Battle';
import Result from './screens/Result';

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/battle" element={<Battle />} />
          <Route path="/result" element={<Result />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
