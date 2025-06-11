import multer from 'multer';

const storage = multer.diskStorage({
    destination: function   (req, file, cb) {
        cb(null, './public/temp'); // Specify the directory to save uploaded files
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

export const upload = multer({ storage: storage });
