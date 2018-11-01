import React from "react";
import PropTypes from "prop-types";
import { Switch, Route, Redirect } from "react-router-dom";

// @material-ui/core components
import withStyles from "@material-ui/core/styles/withStyles";

// core components
import PagesHeader from "components/Header/PagesHeader.jsx";
import Footer from "components/Footer/Footer.jsx";

import pagesRoutes from "routes/pages.jsx";
import loginRoutes from "routes/login.jsx";
import pagesStyle from "assets/jss/material-dashboard-pro-react/layouts/pagesStyle.jsx";

import bgImage from "assets/img/register.jpeg";

class Login extends React.Component {
    componentDidMount() {
        document.body.style.overflow = "unset";
    }
    render() {
        const { classes, ...rest } = this.props;
        return (
            <div>
                <PagesHeader {...rest} />
                <div className={classes.wrapper} ref="wrapper">
                    <div
                        className={classes.fullPage}
                        style={{ backgroundImage: "url(" + bgImage + ")" }}
                    >
                        <Switch>
                            {loginRoutes.map((prop, key) => {
                                if (prop.collapse) {
                                    return null;
                                }
                                if (prop.redirect) {
                                    return (
                                        <Redirect from={prop.path} to={prop.pathTo} key={key} />
                                    );
                                }console.log("PAGES ROUTE ACTIVATED");
                                return (
                                    <Route
                                        path={prop.path}
                                        component={prop.component}
                                        key={key}
                                    />
                                );
                            })}
                        </Switch>
                    </div>
                </div>
            </div>
        );
    }
}

Login.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(pagesStyle)(Login);