//INITIALIZE SPEEDTEST
var s = new Speedtest(); //create speedtest object

var meterBk = /Trident.*rv:(\d+\.\d+)/i.test(navigator.userAgent) ? "#EAEAEA" : "#80808040";
var dlColor = "#6060AA",
    ulColor = "#616161";
var progColor = meterBk;

var speedValues = { downloadSpeed: "", uploadSpeed: "", clientId: " " };
var clientIdToGetHistory = { clientId: "" };
var downloadSpeed;
var uploadSpeed;
var pageClientId = " ";
var valuesToSetInHistory = [];

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
        if (darkModePage) {
            let startStopButton = I("startStopBtn");
            startStopButton.className = "startDarkMode";
            if (pageLanguage === "pt-br") {
                startStopButton.innerHTML = allTranslations.langStart.pt_br.valueOf();
            } else {
                startStopButton.innerHTML = allTranslations.langStart.eng.valueOf();
            }
        } else {
            let startStopButton = I("startStopBtn");
            startStopButton.className = "";
            if (pageLanguage === "pt-br") {
                startStopButton.innerHTML = allTranslations.langStart.pt_br.valueOf();
            } else {
                startStopButton.innerHTML = allTranslations.langStart.eng.valueOf();
            }
        }
        initUI();
    } else {
        //test is not running, begin
        let startStopBtn = I("startStopBtn");
        startStopBtn.className = "running"; // the button turns into running mode
        askNotificationPermission();

        if (pageLanguage === "pt-br") {
            startStopBtn.innerHTML = allTranslations.langAbort.pt_br.valueOf();
        } else {
            startStopBtn.innerHTML = allTranslations.langAbort.eng.valueOf();
        }
        s.onupdate = function(data) {
            uiData = data; //on each speedtest update the uiData gets the data 
            downloadSpeed = Number(uiData.dlStatus);
            uploadSpeed = Number(uiData.ulStatus);
        };
        s.onend = function(aborted) {
            speedValues.downloadSpeed = downloadSpeed;
            speedValues.uploadSpeed = uploadSpeed;
            if (pageClientId !== " ") {
                speedValues.clientId = pageClientId;
            }
            sendSpeedsToHistory(speedValues);
            getHistory();

            if (darkModePage) {
                I("startStopBtn").className = "startDarkMode";
            } else {
                I("startStopBtn").className = "startButton";
            }
            if (pageLanguage === "pt-br") {
                startStopBtn.innerHTML = allTranslations.langStart.pt_br.valueOf();
            } else {
                startStopBtn.innerHTML = allTranslations.langStart.eng.valueOf();
            }

            updateUI(true);
        };
        s.start();
    }
}

function sendSpeedsToHistory(speeds) {
    console.log("Donwload speed: " + speeds.downloadSpeed);
    console.log("Upload speed: " + speeds.uploadSpeed);
    var http = new XMLHttpRequest();
    var url = 'http://localhost:8888/saveHistory';
    http.open('POST', url, true);
    //Send the proper header information along with the request
    http.setRequestHeader('Content-type', "application/json;charset=UTF-8");
    http.onreadystatechange = function() { //Call a function when the state changes.
        if (http.readyState == 4 && http.status == 200) {
            var text;
            if (pageLanguage === "pt-br") {
                text = 'Speed Test finalizado';
            } else {
                text = 'Speed Test has ended';
            }
            var notification = new Notification('SpeedTest', { body: text });
        }
    }
    http.send(JSON.stringify(speeds));
}

