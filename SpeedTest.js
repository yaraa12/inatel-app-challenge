const express = require('express');
const Server = express();
const randomBytes = require('random-bytes');
const path = require('path');
const request = require('request');
const helpers = require('./Helpers');
const cors = require('cors');
const stream = require('stream');
const fs = require('fs');
const bodyParser = require('body-parser');
const readline = require('readline');
Server.use(bodyParser.urlencoded());
Server.use(bodyParser.urlencoded({ extended: false }));
Server.use(bodyParser.json());

let cache;

Server.use(cors());

Server.get('/empty', function(req, res) {
    res.status(200).send('');
});

Server.post('/empty', function(req, res) {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.set("Cache-Control", "post-check=0, pre-check=0");
    res.set("Pragma", "no-cache");
    res.status(200).send('');
});

Server.get('/garbage', function(req, res) {
    res.set('Content-Description', 'File Transfer');
    res.set('Content-Type', 'application/octet-stream');
    res.set('Content-Disposition', 'attachment; filename=random.dat');
    res.set('Content-Transfer-Encoding', 'binary');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    res.set('Cache-Control', 'post-check=0, pre-check=0', false);
    res.set('Pragma', 'no-cache');
    const requestedSize = (req.query.ckSize || 100);

    const send = () => {
        for (let i = 0; i < requestedSize; i++)
            res.write(cache);
        res.end();
    }

    if (cache) {
        send();
    } else {
        randomBytes(1048576, (error, bytes) => {
            cache = bytes;
            send();
        });
    }

});

Server.get('/getIP', function(req, res) {
    let requestIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.headers['HTTP_CLIENT_IP'] || req.headers['X-Real-IP'] || req.headers['HTTP_X_FORWARDED_FOR'];
    if (requestIP.substr(0, 7) === "::ffff:") {
        requestIP = requestIP.substr(7)
    }
    request('https://ipinfo.io/' + requestIP + '/json', function(err, body, ipData) {
        ipData = JSON.parse(ipData);
        if (err) res.send(requestIP);
        else {
            request('https://ipinfo.io/json', function(err, body, serverData) {
                serverData = JSON.parse(serverData);
                if (err) res.send(`${requestIP} - ${ipData.org}, ${ipData.country}`);
                else if (ipData.loc && serverData.loc) {
                    const d = helpers.calcDistance(ipData.loc.split(','), serverData.loc.split(','));
                    res.send(`${requestIP} - ${ipData.org}, ${ipData.country} (${d}km)`);
                } else {
                    res.send(`${requestIP} - ${ipData.org}, ${ipData.country}`);
                }
            })
        }
    });
});


Server.post("/saveHistory", function(req, res) {
    var donwloadToHistory = "Download Speed: ";
    var uploadToHistory = "Upload Speed: ";
    var myData = "";
    let filename = __dirname + "/public/history.txt";

    // This line opens the file as a readable stream
    myData += fs.readFileSync(filename, { encoding: 'utf8', flag: 'r' });
    if ((req.body.clientId) !== " ") {
        fs.writeFileSync(filename, req.body.clientId + "\n" + donwloadToHistory + (req.body.downloadSpeed) + "\n" + uploadToHistory + (req.body.uploadSpeed) + "\n" + myData);
    }
    res.send();
});



Server.post("/getHistory", function(req, res) {
    let historyCount = 0;
    let historyValues = { historyValues: [] };
    let filename = __dirname + "/public/history.txt";
    fs.readFileSync(filename, 'utf-8').toString().split(/\r?\n/).forEach(function(line) {

        if (line == (req.body.clientId)) {
            historyCount += 1;
            console.log(line);
        } else if (historyCount > 0 && historyCount <= 3) {
            console.log(line);
            historyValues.historyValues.push(line.toUpperCase());
            historyCount += 1;
        }
    })
    console.log(JSON.stringify(historyValues));
    res.send(historyValues);
});

Server.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 8888;

Server.listen(port, function() {
    console.log('Speedtest Server is up and running!');
});