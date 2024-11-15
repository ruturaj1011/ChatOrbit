import React from 'react';
import {Route, Routes, BrowserRouter as Router} from "react-router-dom";
import LandingPage from './pages/landing';
import Authentication from './pages/authentication';
import { AuthProvider } from './contexts/authContext';
import VideoMeet from './pages/videoMeet';


function App() {

  return (
    <>
      
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>

        <AuthProvider>

        <Routes>

          <Route path='/' element={<LandingPage />}></Route>

          <Route path='/auth' element={<Authentication/>}></Route>

          <Route path='/:url' element={<VideoMeet />}></Route>

        </Routes>

        </AuthProvider>

      </Router>
    </>
  )
}

export default App
