const waterGoal = document.getElementsByClassName("waterGoal");
const calGoal = document.getElementById("calGoal");
const calIntake = document.getElementsByClassName("intake");
const calBurnt = document.getElementsByClassName("burnt");
const calSum = document.getElementById("sum");
const meter = document.getElementById("meter");
const water = document.getElementById("water");
const message = document.getElementById("message");

window.onload = function() {
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
        }
        calGoal.innerHTML = data.calorie_goal;
        //update meter max to users water goal
        meter.max = data.water_goal;
        //update both water goal elements(bar end,summary)
        waterGoal[0].innerHTML = data.water_goal;
        waterGoal[1].innerHTML = data.water_goal;        
    });

    //get user's today stats and update page
    fetch('/getUserStats', {
        method: 'POST',
        headers: {
            "Content-Type": 'application/json'
        },
        body: JSON.stringify({ dayModifier: 0 })
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