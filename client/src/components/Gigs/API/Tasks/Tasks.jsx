import {NotificationManager} from "react-notifications";
import UserProfile from "components/Gigs/Authentication/UserProfile";
import {publishMessage} from "components/Gigs/API/RocketChat/RocketChat";

export const retreive = function(gigId, callback){
    fetch(`/admin-ui/api/tasks/getTasksByGig/${gigId}`, {
        method: 'GET',
        headers: {'Content-Type': 'application/json'}
    }).then(data => {
        if (data.status !== 200) {
            data.json().then(json => {
                NotificationManager.error(json.error.errmsg);
            });
        } else {
            data.json().then(json => {
                callback(json.tasks);
            });
        }
    });
};

export const update = function(taskId, payload, statusCallback) {
    if (statusCallback) statusCallback("loading");
    fetch(`/admin-ui/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload)
    }).then(data => {
        if (data.status !== 200) {
            data.json().then(json => {
                NotificationManager.error(json.error.errmsg);
            });
            if (statusCallback) statusCallback("working");
        } else {
            if (statusCallback) statusCallback("success");
        }
    });
};

export const add = function(gigRoomId, gigId, state, statusCallback) {
    if (statusCallback) statusCallback("loading");
    fetch('/admin-ui/api/tasks/addTask', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(buildTaskPayload(gigId, state))
    }).then(data => {
        if (data.status !== 200) {
            data.json().then(json => {
                NotificationManager.error(json.error.errmsg);
            });
            if (statusCallback) statusCallback("working");
        } else {
            data.json().then(json => {
                const task = json.task;
                //gig.tasks.push(task);
                publishMessage(buildPublishMessage(gigRoomId, task));
            });
            if (statusCallback) statusCallback("success");
        }
    });
};
function buildPublishMessage (gigRoomId, task) {
    const authSet = UserProfile.getAuthSet();
    const publishPayload = {};

    publishPayload["message"] = "" +
        "*New Task!*\nTask Id: " + task._id +
        "\nTask Name: " + task.task_name +
        "\n Task Description: " + task.task_description +
        "\nReply to volunteer for this task.";
    publishPayload["roomId"] = gigRoomId;
    publishPayload["XAuthToken"] = authSet.token;
    publishPayload["XUserId"] = authSet.userId;

    return publishPayload;
};

function buildTaskPayload(gigId, state) {
    var payload = {};
    payload["gig_id"] = gigId;
    payload["task_name"] = state.taskName;
    payload["task_category"] = state.taskCategory;
    payload["task_description"] = state.taskDescription;
    return payload;
}