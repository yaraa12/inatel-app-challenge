/* Dark mode ON/OF switch command and colors*/
let checkbox = document.getElementById("switchButton");
checkbox.addEventListener('change', function() {
    if (this.checked) {
        let darkModeDocument = document.getElementsByTagName("body")[0];
        darkModeDocument.style.backgroundColor = "#222222";
        darkModeDocument.style.color = "#ddd";
        let links = document.getElementsByTagName("a");
        for (let index = 0; index < links.length; index++) {
            links[index].style.color = "#ddd";
        }
        let startButton = document.getElementById("startStopBtn");
        startButton.style.backgroundColor = "#6060AA";
        startButton.style.color = "#eee";
        startButton.style.borderColor = "#6060AA";
    } else {
        var darkModeDocument = document.getElementsByTagName("body")[0];
        darkModeDocument.style.backgroundColor = "#eee";
        darkModeDocument.style.color = "#000";
        let links = document.getElementsByTagName("a");
        for (let index = 0; index < links.length; index++) {
            links[index].style.color = "#000";
        }
        let startButton = document.getElementById("startStopBtn");
        startButton.style.backgroundColor = "rgba(0, 0, 0, 0)";
        startButton.style.color = "#6060AA";
        startButton.style.borderColor = "#6060FF";

    }
});