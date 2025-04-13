const express = require("express");
const app = express();
const session = require("express-session");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const salt = 10;
const path = require("path");
var { Pool } = require('pg');
require('dotenv').config();

//database connection details
const connectionString = process.env.DATABASE_URL || 
                        `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;
var database = new Pool({
    connectionString,
    //comment out to run dev env
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false
});

//try connect to db
database.connect().then(() => {
    console.log("connected to the database");
    //if connection successful start server
    startServer();
}).catch((error) => {
    console.error("failed to connect to the database: ", error);
});

//start the server
function startServer() {
    //enable json parsing
    app.use(bodyParser.json());
    //setting up session management
    app.use(session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: false,
        cookie: {
            maxAge: 60000 * 15 //let the cookie last for 60000ms(1min) * 15 = (15 mins total)
        }
    }))
    //serve assets folder
    app.use("/assets", express.static(path.join(__dirname, "assets")));

    //serve HTML files
    app.get("/register", function(req, res) {
        res.sendFile(path.join(__dirname, "register.html"));
    });

    app.get("/", function(req, res) {
        res.sendFile(path.join(__dirname, "login.html"));
    });

    app.get("/home", authenticateUser, function(req, res) {
        res.sendFile(path.join(__dirname, "home.html"));
    });

    app.get("/details", authenticateUser, function(req,res) {
        res.sendFile(path.join(__dirname, "userDetails.html"))
    });

    app.get("/addMeal", authenticateUser, function(req, res) {
        res.sendFile(path.join(__dirname, "addMeal.html"));
    });

    app.get("/addWater", authenticateUser, function(req, res) {
        res.sendFile(path.join(__dirname, "addWater.html"));
    });

    app.get("/addExercise", authenticateUser, function(req, res) {
        res.sendFile(path.join(__dirname, "addExercise.html"));
    });    

    app.get("/journal", authenticateUser, function(req, res) {
        res.sendFile(path.join(__dirname, "journal.html"));
    });    

    //fucntion to authenticate the user
    function authenticateUser(req, res, next) {
        //check session for user ID
        if (req.session.userID) {
            //if true user is logged in so can continue
            return next();
        } else {
            //else redirect user to the login page instead
            res.sendFile(path.join(__dirname, "login.html"));
        }
    }

    //function to register a new user
    app.post("/registerUser", async(req, res) => {
        try {
            const {username, email, password} = req.body;
            //check to see if username or email already exists
            const result = await database.query("SELECT username, email FROM fitness4udb.users WHERE username = $1 OR email = $2", [username, email]);
            console.log("checking DB for username and email");
            //if result length === 0 it means username and email are free
            if (result.rows.length === 0) {
                console.log("details valid encryping password");
                const ecnryptedPassword = await encryptPassword(password);
                console.log("inserting info into datbase");
                await database.query("INSERT INTO fitness4udb.users (username, email, password) VALUES ($1, $2, $3)", [username, email, ecnryptedPassword]);
                //get user_id of registered user
                const result = await database.query("SELECT user_id FROM fitness4udb.users WHERE email = $1", [email]);
                //setup user details 
                await database.query(`INSERT INTO fitness4udb.userdetails (details_id, user_id, age, height, weight, sex, calorie_goal, water_goal)
                                    VALUES ($1, $2, 0, 0, 0, 'Not set', 0, 0)`, [result.rows[0].user_id, result.rows[0].user_id]);
                res.json({registered: true});
            } else {
                //if any rows are returned in the result it means username or email has already been taken
                const response = {};
                //loop through the results row(s)
                result.rows.forEach(row => {
                    //check if email is taken 
                    if (row.email === email) {
                        console.log("email already taken");
                        //res.json({isEmailTaken: true})
                        response.isEmailTaken = true;
                    }
                    //check is username is taken
                    if (row.username === username) {
                        console.log("username already taken");
                        //res.json({isUsernameTaken: true})
                        response.isUsernameTaken = true;
                    }
                });
                //send response
                console.log("sending response");
                res.json(response);
            }
        } catch(error) {
            console.error("an error occured: ", error);
            res.status(500).json({error: "Internal Server Error"});
        }
    });

    //function for logging in user
    app.post("/loginUser", async(req, res) => {
        try{
            const {email, password} = req.body;
            //search database for user email
            const result = await database.query("SELECT * FROM fitness4udb.users WHERE email = $1", [email]);
            console.log("querying db for users with email:", [email]);
            //check result for user
            if (result.rows.length === 1) {
                const user = result.rows[0];
                //validate password and send response
                const isValidPass = await bcrypt.compare(password, user.password)
                if (isValidPass) {
                    console.log("valid password")
                    //when user logs in set up session
                    req.session.userID = user.user_id;
                    return res.json({isValidPass: true});
                } else {
                    console.log("invalid password")
                    return res.json({isValidPass: false});
                }
            //else: user doesnt exist    
            } else {
                console.log("User not found")
                return res.json({isValidPass: false});
            }
        } catch(error) {
            console.error("an error occured: ", error);
            res.status(500).json({error: "Internal Server Error"});
        }
    });

    //function to add user input meal
    app.post("/addMeal", async(req,res) => {
        try{
            const user_id = req.session.userID;
            const {name, cals, carbs, fats, protein} = req.body;
            await database.query(`INSERT INTO fitness4udb.usermeals (user_id, meal_name, calories, carbs, protein, fat, meal_date) 
                                  VALUES ($1,$2,$3,$4,$5,$6, NOW()::date)`, [user_id, name, cals, carbs, protein, fats]);
            return res.json({success: true});
        } catch (error) {
            console.error("an error occurred: ", error);
        }
    });

    //function to add water
    app.post("/addWater", async(req,res) => {
        try{
            const user_id = req.session.userID;
            const {water} = req.body;
            await database.query("INSERT INTO fitness4udb.userwater (user_id, water, water_date) VALUES ($1,$2, NOW()::date)", [user_id, water]);
            return res.json({success: true});
        } catch (error) {
            console.error("an error occurred: ", error);
        }
    });

    //fucntion to add an exercise
    app.post("/addExercise", async(req,res) => {
        try{
            const user_id = req.session.userID;
            const {name, duration, type, cals} = req.body;
            await database.query(`INSERT INTO fitness4udb.userexercises (user_id, exercise_name, duration, type, calories_burnt, exercise_date) 
                                VALUES ($1,$2,$3,$4,$5, NOW()::date)`, [user_id, name, duration, type, cals]);
            return res.json({success: true});
        } catch (error) {
            console.error("an error occurred: ", error);
        }
    });

    //function to load in users journal
    app.post("/getUserStats", async(req, res) => {
        try{
            const user_id = req.session.userID;
            const {dayModifier} = req.body;
            var cals = 0;
            var water = 0;
            var burnt = 0;
            console.log(`Querying DB for Stats of user: ${user_id} with modifier: -${dayModifier}`);
            var result = await database.query("SELECT calories FROM fitness4udb.usermeals WHERE user_id = $1 AND meal_date = (NOW() - INTERVAL'1 day' * $2)::date", [user_id, dayModifier]);
            //total calorie intake
            for (i=0;i<result.rows.length;i++) {
                cals = cals + parseFloat(result.rows[i].calories);
                console.log(`Counting Cals for user: ${user_id} Sum: ${cals}`);
            }
                result = await database.query("SELECT water FROM fitness4udb.userwater WHERE user_id = $1 AND water_date = (NOW() - INTERVAL'1 day' * $2)::date", [user_id, dayModifier]);
            //total water intake
            for (i=0;i<result.rows.length;i++) {
                water = water + result.rows[i].water;
                console.log(`Counting water for user: ${user_id} Sum: ${water}`);
            }
                result = await database.query("SELECT calories_burnt FROM fitness4udb.userexercises WHERE user_id = $1 AND exercise_date = (NOW() - INTERVAL'1 day' * $2)::date", [user_id, dayModifier]);
            //total calorie burnt
            for (i=0;i<result.rows.length;i++) {
                burnt = burnt + parseFloat(result.rows[i].calories_burnt);
                console.log(`Counting Burnt for user: ${user_id} Sum: ${burnt}`);
            }

            console.log(`Cals: ${cals} Water: ${water} Burnt: ${burnt}`);
            return res.json({
                cals: cals,
                water: water,
                burnt: burnt 
            });

        } catch(error) {
            console.log("An error occured: ", error);
        }
    });

    //function to load users details from the database
    app.post("/getDetails", async(req,res) => {
        try {
            const user_id = req.session.userID;
            const result = await database.query("SELECT age, sex, weight, height, calorie_goal, water_goal FROM fitness4udb.userdetails WHERE user_id = $1", [user_id]);
            //return the detials
            console.log(`result: ${result.rows[0].age}, ${result.rows[0].sex}, ${result.rows[0].height}, ${result.rows[0].weight}, ${result.rows[0].calorie_goal}, ${result.rows[0].water_goal}`);
            if (result.rows[0].sex == "Not set") {
                result.rows[0].calorie_goal = "????";
                result.rows[0].water_goal = "????";
            }
            return res.json({
                age: result.rows[0].age,
                sex: result.rows[0].sex,
                height: result.rows[0].height,
                weight: result.rows[0].weight,
                calorie_goal: result.rows[0].calorie_goal,
                water_goal: result.rows[0].water_goal
            });
        } catch (error) {
            console.log("An error occured: ", error);
        }
    })

    //function to update users details
    app.post("/updateDetails", async(req,res) => {
        try {
            const user_id = req.session.userID;
            const {age, sex, height, weight} = req.body;
            //calculate calorie goal based on user details
            var bmr = 0;
            if (sex == 'Male') {
                bmr = (10*weight) + (6.25*height) - (5*age) + 5;
            } else if (sex == 'Female') {
                bmr = (10*weight) + (6.25*height) - (5*age) - 161;
            }
            //calculate water goal based on user weight
            const water = (35*weight);
            console.log(`updating user detials A:${age} S:${sex} H:${height} W:${weight} CAL:${bmr} WTR:${water}`);
            await database.query("UPDATE fitness4udb.userdetails SET age=$1, sex=$2, height=$3, weight=$4, calorie_goal=$5, water_goal=$6 WHERE user_id=$7", [age, sex, height, weight, bmr, water, user_id])
            return res.json({ success: true});
        } catch (error) {
            console.log("An Error occured: ", error);
        }
    })

    //fucntion for getting a users journal
    app.post("/getjournal", async(req,res) => {
        try {
            const user_id = req.session.userID;
            const { dayModifier } = req.body;
            var result = await database.query("SELECT * FROM fitness4udb.journal WHERE user_id = $1 AND journal_date = (NOW() - INTERVAL'1 day' * $2)::date", [user_id, dayModifier]);
            //return the detials
            //if journal exits return the note
            if (result.rows.length == 1) {
                console.log(`result: ${result.rows[0].user_id}, ${result.rows[0].journal_date}, ${result.rows[0].note}`);
                return res.json({ note: result.rows[0].note });
            } else {
                return res.json({ note: false});
            }
        } catch (error) {
            console.log("An error occured: ", error);
        }
    })

    //function for updating users journal
    app.post("/updateJournal", async(req,res) => {
        try {
            const user_id = req.session.userID;
            const { dayModifier, notes } = req.body;
            console.log(`got journal note: ${notes}`);
            //check if user has existing journal for this date
            var result = await database.query("SELECT * FROM fitness4udb.journal WHERE user_id = $1 AND journal_date = (NOW() - INTERVAL'1 day' * $2)::date", [user_id, dayModifier]);
            //if res length = 1 journal exists
            if (result.rows.length == 1) {
                console.log("updating note")
                await database.query("UPDATE fitness4udb.journal SET note=$1 WHERE user_id=$2 AND journal_date = (NOW() - INTERVAL'1 day' * $3)::date", [notes, user_id, dayModifier]);
                return res.json({ success: true});
            } else {
                console.log("creating journal");
                //journal doesnt exist so create it
                await database.query (`INSERT INTO fitness4udb.journal (user_id, journal_date, note)
                                    VALUES ($1, (NOW() - INTERVAL'1 day' * $2)::date, $3)`, [user_id, dayModifier, notes]);
                return res.json({ success: true});
            }
        } catch (error) {
            console.log("An error occurred: ", error);
        }
    })

    //server internal functions
    //function for encrypting password
    async function encryptPassword(password) {
        return new Promise((resolve, reject) => {
            //hash the password with our salt
            bcrypt.hash(password, salt, function(error, encrpytion) {
                //if there is an error reject
                if (error) {
                    reject(error);
                //else its successful, return the encrypted password
                } else {
                    resolve(encrpytion);
                }
            })
        })
    }

    const PORT = process.env.PORT || 9999;
    app.listen(PORT, function() {
        console.log(`Server running on port: ${PORT}`);
    });
}