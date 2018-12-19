const Gig = require('../models/gig.model');
const asyncMiddleware = require('../utils/asyncMiddleware');

exports.test = asyncMiddleware(async (req, res) => {
    res.send('Greetings from the Gig controller!');
});

exports.gig_create = asyncMiddleware(async (req, res, next) => {
    let gig = new Gig(
        {
            name: req.body.name,
            points_budget: req.body.points_budget,
            status: "Draft",
            user_admins: req.body.user_admins,

            //Possible required fields in creation
            users_participants: [],
            users_attendees: []
        }
    );

    return gig.save().then(gigCreated => {

        return Gig
            .aggregate([
                {$match: {name: req.body.name}},
                {
                    $lookup: {
                        from: 'tasks',
                        localField: 'name',
                        foreignField: 'gig_name',
                        as: 'tasks'
                    }
                }
            ])
            // .populate('user_participants')
            .exec().then((gigs_retrieved) => {
                if (gigs_retrieved.length === 0) {
                    return res.status(400).send({
                        error: 'Cannot find any GIGs: ' + req.body.name
                    });
                }
                res.status(200).send({
                    gig: gigs_retrieved[0]
                });
            }).catch(err => {
                res.status(400).send({error: err});
            });
    }).catch(err => {
        console.log(err);
        res.status(400).send({error: err});
    });
});

exports.gig_create_temp = asyncMiddleware(async (req, res, next) => {
    let gig = new Gig(
        {
            name: req.body.name,
            description: req.body.description,
            photo: req.body.photo,
            points_budget: req.body.points_budget,
            status: "Draft",
            user_admins: req.body.user_admins,

            //Possible required fields in creation
            user_participants: ["erny_che"],
            user_attendees: []
        }
    );

    return gig.save().then(gigCreated => {
        var matchCriteria = {'$match': {'name': req.body.name}};

        return Gig
            .aggregate(aggregation_with_tasks_and_users(matchCriteria))
            .exec().then((gigs_retrieved) => {
                if (gigs_retrieved.length === 0) {
                    return res.status(400).send({
                        error: 'Cannot find any GIGs: ' + req.body.name
                    });
                }
                res.status(200).send({
                    gig: gigs_retrieved[0]
                });
            }).catch(err => {
                res.status(400).send({error: err});
            });
    }).catch(err => {
        console.log(err);
        res.status(400).send({error: err});
    });
});

exports.gigs_details = asyncMiddleware(async (req, res, next) => {
    let status = (req.query.status).split(",");

    var matchCriteria =
    {"$match":
        {
            "user_admins": { "$in" : [req.params.username]},
            "status": { "$in" : status}
        }
    };

    return Gig.aggregate(aggregation_with_tasks_and_users(matchCriteria)).exec().then((gigs) => {
            res.status(200).send({
                "gigs": gigs
            });
        }).catch(err => {
            console.log(err);
            res.status(500).send({error: err});
        });
});

exports.gig_details = asyncMiddleware(async (req, res, next) => {
    var matchCriteria = {'$match': {'name': req.params.name}};

    console.log(req.params.name);
    return Gig.aggregate(aggregation_with_tasks_and_users(matchCriteria))
        .exec().then((gig_retrieved) => {
            if (gig_retrieved === null) {
                return res.status(400).send({
                    error: 'Cannot find gig of name ' + req.params.name
                });
            }
            console.log(gig_retrieved);
            res.status(200).send({
                gig: gig_retrieved[0]
            });

        }).catch(err => {
            res.status(400).send({error: err});
        });
});

exports.gig_update = function (req, res, next) {
    Gig.findByIdAndUpdate(req.params.id, {$set: req.body}, function (err, gig) {
        if (err) return next(err);
        res.send('Gig updated.');
    });
};

exports.gig_cancel = function (req, res, next) {
    Gig.findByIdAndUpdate(req.params.name, {"status": "Cancelled"}, function (err, gig) {
        if (err) return next(err);
        res.send('Gig cancelled.');
    });
}

