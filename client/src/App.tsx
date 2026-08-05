import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useAppDispatch } from '@store/hooks';
import { checkSession } from '@store/authSlice';
import { RouteList } from '@/util/routeUtil';

function App() {
  const dispatch = useAppDispatch();
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;
    dispatch(checkSession());
  }, [dispatch]);

  return (
    <BrowserRouter>
      <Routes>
        {RouteList.map(({ path, element }) => (
          <Route key={path} path={path} element={element} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
