import React from 'react';
import {Route, Routes, BrowserRouter as Router} from "react-router-dom";
import LandingPage from './pages/landing';


function App() {

  return (
    <>
      
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>

        <Routes>

          <Route path='/' element={<LandingPage />}></Route>

        </Routes>

      </Router>
    </>
  )
}

export default App
