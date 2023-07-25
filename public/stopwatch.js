let seconds = 0, minutes = 0, hours = 0;
let display = document.getElementById("display");
let interval = null;
let status = "stopped";

function stopwatch() {
    seconds++; 

    if (seconds / 60 === 1) {
        seconds = 0;
        minutes++;

        if (minutes / 60 === 1) {
            minutes = 0;
            hours++;
        }
    }

    display.innerHTML = (hours ? (hours > 9 ? hours : "0" + hours) : "00") + ":" + (minutes ? (minutes > 9 ? minutes : "0" + minutes) : "00") + ":" + (seconds > 9 ? seconds : "0" + seconds);
}

document.getElementById("start").addEventListener("click", function() {
    if(status === "stopped"){
        interval = window.setInterval(stopwatch, 1000);
        document.getElementById("start").innerHTML = "Pause";
        status = "started";
    } else {
        window.clearInterval(interval);
        document.getElementById("start").innerHTML = "Resume";
        status = "stopped";
    }
});

document.getElementById("stop").addEventListener("click", function() {
    window.clearInterval(interval);
    document.getElementById("start").innerHTML = "Start";
    status = "stopped";

    seconds = 0;
    minutes = 0;
    hours = 0;
    display.innerHTML = "00:00:00";
});
