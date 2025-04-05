
//onload get user Details from DB
window.onload = function() {
    fetch('/getDetails', {
        method: "POST",
        headers: {
            "Content-Type": "application/JSON"
        },
        body: JSON.stringify({ user_id: ''})
    }).then(response => {
        return response.json()
    }).then(data => {
        //put retrieved data in corresponding slots
        document.getElementById("age").value = data.age;
        document.getElementById("sex").value = data.sex;
        document.getElementById("height").value = data.height;
        document.getElementById("weight").value = data.weight;
    })
}

document.getElementById("detailsForm").addEventListener('submit', (event) => {
    //prevend page reload
    event.preventDefault();
    
    //get input values
    const age = document.getElementById("age").value;
    const sex = document.getElementById("sex").value;
    const height = document.getElementById("height").value;
    const weight = document.getElementById("weight").value;
    
    //get message element
    const message = document.getElementById("message");
    
    //check validility
    if (!age || !sex || !height ||!weight) {
        message.innerHTML = "Please fill in all details";
        handleMessageRed();
        return;
    }

    fetch("/updateDetails", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ age: age, sex: sex, height: height, weight: weight})
    })
    .then(response => {
        return response.json()
    })
    .then(data => {
        if (data.success) {
            message.innerHTML = "Details updated successfully";
            handleMessageGreen();
        }
    })
});

//funciton to handle turning the message green
function handleMessageGreen() {
//check if message is styled to be red
    if (message.classList.contains("bg-red-200", "text-red-600")) {
        //remove the red
        message.classList.remove("bg-red-200", "text-red-600");
    }
    //style to be green and make visible
    message.classList.add("bg-green-200", "text-green-600");
    message.classList.remove("invisible");
    return;
}

function handleMessageRed() {
//check if message is styled to be green
if (message.classList.contains("bg-green-200", "text-green-600")) {
    //remove the green
    message.classList.remove("bg-green-200", "text-green-600");
}
//style to be red and make visible
message.classList.add("bg-red-200", "text-red-600");
message.classList.remove("invisible");
return;
}