exports.gig_add_user_admin = function (req, res, next) {
    return Gig.findOneAndUpdate(
        {name: req.params.name},
        {$addToSet: {"user_admins": req.params.admin_username}}, //addToSet ensures no duplicate names in array
        {'new': true},
        function (err, gig) {
            if (err || gig == null) {
                console.log(err);
                return res.status(400).send({
                    error: 'Cannot find gig of name ' + req.params.name
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
        {'new': true}, // return updated new array
        function (err, gig) {
            if (err || gig == null) {
                console.log(err);
                return res.status(400).send({
                    error: 'Cannot find gig of name ' + req.params.name
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
        {'new': true},
        function (err, gig) {
            if (err || gig == null) {
                return res.status(400).send({
                    error: 'Cannot find gig of name ' + req.params.name
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
        {'new': true},
        function (err, gig) {
            if (err || gig == null) {
                return res.status(400).send({
                    error: 'Cannot find gig of name ' + req.params.name
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
                error: 'Cannot find any GIGs under status: ' + req.params.status
            });
        }
        res.status(200).send({
            gigs: gigs_retrieved
        });
    }).catch(err => {
        res.status(400).send({error: err});
    })
}

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
                "foreignField": "username",
                "as": "userObjects"
            }
        },
        {"$unwind": "$userObjects"},
        {"$unwind": "$tasks"},
        {
            "$lookup": {
                "from": "users",
                "localField": "tasks.users_assigned",
                "foreignField": "username",
                "as": "task_users"
            }
        },
        {"$unwind": "$task_users"},
        {
            "$group": {
                "_id": "$tasks._id",
                "gigs_id": {"$first": "$_id"},
                "description": {"$first": "$description"},
                "photo": {"$first": "$photo"},
                "rc_channel_id": {"$first": "$rc_channel_id"},
                "user_participants": {"$first": "$user_participants"},
                "user_admins": {"$addToSet": "$userObjects"},
                "user_attendees": {"$first": "$user_attendees"},
                "name": {"$first": "$name"},
                "points_budget": {"$first": "$points_budget"},
                "status": {"$first": "$status"},
                "createdAt": {"$first": "$createdAt"},
                "__v": {"$first": "$__v"},
                "task_name": {"$first": "$tasks.task_name"},
                "gig_name" : {"$first": "$tasks.gig_name"},
                "task_description" : {"$first": "$tasks.task_description"},
                "points" : {"$first": "$tasks.points"},
                "task_category" : {"$first": "$tasks.task_category"},
                "completeAt" : {"$first": "$tasks.completeAt"},
                "appliedAt" : {"$first": "$tasks.appliedAt"},
                "__v" : {"$first": "$tasks.__v"},
                "users_assigned": {"$addToSet": "$task_users"}
            }
        },
        {
            "$group": {
                "_id": "$gigs_id",
                "description": {"$first": "$description"},
                "photo": {"$first": "$photo"},
                "rc_channel_id": {"$first": "$rc_channel_id"},
                "user_participants": {"$first": "$user_participants"},
                "user_admins": {"$first": "$user_admins"},
                "user_attendees": {"$first": "$user_attendees"},
                "name": {"$first": "$name"},
                "description": {"$first": "$description"},
                "photo": {"$first": "$photo"},
                "points_budget": {"$first": "$points_budget"},
                "status": {"$first": "$status"},
                "createdAt": {"$first": "$createdAt"},
                "__v": {"$first": "$__v"},
                "tasks": {
                    "$push": {
                        "_id": "$_id",
                        "task_name": "$task_name",
                        "gig_name" : "$gig_name",
                        "task_description" : "$task_description",
                        "points" : "$points",
                        "task_category" : "$task_category",
                        "completeAt" : "$completeAt",
                        "appliedAt" : "$appliedAt",
                        "__v" : "$__v",
                        "users_assigned": "$users_assigned"
                    }
                }
            }
        }
    ]
}
