
import LandingLayout from '@/components/layouts/landing.layout';
import { createBrowserRouter } from 'react-router-dom';
import LandingPage from './features/landing/landing.page';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingLayout />,
    children: [
      {
        index: true,
        Component: LandingPage
      }
    ]
  }
])
