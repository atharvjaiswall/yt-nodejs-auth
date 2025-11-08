const Image = require('../models/image.js');
const {uploadToCloudinary} = require('../helpers/cloudinary-helpers')
const fs = require('fs');
const cloudinary = require('../config/cloudinary.js')

const  uploadImageController = async(req,res)=>{
  try{
    // check if file is missing in req object

    if(!req.file){
      return res.status(400).json({
        success:false,
        message:'File is required.Please upload an image'
      });
    }
  
  // upload to cloudinary

  const {url,publicId} = await uploadToCloudinary(req.file.path)

  // store the image url and public id along with the uploaded user id

  const newlyUploadedImage = new Image({
    url,
    publicId,
    uploadedBy:req.userInfo.userId
  })

  await newlyUploadedImage.save();

  // delete the file from local storage
  // fs.unlinkSync(req.file.path);

  res.status(201).json({
    success:true,
    message:'Image uploaded successfully',
    image:newlyUploadedImage
  });

  }
  catch(error){
    console.log(error);
    res.status(500).json({
      success:false,
      message:'Something went wrong ! Please try again'
    })

  }
}

const fetchImagesController = async(req,res)=>{
  try{
    const page = parseInt(req.query.page)|| 1;
    const limit = parseInt(req.query.limit)||2;
    const skip = (page-1)*limit;

    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder==='asc'?1:-1;
    const totalImages = await Image.countDocuments();
    const totalPages = Math.ceil(totalImages/limit);

    const sortObj = {};
    sortObj[sortBy] = sortOrder
    const images = await Image.find().sort(sortObj).skip(skip).limit(limit);

    if(images){
      res.status(200).json({
        success:true,
        currentPage:page,
        totalPages : totalImages,
        totalImages:totalImages,
        data:images,
      });
    }

  }

  catch(error){
    console.log(error);
    res.status(500).json({
      success:false,
      message:"Something went wrong !! Please try again",
    });

  }
};

const deleteImageController = async(req,res)=>{
  try{
    const getCurrentIdOfImageToBeDeleted = req.params.id;
    const userId = req.userInfo.userId;
    const image = await Image.findById(getCurrentIdOfImageToBeDeleted);

    if(!image){
      return res.status(404).json({
        success:false,
        message:'Image not found'
      })
    }

    // check if this is uploaded by current user who is trying to delete the image

    if(image.uploadedBy.toString()!==userId){
      return res.status(403).json({
        success:false,
        message:`You are  not authorized to delete thisnimage becoz this image is not uploaded by you`
      })
    }

    // delete this image first from cloudinary storage

    await cloudinary.uploader.destroy(image.publicId);

    // now we can delete the image from mongodb

    await Image.findByIdAndUpdate(getCurrentIdOfImageToBeDeleted);
    res.status(200).json({
      success:true,
      message:'Image deleted successfully'
    })
  }

  catch(error){
    console.log(error);
    res.status(500).json({
      success:false,
      message:"Something went wrong !! Please try again",
    });
  }
}

module.exports={
  uploadImageController,
  fetchImagesController,
  deleteImageController,
};