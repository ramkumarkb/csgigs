const Gig = require("../models/gig.model");
const asyncMiddleware = require("../utils/asyncMiddleware");
const ObjectID = require('mongodb').ObjectID;
const rc_controller = require('../controllers/rc.controller');

exports.create_gig = asyncMiddleware(async (req, res, next) => {
    const gig = new Gig(
        {
            name: req.body.name,
            description: req.body.description,
            photo: req.body.photo,
            points_budget: req.body.points_budget,
            status: "Draft",
            user_admins: req.body.user_admins.map(admin => admin.name),
            //Possible required fields in creation
            user_participants: [],
            user_attendees: []
        }
    );
    try {
        const gig_created = await gig.save();

        if (gig_created === null) {
            return res.status(400).send({
                error: "Error encountered while creating gig: " + req.body.name
            });
        }

        const authSet = {
            XAuthToken: req.body.XAuthToken,
            XUserId: req.body.XUserId
        };

        const gig_id_and_name = {
            _id: gig_created._id,
            name: gig_created.name
        };

        gig_created.user_admins = gig_created.user_admins.filter(admin => admin !== req.body.user);

        const created_group = await rc_controller.create_group(gig_created, authSet);
        if (created_group) {
            const gig_owners = req.body.user_admins
                .filter(admin => admin.name !== req.body.user)
                .map(admin => admin._id);
            rc_controller.add_owners_to_group(created_group._id, gig_owners, authSet);
            Gig.findByIdAndUpdate(gig_created._id, { rc_channel_id : created_group}, function (err, gig) {
                if (err) return next(err);
            });
        }

        res.status(200).send({
            gig: gig_id_and_name
        });

    } catch (error) {
        console.log(error);
        res.status(500).send({error});
    }


});

exports.get_user_all_gigs = asyncMiddleware(async (req, res, next) => {
    let status = (req.query.status).split(",");
    const matchCriteria =
        {
            "$match":
                {
                    "user_admins": {"$in": [req.params.username]},
                    "status": {"$in": status}
                }
        };
    return Gig
        .aggregate(aggregation_with_tasks_and_users(matchCriteria)).exec().then((gigs) => {
            res.status(200).send({
                "gigs": gigs
            });
        }).catch(err => {
            console.log(err);
            res.status(500).send({error: err});
        });
});

exports.get_user_gig = asyncMiddleware(async (req, res, next) => {
    const matchCriteria = {"$match": {"_id": new ObjectID(req.params.id)}};
    return Gig
        .aggregate(aggregation_with_tasks_and_users(matchCriteria)).exec().then((gig_retrieved) => {
            if (gig_retrieved === null) {
                return res.status(400).send({
                    error: "Cannot find gig of id " + req.params.id
                });
            }
            res.status(200).send({
                gig: gig_retrieved[0]
            });

        }).catch(err => {
            res.status(400).send({error: err});
        });
});

exports.update_gig = function (req, res, next) {
    Gig.findByIdAndUpdate(req.params.id, {$set: req.body}, function (err, gig) {
        if (err) return next(err);
        res.send("Gig updated.");
    });
};

exports.gig_add_user_admin = function (req, res, next) {
    return Gig.findOneAndUpdate(
        {name: req.params.name},
        {$addToSet: {"user_admins": req.params.admin_username}}, //addToSet ensures no duplicate names in array
        {"new": true},
        function (err, gig) {
            if (err || gig == null) {
                console.log(err);
                return res.status(400).send({
                    error: "Cannot find gig of name " + req.params.name
                });
            } else {
                res.status(200).send({
                    gig: gig
                });

            }
        });
};

exports.gig_delete_user_admin = function (req, res, next) {
    return Gig.findOneAndUpdate(
        {name: req.params.name},
        {$pullAll: {"user_admins": [req.params.admin_username]}}, //remove all instances of the user admin
        {"new": true}, // return updated new array
        function (err, gig) {
            if (err || gig == null) {
                console.log(err);
                return res.status(400).send({
                    error: "Cannot find gig of name " + req.params.name
                });
            } else {
                res.status(200).send({
                    gig: gig
                });
            }
        });
};

exports.gig_add_user_participant = function (req, res, next) {
    return Gig.findOneAndUpdate(
        {name: req.params.name},
        {$addToSet: {"user_participants": req.params.participant_username}}, //addToSet ensures no duplicate names in array
        {"new": true},
        function (err, gig) {
            if (err || gig == null) {
                return res.status(400).send({
                    error: "Cannot find gig of name " + req.params.name
                });
            } else {
                res.status(200).send({
                    gig: gig
                });
            }
        });
};

exports.gig_add_user_attendee = function (req, res, next) {
    return Gig.findOneAndUpdate(
        {name: req.params.name},
        {$addToSet: {"user_attendees": req.params.attendee_username}}, //addToSet ensures no duplicate names in array
        {"new": true},
        function (err, gig) {
            if (err || gig == null) {
                return res.status(400).send({
                    error: "Cannot find gig of name " + req.params.name
                });
            } else {
                res.status(200).send({
                    gig: gig
                });
            }
        });
};

exports.gigs_by_status = function (req, res) {
    return Gig.find({status: req.params.status}).exec().then((gigs_retrieved) => {
        if (gigs_retrieved.length === 0) {
            return res.status(400).send({
                error: "Cannot find any GIGs under status: " + req.params.status
            });
        }
        res.status(200).send({
            gigs: gigs_retrieved
        });
    }).catch(err => {
        res.status(400).send({error: err});
    });
};

function aggregation_with_tasks_and_users(matchCriteria) {
    return [
        matchCriteria,
        {
            '$lookup': {
                'from': 'tasks',
                'localField': 'name',
                'foreignField': 'gig_name',
                'as': 'tasks'
            }
        },
        {"$unwind": "$user_admins"},
        {
            "$lookup": {
                "from": "users",
                "localField": "user_admins",
                "foreignField": "name",
                "as": "userObjects"
            }
        },
        {"$unwind": "$userObjects"},
        {
            "$group": {
                "_id": "$_id",
                "rc_channel_id": {"$first": "$rc_channel_id"},
                "user_participants": {"$first": "$user_participants"},
                "user_admins": {"$push": "$userObjects"},
                "user_attendees": {"$first": "$user_attendees"},
                "name": {"$first": "$name"},
                "description": {"$first": "$description"},
                "photo": {"$first": "$photo"},
                "points_budget": {"$first": "$points_budget"},
                "status": {"$first": "$status"},
                "createdAt": {"$first": "$createdAt"},
                "__v": {"$first": "$__v"},
                "tasks": {"$first": "$tasks"}
            }
        }
    ]
}
