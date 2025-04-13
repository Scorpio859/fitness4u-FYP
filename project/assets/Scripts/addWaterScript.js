const message = document.getElementById("message");
const waterGoal = document.getElementsByClassName("waterGoal");
const meter = document.getElementById("meter");
const water = document.getElementById("water");
const formMessage = document.getElementById("formMessage");

//onload get user stats and goal
window.onload = function() {
    //get user water goal
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
        if (data.water_goal == "????") {
            message.classList.remove("hidden");
            meter.max = 2000;
        } else {
            //update meter max to users water goal
            meter.max = data.water_goal;
        }
        //update both water goal elements(bar end,summary)
        waterGoal[0].innerHTML = data.water_goal;
        waterGoal[1].innerHTML = data.water_goal; 
    });

    updateUserStats();
}

//handling water form
document.getElementById("waterForm").addEventListener('submit', (event) => {
    //prevent reload
    event.preventDefault();

    //get input value
    const options = document.getElementsByName("waterValue");

    //loop through the buttons to find selected one
    for (i=0; i<options.length;i++) {
        if (options[i].checked) {
            //get value of checked button
            var water = options[i].value;
            //check and handle if custom was selected
            if (water == '') {
                water = document.getElementById("customValue").value;
            }

            //fetch add water server function
            fetch("/addWater", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({water: water})
            })
            .then(response => {
                return response.json()
            })
            .then(data => {
                if (data.success) {
                    formMessage.innerHTML = "Water added successfully";
                    handleMessageGreen();
                    //update summary with new stats
                    updateUserStats();

                } else {
                    formMessage.innerHTML = "Failed to add water, Please try again";
                    handleMessageRed();
                }
            })
        } else if (!options[i].checked && i==options.length-1) {
            //no option selected
            formMessage.innerHTML = "Please select an option";
            handleMessageRed();
        }
    }
});

//funciton to handle turning the message green
function handleMessageGreen() {
    //check if message is styled to be red
    if (formMessage.classList.contains("bg-red-200", "text-red-600")) {
        //remove the red
        formMessage.classList.remove("bg-red-200", "text-red-600");
    }
    //style to be green and make visible
    formMessage.classList.add("bg-green-200", "text-green-600");
    formMessage.classList.remove("invisible");
    //wait 3s and hide the message again
    setTimeout(() => {
        formMessage.classList.add("invisible");
    }, 3000);
    return;
}

function handleMessageRed() {
    //check if message is styled to be green
    if (formMessage.classList.contains("bg-green-200", "text-green-600")) {
        //remove the green
        formMessage.classList.remove("bg-green-200", "text-green-600");
    }
    //style to be red and make visible
    formMessage.classList.add("bg-red-200", "text-red-600");
    formMessage.classList.remove("invisible");
    //wait 3s and hide the message again
    setTimeout(() => {
        formMessage.classList.add("invisible");
    }, 3000);
    return;
}

function updateUserStats() {
    //get user stats
    fetch('/getUserStats', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ dayModifier: 0 })
    }).then(response => {
        return response.json();
    }).then(data => {
        //update meter progress
        meter.value = data.water;
        //update water intake
        water.innerHTML = data.water;
    });
}