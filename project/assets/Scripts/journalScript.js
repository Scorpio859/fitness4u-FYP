const waterGoal = document.getElementsByClassName("waterGoal");
const calGoal = document.getElementById("calGoal");
const calIntake = document.getElementsByClassName("intake");
const calBurnt = document.getElementsByClassName("burnt");
const calSum = document.getElementById("sum");
const meter = document.getElementById("meter");
const water = document.getElementById("water");
const message = document.getElementById("message");
const saveNotes = document.getElementById("saveNotes");

//variable for what day is being looked at(today = 0, yesterday = 1, etc)
var dayModifier = 0;

window.onload = function() {
    //set the date
    setDate();
    
    //get user's goals and update page
    fetch('/getDetails', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ user_id: ''})
    }).then(response => {
        return response.json();
    }).then(data => {
        //check if details are setup
        if (data.calorie_goal == "????" || data.water_goal == "????") {
            message.classList.remove("hidden");
            meter.max = 2000;
        } else {
            //update meter max to users water goal
            meter.max = data.water_goal;
        }
        calGoal.innerHTML = data.calorie_goal;
        //update both water goal elements(bar end,summary)
        waterGoal[0].innerHTML = data.water_goal;
        waterGoal[1].innerHTML = data.water_goal;       
    });

    updateUserStats();

    getJournal();

    //disable next day button
    document.getElementById("nextDay").disabled = true;
}   

//onleft arrow click move back a day
document.getElementById("prevDay").addEventListener('click', function() {
    console.log("prev clicked");
    //decrement day modifier
    dayModifier = dayModifier + 1;
    //update stats and date
    updateUserStats();
    setDate();
    getJournal();
    //re-enable nextday button
    document.getElementById("nextDay").disabled = false;
})

document.getElementById("nextDay").addEventListener('click', function() {
    console.log("next clicked");
    //increment day if > 0 (cant go into future)
    if (dayModifier > 0) {
        dayModifier = dayModifier - 1;
        //update stats and date
        updateUserStats();
        setDate();
        getJournal();    
    } else {
        //modifier on 0 is today so disable button
        document.getElementById("nextDay").disabled = true;
    }
})

document.getElementById("saveNotes").addEventListener('click', function() {
    console.log("notes saved");
    const notes = document.getElementById("notes").value;
    console.log(`sending note: ${notes}`);
    //send notes to database
    fetch('/updateJournal', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            dayModifier: dayModifier,
            notes: notes 
        })
    }).then(response => {
        return response.json()
    }).then(data => {
        if (data.success) {
            saveNotes.innerHTML = "Notes saved";
            saveNotes.classList.remove("bg-purple-600", "hover:bg-purple-700");
            saveNotes.classList.add("bg-green-600", "hover:bg-green-700");
            saveNotes.disabled = true;
            //after 3s delay return button to normal styling
            setTimeout(() => {
                saveNotes.innerHTML = "Save notes"
                saveNotes.classList.remove("bg-green-600", "hover:bg-green-700");
                saveNotes.classList.add("bg-purple-600", "hover:bg-purple-700");
                saveNotes.disabled = false;
            }, 3000);
        }
    })
})

function updateUserStats() {
    //get user's today stats and update page
    fetch('/getUserStats', {
        method: 'POST',
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({ dayModifier: dayModifier})
    })
    .then(response => {
        return response.json()
    })
    .then(data => {
        //updating bith calorie intake elements(summary,solo element)
        calIntake[0].innerHTML = data.cals;
        calIntake[1].innerHTML = data.cals;
        //updating both calorie burnt elements(summary,solo element)
        calBurnt[0].innerHTML = data.burnt;
        calBurnt[1].innerHTML = data.burnt;
        //calculate sum and update it
        calSum.innerHTML = (data.cals - data.burnt);
        //update water bar
        meter.value = data.water;
        //update water intake
        water.innerHTML = data.water;
    });
}

//function to set the date of the journal
function setDate() {
    const date = document.getElementById("date");

    //get todays date and apply day modifier
    let currentDate = new Date();
    currentDate.setDate(currentDate.getDate() - dayModifier);
    date.innerHTML = currentDate.toLocaleDateString('en-GB');

    //if on todays journal
}

//funciton to get users journal entry
function getJournal() {
    fetch('/getJournal', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ dayModifier: dayModifier})
    }).then(response => {
        return response.json();
    }).then(data => {
        //check if notes exist
        if (!data.note) {
            console.log("no note");
            document.getElementById("notes").value = '';
            return;
        } else {
            console.log(`got note: ${data.note}`);
            document.getElementById("notes").value = data.note;
        }
    });
}

//note element read on lload, send to server on un-hover(unfocus)