//INITIALIZE SPEEDTEST
var s = new Speedtest(); //create speedtest object

var meterBk = /Trident.*rv:(\d+\.\d+)/i.test(navigator.userAgent) ? "#EAEAEA" : "#80808040";
var dlColor = "#6060AA",
    ulColor = "#616161";
var progColor = meterBk;

var objetoDeHistorico = { velocidadeDownload: "", velocidadeUpload: "", idCliente: " " };
var clienteParaPegarHistorico = { idDoCliente: "" };
var velocidadeDownload;
var velocidadeUpload;
var idPagina = " ";
var valoresParaSetarNoHistorico = [];

function I(i) {
    return document.getElementById(i);
}

//CODE FOR GAUGES
function drawMeter(c, amount, bk, fg, progress, prog) {
    var ctx = c.getContext("2d");
    var dp = window.devicePixelRatio || 1;
    var cw = c.clientWidth * dp,
        ch = c.clientHeight * dp; //clieentwidth and clientheight 
    var sizScale = ch * 0.0055;
    if (c.width == cw && c.height == ch) {
        ctx.clearRect(0, 0, cw, ch);
    } else {
        c.width = cw;
        c.height = ch;
    }
    ctx.beginPath();
    ctx.strokeStyle = bk;
    ctx.lineWidth = 12 * sizScale;
    ctx.arc(c.width / 2, c.height - 58 * sizScale, c.height / 1.8 - ctx.lineWidth, -Math.PI * 1.1, Math.PI * 0.1);
    ctx.stroke();
    ctx.beginPath();
    ctx.strokeStyle = fg;
    ctx.lineWidth = 12 * sizScale;
    ctx.arc(c.width / 2, c.height - 58 * sizScale, c.height / 1.8 - ctx.lineWidth, -Math.PI * 1.1, amount * Math.PI * 1.2 - Math.PI * 1.1);
    ctx.stroke();
    if (typeof progress !== "undefined") {
        ctx.fillStyle = prog;
        ctx.fillRect(c.width * 0.3, c.height - 16 * sizScale, c.width * 0.4 * progress, 4 * sizScale);
    }
}

function mbpsToAmount(s) {
    return 1 - (1 / (Math.pow(1.3, Math.sqrt(s))));
}

function format(d) {
    d = Number(d);
    if (d < 10) return d.toFixed(2);
    if (d < 100) return d.toFixed(1);
    return d.toFixed(0);
}


//UI CODE
var uiData = null;

function startStop() {
    if (s.getState() == 3) {
        //speedtest is running, abort
        s.abort();
        data = null;
        if (paginaEscura) {
            let botaoIniciar = I("startStopBtn");
            botaoIniciar.className = "botaoModoEscuro";            
        } else {
            let botaoIniciar = I("startStopBtn");
            botaoIniciar.className = "";            
        }
        botaoIniciar.innerHTML = "Iniciar";
        initUI();
    } else {
        //test is not running, begin
        let botaoIniciar = I("startStopBtn");
        botaoIniciar.className = "running"; // the button turns into running mode
        botaoIniciar.innerHTML = "Parar";
        askNotificationPermission();
        s.onupdate = function(data) {
            uiData = data; //on each speedtest update the uiData gets the data 
            velocidadeDownload = Number(uiData.dlStatus);
            velocidadeUpload = Number(uiData.ulStatus);
        };
        s.onend = function(aborted) {
            objetoDeHistorico.velocidadeDownload = velocidadeDownload;
            objetoDeHistorico.velocidadeUpload = velocidadeUpload;
            if (idPagina !== " ") {
                objetoDeHistorico.idCliente = idPagina;
            }
            enviaOsDadosParaHistorico(objetoDeHistorico);
            pegaHistorico();

            if (paginaEscura) {
                I("startStopBtn").className = "botaoModoEscuro";
            } else {
                I("startStopBtn").className = "botaoNormal";
            }
            botaoIniciar.innerHTML = "Iniciar";
           
            updateUI(true);
        };
        s.start();
    }
}

function enviaOsDadosParaHistorico(velocidades) {
    var http = new XMLHttpRequest();
    var url = 'http://localhost:8888/salvarHistorico';
    http.open('POST', url, true);
    //Send the proper header information along with the request
    http.setRequestHeader('Content-type', "application/json;charset=UTF-8");
    http.onreadystatechange = function() { //Call a function when the state changes.
        if (http.readyState == 4 && http.status == 200) {
            var text = "Speedtest Finalizado";
            var notification = new Notification('SpeedTest', { body: text });
        }
    }
    http.send(JSON.stringify(velocidades));
}

