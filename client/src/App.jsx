import { useEffect } from 'react';
import { useRoutes } from 'react-router-dom';
import { AuthProvider, RequireRole } from './lib/auth.jsx';
import { markHydrated } from './lib/ssr.jsx';
import Layout, { SETTINGS_KEY } from './components/Layout.jsx';
import Home, { ssr as homeSsr } from './pages/Home.jsx';
import FindTutors, { ssr as findSsr } from './pages/FindTutors.jsx';
import TutorProfile, { ssr as profileSsr } from './pages/TutorProfile.jsx';
import PostRequirement from './pages/PostRequirement.jsx';
import Tuitions, { ssr as tuitionsSsr } from './pages/Tuitions.jsx';
import BecomeTutor from './pages/BecomeTutor.jsx';
import { Login, Register } from './pages/Auth.jsx';
import ParentDashboard from './pages/ParentDashboard.jsx';
import TutorDashboard from './pages/TutorDashboard.jsx';
import Admin from './pages/Admin.jsx';
import { HowItWorks, Contact, Terms, NotFound } from './pages/Static.jsx';
import { CitiesIndex, CityPage, citySsr, CitySubjectPage, citySubjectSsr, SubjectPage, subjectSsr } from './pages/SeoPages.jsx';

/**
 * Route table shared by the browser and the server renderer.
 * `ssr` returns the API paths the server should fetch before rendering that page
 * (or { status: 404 } for unknown slugs). The settings call is always prefetched.
 */
export const routes = [
  {
    element: <Layout />,
    children: [
      { index: true, element: <Home />, ssr: homeSsr },
      { path: 'tutors', element: <FindTutors />, ssr: findSsr },
      { path: 'tutors/:id', element: <TutorProfile />, ssr: profileSsr, required: true },
      { path: 'home-tuition', element: <CitiesIndex /> },
      { path: 'home-tuition/:city', element: <CityPage />, ssr: citySsr },
      { path: 'home-tuition/:city/:subject', element: <CitySubjectPage />, ssr: citySubjectSsr },
      { path: 'tuition/:subject', element: <SubjectPage />, ssr: subjectSsr },
      { path: 'post-requirement', element: <PostRequirement /> },
      { path: 'tuitions', element: <Tuitions />, ssr: tuitionsSsr },
      { path: 'become-a-tutor', element: <BecomeTutor /> },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'how-it-works', element: <HowItWorks /> },
      { path: 'contact', element: <Contact /> },
      { path: 'terms', element: <Terms /> },
      { path: 'dashboard/parent', element: <RequireRole roles={['parent']}><ParentDashboard /></RequireRole> },
      { path: 'dashboard/tutor', element: <RequireRole roles={['tutor']}><TutorDashboard /></RequireRole> },
      { path: 'admin', element: <RequireRole roles={['admin']}><Admin /></RequireRole> },
      { path: '*', element: <NotFound />, notFound: true },
    ],
  },
];
export const ALWAYS_PREFETCH = [SETTINGS_KEY];

export default function App() {
  const element = useRoutes(routes);
  useEffect(() => markHydrated(), []);
  return <AuthProvider>{element}</AuthProvider>;
}
