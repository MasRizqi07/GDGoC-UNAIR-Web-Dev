/*
=========================================
VARIABLES
=========================================
*/

const button = document.getElementById("changeColorBtn");

const moodText = document.getElementById("mood");

const lastClickText = document.getElementById("lastClick");

const title = document.getElementById("title");


/*
=========================================
OBJECT
=========================================
*/

const appInfo = {
    appName: "GDGoC DOM Project",
    version: "1.0",
};

console.log(appInfo);


/*
=========================================
FUNCTION
=========================================
*/

function generateRandomColor() {

    const red = Math.floor(Math.random() * 256);

    const green = Math.floor(Math.random() * 256);

    const blue = Math.floor(Math.random() * 256);

    return `rgb(${red}, ${green}, ${blue})`;
}


/*
=========================================
FUNCTION MOOD CHECKER
=========================================
*/

function getBrightness(r, g, b) {

    return (r * 299 + g * 587 + b * 114) / 1000;
}


function updateMood(r, g, b) {

    const brightness = getBrightness(r, g, b);

    if (brightness > 180) {

        moodText.textContent = "😄 Ceria";

    } else if (brightness > 100) {

        moodText.textContent = "😎 Santai";

    } else {

        moodText.textContent = "😴 Mengantuk";

    }
}


/*
=========================================
DATE OBJECT
=========================================
*/

function updateTime() {

    const now = new Date();

    lastClickText.textContent =
        now.toLocaleString("id-ID");
}


/*
=========================================
DOM EVENT
=========================================
*/

button.addEventListener("click", function () {

    const red = Math.floor(Math.random() * 256);

    const green = Math.floor(Math.random() * 256);

    const blue = Math.floor(Math.random() * 256);

    const color = `rgb(${red}, ${green}, ${blue})`;

    document.body.style.backgroundColor = color;

    updateMood(red, green, blue);

    updateTime();

});