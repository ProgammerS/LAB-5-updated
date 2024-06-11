const express = require('express');
const multer = require('multer');
const path = require('path');
const { body, validationResult } = require('express-validator');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Create uploads directory if it doesn't exist
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Set up storage engine for Multer
const storage = multer.diskStorage({
    destination: uploadDir,
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});

// Init upload
const upload = multer({
    storage: storage,
    limits: { fileSize: 9000000 }, // Limit file size to 9MB
    fileFilter: function (req, file, cb) {
        checkFileType(file, cb);
    }
}).single('photo');

// Check file type function
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

// Serve the register.html file
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'register.html'));
});

// Handle POST request with validation and sanitization
app.post('/upload', (req, res, next) => {
    upload(req, res, function (err) {
        if (err) {
            return res.status(400).send(err);
        }

        next();
    });
}, [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('email').isEmail().withMessage('Email is invalid'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
], (req, res) => {
    // Check validation result
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log('Validation Errors:', errors.array());
        return res.status(400).json({ errors: errors.array() });
    }

    if (req.file == undefined) {
        console.log('File Upload Error: No File Selected');
        return res.status(400).send('Error: No File Selected!');
    }

    console.log('Form Data:', req.body);
    console.log('Uploaded File:', req.file);
    res.send('File Uploaded and Data Validated!');
});

app.listen(PORT, () => {
    console.log(`Server started on http://localhost:${PORT}`);
});
