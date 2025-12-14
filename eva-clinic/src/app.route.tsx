
import LandingLayout from '@/components/layouts/landing.layout';
import { createBrowserRouter } from 'react-router-dom';
import LoginPage from './features/auth/login.page';
import DashboardPage from './features/dashboard/dashboard.page';
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
  },
  {
    path: '/login',
    Component: LoginPage
  },
  {
    path: '/dashboard',
    Component: DashboardPage
  }
])
