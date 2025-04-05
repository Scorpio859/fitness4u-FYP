document.getElementById("loginForm").addEventListener('submit', (event) => {
    //prevent page reloding
    event.preventDefault();

    //get form values(trimed to remove trailing whitespaces)
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value.trim();

    //check validity
    if (!email || !password) {
        message.innerHTML = "Please enter both Email and Password";
        handleMessageRed();
        return;
    }
    
    fetch("/loginUser", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: email, password: password})
    })
    .then(response => {
        return response.json()
    })
    .then(data => {
        if (data.isValidPass) {
            message.innerHTML = "You have been logged in!";
            handleMessageGreen();
            //on login redirect to home page
            window.location.href = "/home";
        } else {
            message.innerHTML = "Login Failed! Please check your details";
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