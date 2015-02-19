/*
 * gameservices.js
 */

(function() {

    tm.define("tm.google.GameServices", {

        init: function() {
            if (!gapi.client.games) {
                tm.util.Script
                    .load("https://apis.google.com/js/client.js")
                    .on("load", function() {
                        gapi.client.load("games", "v1");
                    });
            }
        },

    });

})();