function getHistory() {
    var http = new XMLHttpRequest();
    var url = 'http://localhost:8888/getHistory';
    http.open('POST', url, true); //POST BECAUSE WE NEED TO SEND THE ID TO THE SERVER
    //Send the proper header information along with the request
    http.setRequestHeader('Content-type', "application/json;charset=UTF-8");
    http.onreadystatechange = function() { //Call a function when the state changes.
        if (http.readyState == 4 && http.status == 200) {
            console.log(http.responseText + " da resposta");
            if (http.responseText == "Couldn't find id") {
                if (pageLanguage == "pt-br") {
                    alert("Não há um ID compatível")
                } else {
                    alert("This ID doesn't exist");
                }
            } else {
                let downloadValueToDisplay = JSON.stringify(http.responseText.split(":")[2].split(",")[0]);
                let uploadValueToDisplay = JSON.stringify(http.responseText.split(":")[3]);
                downloadValueToDisplay = downloadValueToDisplay.split('"')[1].replace(/\\/, " ");
                uploadValueToDisplay = uploadValueToDisplay.split('"')[1].replace(/\\/, " ");
                var historyParent = document.getElementById("showHistory");
                var newRow = document.createElement('tr');
                var newDownloadTd = document.createElement('td');
                var newUploadTd = document.createElement('td');
                newDownloadTd.innerHTML = downloadValueToDisplay;
                newUploadTd.innerHTML = uploadValueToDisplay;
                historyParent.appendChild(newRow);
                newRow.appendChild(newDownloadTd);
                newRow.appendChild(newUploadTd);
            }
        }
    }
    if (pageClientId != " ") {
        clientIdToGetHistory.clientId = pageClientId;
        http.send(JSON.stringify(clientIdToGetHistory));
    } else {
        if (pageLanguage == "pt-br") {
            alert("Histórico não computado pois não foi digitado um ID")
        } else {
            alert("History not computed because no ID was typed");
        }
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



//start the page translation

var languagesAvaliable = document.getElementsByName('flags'); //languages avaliable in the page

var allTranslations = getLanguages(); //getes the translations int the languages script
var pageLanguage = "pt-br"; // initializes the page in pt-br

var brazilianFlag = document.getElementById("brazilianFlagImage"); //gets the brazilian flag
brazilianFlag.style.filter = "saturate(300%)"; //makes it visible default
var americanFlag = document.getElementById("americanFlagImage"); //gets the american flag
americanFlag.style.filter = "saturate(50%)";

for (let index = 0; index < languagesAvaliable.length; index++) { // event lister to check the page language
    languagesAvaliable[index].addEventListener("change", function() { //checks for user language
        pageLanguage = languagesAvaliable[index].value;
        if (pageLanguage == "pt-br") {
            brazilianFlag.style.filter = "saturate(300%)"; //turns brazilian flag as default
            americanFlag.style.filter = "saturate(50%)";
            let switchButton = I('langDarkMode');
            switchButton.innerHTML = allTranslations.langDarkMode.pt_br.valueOf();
            let mainTitle = I("mainTitle");
            mainTitle.innerHTML = allTranslations.langSpeedTest.pt_br.valueOf();
            let startStopBtn = I("startStopBtn");
            startStopBtn.innerHTML = allTranslations.langStart.pt_br.valueOf(); //on opening the page translates the button
            let sourceCodeLink = I("sourceCodeLink");
            sourceCodeLink.innerHTML = allTranslations.langSourceCode.pt_br.valueOf(); //translates the source code link
            let historyTitle = I("historyTitle");
            historyTitle.innerHTML = allTranslations.langConnectionHistory.pt_br.valueOf();
        } else {
            americanFlag.style.filter = "saturate(300%)"; //turns american flag as default
            brazilianFlag.style.filter = "saturate(50%)";
            let switchButton = I('langDarkMode');
            switchButton.innerHTML = allTranslations.langDarkMode.eng.valueOf();
            let mainTitle = I("mainTitle");
            mainTitle.innerHTML = allTranslations.langSpeedTest.eng.valueOf();
            let startStopBtn = I("startStopBtn");
            startStopBtn.innerHTML = allTranslations.langStart.eng.valueOf(); //on opening the page
            let sourceCodeLink = I("sourceCodeLink");
            sourceCodeLink.innerHTML = allTranslations.langSourceCode.eng.valueOf();
            let historyTitle = I("historyTitle");
            historyTitle.innerHTML = allTranslations.langConnectionHistory.eng.valueOf();
        }
    })
}

//checks dark mode page

var darkModePage = false; //starts the page in light mode

function getDarkModePage() {
    return darkModePage;
}

var darkModeSwitch = I("darkModeSwitch");
darkModeSwitch.addEventListener('change', function() {
    if (this.checked) {
        darkModePage = true;
        let body = document.getElementsByTagName('body')[0];
        body.className = 'darkModeBody';
        let link = I('sourceCodeLink');
        link.style.color = "#eee";
        let startButton = I('startStopBtn');
        startButton.className = "startDarkMode";

    } else {
        darkModePage = false;
        let body = document.getElementsByTagName('body')[0];
        body.className = '';
        let link = I('sourceCodeLink');
        link.style.color = "";
        let startButton = I('startStopBtn');
        startButton.className = "startButton";
    }
});

window.onload = function() { //checks if the user has ID to show history
    var wantHistory = confirm("Deseja receber histórico?");
    if (wantHistory) {
        var hasId = confirm("Já possui ID? Caso negativo, cancele");
        if (hasId) {
            var inputId = I('clientId');
            inputId.style.display = "inline-block";
            var buttonId = I('buttonId');
            buttonId.style.display = "inline-block";
            inputId.addEventListener('keyup', function() {
                pageClientId = inputId.value;
                console.log(pageClientId);
            });
            buttonId.addEventListener('click', function() {
                if (pageClientId == " ") {
                    alert("Digite um ID")
                } else {
                    console.log("setei ID");
                    setId(pageClientId);
                    getHistory(pageClientId);
                }
            })
        } else {
            let yourId = Math.floor(Math.random() * 100);
            alert("Seu ID é: " + yourId);
            setId(yourId);
        }
    }
}

function setId(clientId) {
    pageClientId = String(clientId);
    speedValues.clientId = String(clientId);
}