# DriveCDN

Google Drive is not ideal as a CDN, but it's free and fast. This project is a simple way to use Google Drive as a CDN for static files.

## Usage

1. Create a new Google Drive account and upload your static files to it.
1. For each file, create a share link for _anyone_ to view the file. This will give you a link like `https://drive.google.com/file/d/0B2.../view?usp=sharing`.
1. Upload this link to the API give by this project `http://localhost:3000/track/file?url={LINK}`. The API will return a new link that you can use to access the file. This link will look like `http://localhost:3000/get/{LINK}`.
1. Use the new link in your HTML or other code.
