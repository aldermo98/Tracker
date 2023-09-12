require('dotenv').config();
const express = require("express");
const mongoose = require('mongoose');
const { Navigator } = require("node-navigator");

const router = express.Router();
const navigator = new Navigator();

const Schema = mongoose.Schema
let db_user=""; 
let db_pw="";
const MONGO_URI = `mongodb+srv://${db_user}:${db_pw}@tracker.dts90jw.mongodb.net/?retryWrites=true&w=majority`
try {
    mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
} catch (error) {
    console.log(`Error connecting to DB: ${error}`);
}

let UserSchema = new Schema({
    ip: { type: String, required: true },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    isActive: { type: Boolean, default: true, required: true }
});
UserSchema.index({ location: "2dsphere" })

let User = mongoose.model("User", UserSchema);

router.post("/track", (req, res) => {
    const ip = req.header('x-forwarded-for') || res.socket.remoteAddress;
    try {
        (async () => {
            let updateData = {
                location: {
                    type: 'Point',
                    coordinates: [req.body.longitude, req.body.latitude]
                },
                isActive: true
            };
            let options = { new: true, upsert: true };

            const doc = await User.findOneAndUpdate({ ip: ip }, updateData, options);
            res.status(200).send(doc.toJSON())
        })();
    } catch (error) {
        res.send(error)
    }
});

router.get("/stop-tracking", (req, res) => {
    const ip = req.header('x-forwarded-for') || res.socket.remoteAddress;
    try {
        (async () => {
            let updateData = {
                isActive: false
            };
            let options = { new: true, upsert: true };

            const doc = await User.findOneAndUpdate({ ip: ip }, updateData, options);
            res.status(200).send(doc.toJSON())
        })();
    } catch (error) {
        res.send(error);
    }
});

router.post("/get-nearby-users", (req, res) => {
    const ip = req.header('x-forwarded-for') || res.socket.remoteAddress;
    try {
        (async () => {
            const doc = await User.find({
                ip: { $ne: ip },
                location: {
                    $near: {
                        $maxDistance: req.body.distance, //distance in meters
                        $geometry: {
                            type: "Point",
                            coordinates: [req.body.longitude, req.body.latitude]
                        }
                    }
                }
            });
            res.status(200).send(doc);
        })();
    } catch (error) {
        res.send(error.messages)
    }
});

module.exports = router;