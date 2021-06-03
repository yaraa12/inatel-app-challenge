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


Server.post("/salvarHistorico", function(req, res) {
    var fraseDeDownload = "Download Speed: ";
    var fraseDeUpload = "Upload Speed: ";
    var dado = "";
    let filename = __dirname + "/public/historico.txt";

    // This line opens the file as a readable stream
    dado += fs.readFileSync(filename, { encoding: 'utf8', flag: 'r' });
    if ((req.body.idCliente) !== " ") {
        fs.writeFileSync(filename, req.body.idCliente + "\n" + fraseDeDownload + (req.body.velocidadeDownload) + "\n" + fraseDeUpload + (req.body.velocidadeUpload) + "\n" + dado);
    }
    res.send();
});



Server.post("/pegaHistorico", function(req, res) {
    let contaLinhas = 0;
    let achouId = false;
    let valoresDeHistorico = { valorDeHistorico: [] };
    let filename = __dirname + "/public/historico.txt";
    fs.readFileSync(filename, 'utf-8').toString().split(/\r?\n/).forEach(function(line) {
        if (line == (req.body.idDoCliente)) {
            console.log(req.body.idDoCliente);
            achouId = true;
            contaLinhas += 1;
        } else if (contaLinhas > 0 && contaLinhas <= 2) {
            console.log(line + " server");
            valoresDeHistorico.valorDeHistorico.push(line.toUpperCase());
            contaLinhas += 1;
        }
    })
    console.log(JSON.stringify(valoresDeHistorico));
    if (achouId) {
        res.send(valoresDeHistorico);
    } else {
        res.send("Não achou um ID válido");
    }

});

Server.use(express.static(path.join(__dirname, 'public')));

const port = process.env.PORT || 8888;

Server.listen(port, function() {
    console.log('Speedtest Server is up and running!');
});