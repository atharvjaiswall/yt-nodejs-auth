const express = require('express');
const authMiddleware = require('../middleware/auth-middleware.js');
const adminMiddleware = require('../middleware/admin-middleware.js');
const uploadMiddleware = require('../middleware/upload-middleware.js')
const {uploadImageController, fetchImagesController,deleteImageController} = require('../controllers/image-controller.js')

const router = express.Router()

// upload the image
router.post("/upload",
  authMiddleware,
  adminMiddleware,
  uploadMiddleware.single("image"),
  uploadImageController);

// to get all the images

router.get('/get',authMiddleware,fetchImagesController);

// delete image route
// 690b361c9fe47bbc990fe247
router.delete('/:id',authMiddleware,adminMiddleware,deleteImageController);

module.exports = router;