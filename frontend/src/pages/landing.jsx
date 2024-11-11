import React from 'react';
import {Link} from "react-router-dom";
import "../App.css";

function LandingPage() {
    return ( 

        <div className='landingPage-cont'>

            <nav className='landingPage-navbar'>

                <div className='navHeader'>
                    <h2>ChatOrbit</h2>
                </div>

                <div className='navList'>

                    <p>Join as Guest</p>
                    <p>Register</p>
                    <div role='button'>
                        <p>Login</p>
                    </div>

                </div>
            </nav>

            <div className="landingPage-mainCont">

                <div>

                    <h1><span style={{color:"#ff9839"}}>Connect</span> wiith your Loved Once</h1>
                    <p>Cover a distance by ChatOrbit</p>

                    <div role='button'>

                        <Link to="/home">Get Started</Link>
                    </div>
                </div>
                <div>

                    <img src="mobile.png" alt="mainCont-img" />
                </div>
            </div>
        </div>
    );
}

export default LandingPage;