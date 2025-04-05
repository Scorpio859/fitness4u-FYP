const calGoal = document.getElementById("calGoal");
const calIntake = document.getElementsByClassName("intake");
const calBurnt = document.getElementsByClassName("burnt");
const calSum = document.getElementById("sum");
const message = document.getElementById("message");

//onload get user details and stats from db and populate summary
window.onload = function() {
    //get user calorie goal
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
        if (data.calorie_goal == '????') {
            message.classList.remove("hidden");
        }
        calGoal.innerHTML = data.calorie_goal;
    });

    updateUserStats();
}

//on form submit do form validation and send values
document.getElementById("mealForm").addEventListener('submit', (event) => {
    //prevent reload
    event.preventDefault();

    //get form input values
    const name = document.getElementById("mealName").value;
    const cals = document.getElementById("cals").value;
    const carbs = document.getElementById("carbs").value;
    const fats = document.getElementById("fats").value;
    const protein = document.getElementById("protein").value;

    //get message element
    const formMessage = document.getElementById("formMessage");

    //check form validility
    if (!name || !cals || !carbs || !fats || !protein) {
        formMessage.innerHTML = "Please fill in all values";
        handleMessageRed();
        return;
    }

    //fetch add meal server function
    fetch("/addMeal", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
            name: name,
            cals: cals,
            carbs: carbs,
            fats: fats,
            protein: protein })
    })
    .then(response => {
        return response.json()
    })
    .then(data => {
        if (data.success) {
            formMessage.innerHTML = "Meal added successfully";
            handleMessageGreen();
            //update the summary with new stats
            updateUserStats();
        } else {
            formMessage.innerHTML = "Failed to add meal, Please try again";
            handleMessageRed();
        }
    })
})

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
    return;
}

function updateUserStats() {
    //get users stats
    fetch('/getUserStats', {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ dayModifier: 0 })
    }).then(response => {
        return response.json();
    }).then(data => {
        //update calorie intake elements
        calIntake[0].innerHTML = data.cals;
        calIntake[1].innerHTML = data.cals;
        //update calorie burnt elements
        calBurnt[0].innerHTML = data.burnt;
        calBurnt[1].innerHTML = data.burnt;
        //calculate and update calorie sum
        calSum.innerHTML = (data.cals - data.burnt);
    })
}