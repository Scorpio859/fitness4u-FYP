document.getElementById("registerForm").addEventListener('submit', (event) => {
    //prevent page reload
    event.preventDefault();
    
    //get input values(trimed to remove trailing whitespaces)
    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    //element for showing messages
    const message = document.getElementById("message");

    //check form values are present
    if (!username || !email || !password) {
        //update text and show message
        message.innerHTML = "Please fill in all parts";
        handleMessageRed();
        return;
    }

    fetch("/registerUser", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ username: username, email: email, password: password})
    })
    .then(response => {
        return response.json()
    })
    .then(data => {
        //handle various responses
        if (data.registered) { //successful registration
            //update message text and styling, then make it visible
            message.innerHTML = "Registration Successful Please go to Login";
            handleMessageGreen();
        } else if (data.isEmailTaken) { //email already registered
            //update message element
            message.innerHTML = "Email already taken! Please Login";
            handleMessageRed();
        } else if (data.isUsernameTaken) { //username already in use
            //update message element
            message.innerHTML = "Username taken! Please enter other username";
            handleMessageRed();
        } else { //other issue
            //update message element
            message.innerHTML = "Registration failed please try again!";
            handleMessageRed();
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
    //wait 3s and hide the message again
    setTimeout(() => {
        message.classList.add("invisible");
    }, 3000);
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
//wait 3s and hide the message again
setTimeout(() => {
    message.classList.add("invisible");
}, 3000);
return;
}