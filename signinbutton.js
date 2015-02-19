/*
 * siginbutton.js
 */

(function() {

    tm.define("tm.google.SigninButton", {
        superClass: "tm.event.EventDispatcher",

        /**
         * Google APIs Console から取得済みの OAuth 2.0 クライアント ID.
         * https://code.google.com/apis/console#access
         */
        clientId: null,

        init: function(element, param) {
            this.superInit();

            this.signinButton = tm.dom.Element(element)

            param = {}.$extend(tm.google.SigninButton.PARAM_DEFAULT, param);

            this.clientId = param.clientid;

            var button = this.signinButton.create("span");
            button.attr.set("class", "g-signin");
            button.data.set("callback", tm.google.SigninButton.SIGNIN_CALLBACK_NAME);
            for (var key in param) {
                if (param.hasOwnProperty(key)) {
                    button.data.set(key, param[key]);
                }
            }

            if (!tm.global[tm.google.SigninButton.SIGNIN_CALLBACK_NAME]) {
                tm.global[tm.google.SigninButton.SIGNIN_CALLBACK_NAME] = this._signinCallback.bind(this);
                tm.util.Script.load("https://apis.google.com/js/client:platform.js");
            }
        },

        signOut: function() {
            gapi.auth.signOut();
        },

        _signinCallback: function(auth) {
            if (auth && auth.error == null) {
                this.signinButton.visible = false;
                this.flare("signin", {
                    auth: auth,
                });
            } else {
                this.flare("signout", {
                    auth: auth,
                });
            }
        },
    });

    tm.google.SigninButton.SIGNIN_CALLBACK_NAME = "__googleSigninCallback__" + Math.rand(0, 10000).toString(16) + "_" + Math.rand(0, 10000).toString(16);

    tm.google.SigninButton.PARAM_DEFAULT = {
        clientid: null,
        cookiepolicy: "single_host_origin",
        scope: "https://www.googleapis.com/auth/plus.login",
        width: "wide",
        height: "short",
        theme: "light",
    };

})();
