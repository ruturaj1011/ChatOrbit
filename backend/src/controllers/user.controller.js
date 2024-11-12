import httpStatus from "http-status";
import { User } from "../models/userModel.js";
import bcrypt, {hash} from "bcrypt";
import crypto from "crypto";

const login = async (req, res) => {

    const {username , password} = req.body;

    if(!username || !password){
        return res.status(400).json({message : "Please Provide Details"});
    }

    try{

        const user = await User.findOne({username});

        if(!user){
            return res.status(httpStatus.NOT_FOUND).json({message : "User Not Found"});
        }

        let isPassword = await bcrypt.compare(password, user.password);
        
        if(isPassword){

            let token = crypto.randomBytes(20).toString("hex");

            user.token = token;
            await user.save();

            return res.status(httpStatus.OK).json({token : token});
        }
        else{
            return res.status(httpStatus.UNAUTHORIZED).json({message:"Invalid Username or Password"});
        }

    }
    catch(e){
        return res.status(500).json({message : `Something went wrong! ${e}`});
    }
}

const register = async (req, res) => {

    const {name, username, password } = req.body;

    try{

        const existingUser = await User.findOne( {username} );

        if(existingUser){
            return res.status(httpStatus.FOUND).json( {message : "User already exists"} );
        }

        const hashedPassword = await bcrypt.hash(password, 11);

        const newUser = new User( {

            name : name,
            username : username,
            password : hashedPassword
        } );

        await newUser.save();

        res.status(httpStatus.CREATED).json({message : "User Registered Successfully"});
    }
    catch(e){
        res.json({message : `Something went wrong! ${e}`});
    }
}

export {login, register};