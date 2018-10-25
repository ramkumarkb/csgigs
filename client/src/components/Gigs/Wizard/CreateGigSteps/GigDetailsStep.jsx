import React from "react";

// @material-ui/icons
import Face from "@material-ui/icons/Face";
import RecordVoiceOver from "@material-ui/icons/RecordVoiceOver";
import Email from "@material-ui/icons/Email";

// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";
import InputAdornment from "@material-ui/core/InputAdornment";

// core components
import GridContainer from "components/Grid/GridContainer.jsx";
import GridItem from "components/Grid/GridItem.jsx";
import PictureUpload from "components/CustomUpload/PictureUpload.jsx";
import CustomInput from "components/CustomInput/CustomInput.jsx";

const style = {
    infoText: {
        fontWeight: "300",
        margin: "10px 0 30px",
        textAlign: "center"
    },
    inputAdornmentIcon: {
        color: "#555"
    },
    inputAdornment: {
        position: "relative"
    }
};

class GigDetailsStep extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            name: "",
            admins: [],
            budget: 0,
            firstname: "",
            firstnameState: "",
            lastname: "",
            lastnameState: "",
            email: "",
            emailState: ""
        };
    }

    sendState() {
        return this.state;
    }

    // function that returns true if value is email, false otherwise
    verifyEmail(value) {
        var emailRex = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (emailRex.test(value)) {
            return true;
        }
        return false;
    }

    // function that verifies if a string has a given length or not
    verifyLength(value, length) {
        if (value.length >= length) {
            return true;
        }
        return false;
    }

    change(event, stateName, type, stateNameEqualTo) {
        switch (type) {
            case "email":
                if (this.verifyEmail(event.target.value)) {
                    this.setState({[stateName + "State"]: "success"});
                } else {
                    this.setState({[stateName + "State"]: "error"});
                }
                break;
            case "length":
                if (this.verifyLength(event.target.value, stateNameEqualTo)) {
                    this.setState({[stateName + "State"]: "success"});
                } else {
                    this.setState({[stateName + "State"]: "error"});
                }
                break;
            default:
                break;
        }
        this.setState({[stateName]: event.target.value});
    }

    isValidated() {
        if (
            this.state.firstnameState === "success" &&
            this.state.lastnameState === "success" &&
            this.state.emailState === "success"
        ) {
            return true;
        } else {
            if (this.state.firstnameState !== "success") {
                this.setState({firstnameState: "error"});
            }
            if (this.state.lastnameState !== "success") {
                this.setState({lastnameState: "error"});
            }
            if (this.state.emailState !== "success") {
                this.setState({emailState: "error"});
            }
        }
        return false;
    }

    render() {
        const {classes} = this.props;
        return (
            <GridContainer justify="center">
                <GridItem xs={12} sm={12} md={12} lg={8} align="center">
                    <h4>Name of Gig</h4>
                    <CustomInput
                        success={this.state.firstnameState === "success"}
                        error={this.state.firstnameState === "error"}
                        labelText={
                            <span>
                                Gig Name <small>(required)</small>
                            </span>
                        }
                        id="firstname"
                        formControlProps={{
                            fullWidth: true
                        }}
                        inputProps={{
                            onChange: event => this.change(event, "firstname", "length", 3),
                            endAdornment: (
                                <InputAdornment
                                    position="end"
                                    className={classes.inputAdornment}
                                >
                                    <Face className={classes.inputAdornmentIcon}/>
                                </InputAdornment>
                            )
                        }}
                        inputType="text"
                    />
                </GridItem>
                <GridItem xs={12} sm={12} md={12} lg={8} align="center">
                    <h4>Budget for Brownie Points</h4>
                    <CustomInput
                        success={this.state.firstnameState === "success"}
                        error={this.state.firstnameState === "error"}
                        labelText={
                            <span>
                                Brownie Points <small>(required)</small>
                            </span>
                        }
                        id="firstname"
                        formControlProps={{
                            fullWidth: true
                        }}
                        inputProps={{
                            onChange: event => this.change(event, "firstname", "length", 3),
                            endAdornment: (
                                <InputAdornment
                                    position="end"
                                    className={classes.inputAdornment}
                                >
                                    <Face className={classes.inputAdornmentIcon}/>
                                </InputAdornment>
                            )
                        }}
                        inputType="number"
                    />
                </GridItem>

            </GridContainer>
        );
    }
}

export default withStyles(style)(GigDetailsStep);
