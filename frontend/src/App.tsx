import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import RootLayout from './layouts/RootLayout';
import Home, { handleDorm } from './pages/Home';
import ChatRoom from './pages/ChatRoom';
import Error from './pages/Error';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<RootLayout />} errorElement={<Error />}>
      <Route index element={<Home />} action={handleDorm} />
      <Route path="chatroom" element={<ChatRoom />} />
    </Route>
  )
);

function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster />
    </>
  );
}

export default App;
