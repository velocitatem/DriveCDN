const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const app = express();
const fs = require('fs');
const axios = require('axios');
const stream = require('stream');
const PORT = process.env.PORT || 3000;
// import streaming

const download = async (url, path, outputStream) => {
    // extract no matter what
    const fileId = url.split('/')[5];
    // try to find the file already in the cache
    if (fs.existsSync(path)) {
        console.log("File already exists");
        // send the file
        fs.createReadStream(path).pipe(outputStream);
        return;
    }
    let newUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
    axios({
        method: 'get',
        url: newUrl,
        responseType: 'stream'
    })
        .then(function (response) {
            const passThrough = new stream.PassThrough();
            response.data.pipe(passThrough);
            passThrough.pipe(outputStream);
            passThrough.pipe(fs.createWriteStream(path));
        });
};

const saveLink = async (url, path) => {
    sqlite3.verbose();
    let db = new sqlite3.Database('db.sqlite3', (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Connected to the database.');
    });
    let sql = `INSERT INTO links (url, path) VALUES (?, ?)`;
    await db.run(sql, [url, path], function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log(`Row inserted`);
    });
    await db.close();
    return path;
}


const getLink = async (path) => {
    sqlite3.verbose();
    let db = await new sqlite3.Database('db.sqlite3', (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Connected to the database.');
    });
    let sql = `SELECT url FROM links WHERE path = ?`;
    let url = await new Promise((resolve, reject) => {
        db.get(sql, [path], (err, row) => {
            if (err) {
                reject(err);
            }
            resolve(row.url);
        });
    });
    await db.close();
    return url;
}



app.get("/track/file", async (req, res) => {
    // passed as ?url=...
    let url = req.query.url;
    let path = uuidv4();
    path = await saveLink(url, path);
    res.send(`http://localhost:${PORT}/get/${path}`);
});

// route to get the raw data
// EX: http://localhost:3000/workflow
app.get("/get/:key", async (req, res) => {
    let path = req.params.key;
    let link = await getLink(path);
    console.log(path, link);
    if (link) {
        let path = uuidv4();
        download(link, path, res);
    }
    else {
        res.send("Not found");
    }

});


// create table if not exists
let db = new sqlite3.Database('db.sqlite3', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the database.');
});
let sql = `CREATE TABLE IF NOT EXISTS links (
    url text,
    path text
);`;
db.run(sql, [], function (err) {
    if (err) {
        return console.error(err.message);
    }
    console.log(`Table created`);
});
db.close();


app.listen(PORT, () => {
    console.log("Listening on port 3000");
});