function pegaHistorico() {
    var http = new XMLHttpRequest();
    var url = 'http://localhost:8888/pegaHistorico';
    http.open('POST', url, true); //POST BECAUSE WE NEED TO SEND THE ID TO THE SERVER
    //Send the proper header information along with the request
    http.setRequestHeader('Content-type', "application/json;charset=UTF-8");
    http.onreadystatechange = function() { //Call a function when the state changes.
        if (http.readyState == 4 && http.status == 200) {
            if (http.responseText == "Não achou um ID válido") {
                alert("Não achou um ID válido");
            } else {
                let downloadParaMostrar = JSON.stringify(http.responseText.split(":")[2].split(",")[0]);
                let uploadParaMostrar = JSON.stringify(http.responseText.split(":")[3]);
                downloadParaMostrar = downloadParaMostrar.split('"')[1].replace(/\\/, " ");
                uploadParaMostrar = uploadParaMostrar.split('"')[1].replace(/\\/, " ");
                var historicoPai = document.getElementById("mostraHistorico");
                var novaLinha = document.createElement('tr');
                var downloadtd = document.createElement('td');
                var uploadTd = document.createElement('td');
                downloadtd.innerHTML = downloadParaMostrar;
                uploadTd.innerHTML = uploadParaMostrar;
                historicoPai.appendChild(novaLinha);
                novaLinha.appendChild(downloadtd);
                novaLinha.appendChild(uploadTd);
            }
        }
    }
    if (idPagina != " ") {
        clienteParaPegarHistorico.idDoCliente = idPagina;
        http.send(JSON.stringify(clienteParaPegarHistorico));
    } else {
        alert("Seu histórico não foi salvo pois um ID não estava inserido na página")
        http.abort();
    }
}



function checkNotificationPromise() {
    try {
        Notification.requestPermission().then();
    } catch (e) {
        return false;
    }

    return true;
}

function askNotificationPermission() {
    // function to actually ask the permissions
    function handlePermission(permission) {
        // set the button to shown or hidden, depending on what the user answers
        if (Notification.permission === 'denied' || Notification.permission === 'default') {
            notificationBtn.style.display = 'block';
        } else {
            notificationBtn.style.display = 'none';
        }
    }

    // Let's check if the browser supports notifications
    if (!('Notification' in window)) {
        console.log("This browser does not support notifications.");
    } else {
        if (checkNotificationPromise()) {
            Notification.requestPermission()
                .then((permission) => {
                    handlePermission(permission);
                })
        } else {
            Notification.requestPermission(function(permission) {
                handlePermission(permission);
            });
        }
    }
}


//this function reads the data sent back by the test and updates the UI
function updateUI(forced) {
    if (!forced && s.getState() != 3) return;
    if (uiData == null) return;
    var status = uiData.testState;
    I("ip").textContent = uiData.clientIp;

    I("dlText").textContent = (status == 1 && uiData.dlStatus == 0) ? "..." : format(uiData.dlStatus);
    drawMeter(I("dlMeter"), mbpsToAmount(Number(uiData.dlStatus * (status == 1 ? oscillate() : 1))), meterBk, dlColor, Number(uiData.dlProgress), progColor);


    I("ulText").textContent = (status == 3 && uiData.ulStatus == 0) ? "..." : format(uiData.ulStatus);
    drawMeter(I("ulMeter"), mbpsToAmount(Number(uiData.ulStatus * (status == 3 ? oscillate() : 1))), meterBk, ulColor, Number(uiData.ulProgress), progColor);

    I("pingText").textContent = format(uiData.pingStatus);
    I("jitText").textContent = format(uiData.jitterStatus);
}



function oscillate() {
    return 1 + 0.02 * Math.sin(Date.now() / 100);
}
//update the UI every frame
window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame || (function(callback, element) {
    setTimeout(callback, 1000 / 60);
});


function frame() {
    requestAnimationFrame(frame);
    updateUI();
}
frame(); //start frame loop
//function to (re)initialize UI
function initUI() {
    drawMeter(I("dlMeter"), 0, meterBk, dlColor, 0);
    drawMeter(I("ulMeter"), 0, meterBk, ulColor, 0);
    I("dlText").textContent = "";
    I("ulText").textContent = "";
    I("pingText").textContent = "";
    I("jitText").textContent = "";
    I("ip").textContent = "";
}
setTimeout(function() {
    initUI()
}, 100);



//checks dark mode page

var paginaEscura = false; //starts the page in light mode

function pegaModoDaPagina() {
    return paginaEscura;
}

var trocaModo = I("trocaModo");
trocaModo.addEventListener('change', function() {
    if (this.checked) {
        paginaEscura = true;
        let body = document.getElementsByTagName('body')[0];
        body.className = 'bodyEscuro';
        let link = I('textoDeLink');
        link.style.color = "#eee";
        let botaoIniciar = I('startStopBtn');
        botaoIniciar.className = "botaoModoEscuro";

    } else {
        paginaEscura = false;
        let body = document.getElementsByTagName('body')[0];
        body.className = '';
        let link = I('textoDeLink');
        link.style.color = "";
        let botaoIniciar = I('startStopBtn');
        botaoIniciar.className = "botaoNormal";
    }
});

window.onload = function() { //checks if the user has ID to show history
    var querHistorico = confirm("Deseja receber histórico?");
    if (querHistorico) {
        var temId = confirm("Já possui ID? Caso negativo, cancele");
        if (temId) {
            var idInput = I('inputIdCliente');
            idInput.style.display = "inline-block";
            var botaoSetaId = I('botaoSetaId');
            botaoSetaId.style.display = "inline-block";

            idInput.addEventListener('keyup', function() {
                idPagina = idInput.value;
            });
            botaoSetaId.addEventListener('click', function() {
                if (idPagina == " ") {
                    alert("Digite um ID")
                } else {
                    setId(idPagina);
                    pegaHistorico();
                }
            })
        } else {
            let seuId = Math.floor(Math.random() * 100);
            alert("Seu ID é: " + seuId);
            setId(seuId);
        }
    }
}

function setId(idCliente) {
    idPagina = String(idCliente);
    objetoDeHistorico.idCliente = String(idCliente);
}