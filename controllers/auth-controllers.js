const User = require('../models/User.js')
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken')

// register controller

const registerUser = async(req,res)=>{
  try{
    // extract user information from our request body that is from the frontend
    const {username,email,password,role} = req.body;
    // check if user is already exists in our database
    const checkExistingUser = await User.findOne({$or:[{username},{email}]});
    if(checkExistingUser){
      return res.status(400).json({
        success : false,
        message : "User is already exists with same username or with the same email.Please try with the different username or email"
      });
    }

    // hash user password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password,salt)

    // create a new user and save in your database

    const newlyCreatedUser = new User({
      username,
      email,
      password : hashedPassword,
      role:role ||'user'
    })

    await newlyCreatedUser.save();
    if(newlyCreatedUser){
      res.status(201).json({
        success:true,
        message:'User registered successfully !'
      })
    }
    else{
      res.status(400).json({
        success:false,
        message:'Unable to register User ! Please try again.'
      })
    }

  }
  catch(e){
    console.log(e);
    res.status(500).json({
      success:false,
      message:'Some error occured ! Please try again later',
    })
  }
};


// login controller

const loginUser = async(req,res)=>{
  try{
    const {username,password} = req.body;

    // find if the current user exists with this username  in database or not
    const user = await User.findOne({username});
    if(!user){
      return res.status(400).json({
        success:false,
        message:`User does not exist`
      })
    }

    // if the password in database correctly matched or not
    const isPasswordMatch = await bcrypt.compare
    (password,user.password)

      if(!isPasswordMatch){
        return res.status(400).json({
        success:false,
        message:'Invalid credentials '
      })
    }
    // bearer token it means it bear the credentials
    // create the user token 
    const accessToken = jwt.sign({
      userId:user._id,
      username:user.username,
      role:user.role

    },process.env.JWT_SECRET_KEY,{
      expiresIn : '1m'
    })

    res.status(200).json({
      success : true,
      message : 'Logged in successful',
      accessToken
    })

  }
  catch(e){
    console.log(e);
    res.status(500).json({
      success:false,
      message:'Some error occured ! Please try again later',
    })
  }
};

const changePassword = async(req,res)=>{
  try{
    const userId = req.userInfo.userId;

    // extract old and new password

    const {oldPassword,newPassword} = req.body;

    // find the current logged user
    const user = await User.findById(userId);

    if(!user){
      return res.status(400).json({
        success:false,
        mesaage:'user not found'
      })
    }

    // if old password is correct

    const isPasswordMatch = await bcrypt.compare(oldPassword,user.password);

    if(!isPasswordMatch){
      return res.status(400).json({
        success:false,
        message:"old password is not corrrect ! please try with correct password",
      });
    }

    // hash the new password here

    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword,salt);

    // update the user password
    user.password = newHashedPassword
    await user.save();

    res.status(200).json({
      success:true,
      message:'password changed successfully'
    });
  }
  catch(e){
    console.log(e);
    res.status(500).json({
      success:false,
      message:'Some error occured ! Please try again later',
    })
  }
 
}

module.exports = {registerUser,loginUser,changePassword};
