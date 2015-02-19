(function() {

    tm.define("tm.google.LeaderboardScene", {
        superClass: "tm.app.Scene",
        init: function(param) {
            var scene = this;
            this.superInit();

            this.param = param = {}.$extend(tm.google.LeaderboardScene.DEFAULT_PAEAM, param);

            this.applicationId = param.applicationId;

            this.fromJSON({
                children: {
                    bg: {
                        type: "tm.display.RectangleShape",
                        init: {
                            width: param.width,
                            height: param.height,
                            strokeStyle: "transparent",
                            fillStyle: param.bgColor,
                        },
                        originX: 0,
                        originY: 0,
                    },
                    headerBg: {
                        type: "tm.display.RectangleShape",
                        init: {
                            width: param.width,
                            height: 100,
                            strokeStyle: "transparent",
                            fillStyle: "white",
                        },
                        originX: 0,
                        y: 50
                    },
                    title: {
                        type: "tm.display.Label",
                        init: ["loading...", 26],
                        x: param.width * 0.5,
                        y: 25,
                        align: "center",
                        fillStyle: "black",
                    },
                    closeButton: {
                        type: "tm.ui.FlatButton",
                        init: {
                            text: "完了",
                            width: 60,
                            height: 32,
                            fontSize: 22,
                        },
                        x: param.width - 32,
                        y: 25,
                        onpush: function() {
                            scene.app.popScene();
                        },
                    },
                    buttonAreal: {
                        type: "tm.display.CanvasElement",
                        y: 75,
                        children: {
                            leaderboardButton: {
                                type: "tm.ui.FlatButton",
                                init: {
                                    text: "Leaderboard",
                                    width: 130,
                                    height: 32,
                                    fontSize: 18,
                                    fillStyle: "hsl(180, 60%, 50%)",
                                    strokeStyle: "hsl(180, 60%, 50%)",
                                    textColor: "white",
                                },
                                x: param.width * 0.5 - 70,
                            },
                            achievementButton: {
                                type: "tm.ui.FlatButton",
                                init: {
                                    text: "達成項目",
                                    width: 130,
                                    height: 32,
                                    fontSize: 18,
                                    fillStyle: "white",
                                    strokeStyle: "hsl(180, 60%, 50%)",
                                    textColor: "hsl(180, 60%, 50%)",
                                },
                                x: param.width * 0.5 + 70,
                                onpush: function() {
                                    console.log("ok");
                                },
                            },
                        },
                    },
                    scrollArea: {
                        type: "tm.display.CanvasElement",
                        originY: 0,
                        width: param.width,
                        height: param.height - 100,
                        clipping: true,
                        x: param.width * 0.5,
                        y: 100,
                        checkHierarchy: true,
                        interactive: true,
                        boundingType: "rect",
                        children: {
                            inner: {
                                type: "tm.display.CanvasElement",
                                originY: 0,
                                children: {
                                    leaderboardCount: {
                                        type: "tm.display.Label",
                                        init: ["Leaderboard: ?件", 22],
                                        align: "left",
                                        originY: 0,
                                        x: param.width * -0.5 + 20,
                                        y: 20,
                                        fillStyle: "black",
                                        fontWeight: "bold",
                                    },
                                },
                            },
                        },
                    },
                },
            });

            this.scrollArea.on("pointingmove", function(e) {
                this.inner.y += e.app.pointing.deltaPosition.y;
            });

            this._getGameData();
            this._getLeaderboardData();
        },

        _getGameData: function() {
            var req = gapi.client.games.applications.get({
                applicationId: this.applicationId,
                language: "ja",
            });
            req.execute(function(res) {
                if (!res.error) {
                    console.log(res);
                    this.title.text = res.name;
                    this.scrollArea.inner.leaderboardCount.text = "Leaderboard: {0}件".format(res.leaderboard_count);
                }
            }.bind(this));
        },

        _getLeaderboardData: function() {
            var scene = this;

            var req = gapi.client.games.leaderboards.list({
                language: "ja",
            });
            req.execute(function(res) {
                if (!res.error) {
                    res.items.forEach(function(leaderboard, i) {
                        scene.addItem(leaderboard, i);
                    });
                }
            });
        },

        addItem: function(leaderboard, i) {
            var scene = this;
            tm.google.LeaderboardScene.Item(400, 80, leaderboard, this.param)
                .setPosition(0, 80 + i * 80)
                .addChildTo(scene.scrollArea.inner);
        },
    });

    tm.google.LeaderboardScene.DEFAULT_PAEAM = {
        message: "",
        fontSize: 72,
        fontColor: "#444",
        width: 640,
        height: 960,
        bgColor: "rgba(240, 240, 240, 0.95)",
    };

    tm.define("tm.google.LeaderboardScene.Item", {
        superClass: "tm.display.CanvasElement",

        init: function(width, height, leaderboard, sceneParam) {
            var self = this;
            this.superInit();
            this.fromJSON({
                width: width,
                height: height,
                interactive: true,
                checkHierarchy: true,
                boundingType: "rect",
                children: {
                    circle: {
                        type: "tm.display.RoundRectangleShape",
                        init: {
                            width: 60,
                            height: 60,
                            fillStyle: "black",
                            strokeStyle: "transparent",
                        },
                        x: -width * 0.5 + 40,
                        y: 0,
                    },
                    icon: {
                        type: "tm.display.Sprite",
                        init: [tm.google.LeaderboardScene.Item.DEFAULT_TEXTURE, 60, 60],
                        x: -width * 0.5 + 40,
                        y: 0,
                    },
                    title: {
                        type: "tm.display.Label",
                        init: [leaderboard.name, 24],
                        fillStyle: "rgb(20, 20, 20)",
                        align: "left",
                        fontWeight: "bold",
                        x: -width * 0.5 + 40 + 50,
                        y: 0,
                    },
                },
            });

            if (leaderboard.iconUrl) {
                tm.asset.Texture(leaderboard.iconUrl)
                    .on("load", function() {
                        self.icon.image = this;
                    });
            }

            this.on("pointingstart", function(e) {
                this.initialY = e.pointing.y;
                this.drag = false;
            });
            this.on("pointingmove", function(e) {
                if (5 < Math.abs(this.initialY - e.pointing.y)) {
                    this.drag = true;
                }
            });
            this.on("pointingend", function(e) {
                var scrollArea = this.parent.parent;
                if (!this.drag && scrollArea.isHitPoint(e.pointing.x, e.pointing.y)) {
                    e.app.pushScene(tm.google.RankingScene(leaderboard, sceneParam));
                }
            });
        },
    });

    tm.google.LeaderboardScene.Item.DEFAULT_TEXTURE = null;
    tm.main(function() {
        tm.google.LeaderboardScene.Item.DEFAULT_TEXTURE = tm.graphics.Canvas()
            .resize(512, 512)
            .setStrokeStyle("hsl(180, 60%, 50%)")
            .setLineStyle(10)
            .strokeCircle(256, 256, 160);
    });

    tm.define("tm.google.RankingScene", {
        superClass: "tm.app.Scene",

        init: function(leaderboard, param) {
            console.log(leaderboard.id);
            var self = this;
            this.superInit();
            this.fromJSON({
                leaderboard: leaderboard,
                param: param,
                children: {
                    bg: {
                        type: "tm.display.RectangleShape",
                        init: {
                            width: param.width,
                            height: param.height,
                            strokeStyle: "transparent",
                            fillStyle: param.bgColor,
                        },
                        originX: 0,
                        originY: 0,
                    },
                    headerBg: {
                        type: "tm.display.RectangleShape",
                        init: {
                            width: param.width,
                            height: 50,
                            strokeStyle: "transparent",
                            fillStyle: "white",
                        },
                        originX: 0,
                        y: 25
                    },
                    title: {
                        type: "tm.display.Label",
                        init: [leaderboard.name, 26],
                        x: param.width * 0.5,
                        y: 25,
                        align: "center",
                        fillStyle: "black",
                    },
                    backButton: {
                        type: "tm.ui.FlatButton",
                        init: {
                            text: "戻る",
                            width: 60,
                            height: 32,
                            fontSize: 22,
                        },
                        x: 32,
                        y: 25,
                        onpush: function() {
                            self.app.popScene();
                        },
                    },
                    closeButton: {
                        type: "tm.ui.FlatButton",
                        init: {
                            text: "完了",
                            width: 60,
                            height: 32,
                            fontSize: 22,
                        },
                        x: param.width - 32,
                        y: 25,
                        onpush: function() {
                            var app = self.app;
                            app.popScene();
                            app.popScene();
                        },
                    },
                    scrollArea: {
                        type: "tm.display.CanvasElement",
                        originY: 0,
                        width: param.width,
                        height: param.height - 50,
                        clipping: true,
                        x: param.width * 0.5,
                        y: 50,
                        checkHierarchy: true,
                        interactive: true,
                        boundingType: "rect",
                        children: {
                            inner: {
                                type: "tm.display.CanvasElement",
                                originY: 0,
                                lastElementY: 20,
                            },
                        },
                    },
                },
            });

            this.scrollArea.on("pointingmove", function(e) {
                this.inner.y += e.app.pointing.deltaPosition.y;
            });

            this._getData(leaderboard);
        },

        _getData: function(leaderboard) {
            var self = this;

            var reqSocial = gapi.client.games.scores.listWindow({
                playerId: "me",
                leaderboardId: leaderboard.id,
                collection: "social",
                timeSpan: "all_time",
                maxResults: 20,
            });
            var reqPublic = gapi.client.games.scores.list({
                leaderboardId: leaderboard.id,
                collection: "public",
                timeSpan: "all_time",
                maxResults: 20,
            });

            reqSocial.execute(function(res) {
                console.log(res);
                if (!res.error) {
                    self._buildSocialList(res);
                    reqPublic.execute(function(res) {
                        console.log(res);
                        if (!res.error) {
                            self._buildPublicList(res)
                        }
                    });
                }
            });
        },

        _buildSocialList: function(scores) {
            var self = this;

            tm.display.Label("友達:{0}人".format(scores.numScores), 22)
                .setFillStyle("black")
                .setAlign("left")
                .setPosition(self.param.width * -0.5 + 20, self.scrollArea.inner.lastElementY)
                .setFontWeight("bold")
                .addChildTo(self.scrollArea.inner);

            self.scrollArea.inner.lastElementY += 50;

            if (scores.items) {
                scores.items.forEach(function(score, i) {
                    tm.google.RankingScene.Item(400, 80, score, this.param)
                        .setPosition(0, self.scrollArea.inner.lastElementY)
                        .addChildTo(self.scrollArea.inner);
                    self.scrollArea.inner.lastElementY += 80;
                });
            }
        },

        _buildPublicList: function(scores) {
            var self = this;

            self.scrollArea.inner.lastElementY -= 20;

            tm.display.Label("全プレイヤー:{0}人".format(scores.numScores), 22)
                .setFillStyle("black")
                .setAlign("left")
                .setPosition(self.param.width * -0.5 + 20, self.scrollArea.inner.lastElementY)
                .setFontWeight("bold")
                .addChildTo(self.scrollArea.inner);

            self.scrollArea.inner.lastElementY += 50;

            if (scores.items) {
                scores.items.forEach(function(score, i) {
                    tm.google.RankingScene.Item(400, 80, score, this.param)
                        .setPosition(0, self.scrollArea.inner.lastElementY)
                        .addChildTo(self.scrollArea.inner);
                    self.scrollArea.inner.lastElementY += 80;
                });
            }
        },

    });

    tm.define("tm.google.RankingScene.Item", {
        superClass: "tm.display.CanvasElement",

        init: function(width, height, score, sceneParam) {
            var self = this;
            this.superInit();
            this.fromJSON({
                width: width,
                height: height,
                interactive: true,
                checkHierarchy: true,
                boundingType: "rect",
                children: {
                    rank: {
                        type: "tm.display.Label",
                        init: [score.scoreRank, 32],
                        fillStyle: "rgb(20, 20, 20)",
                        fontWeight: "bold",
                        x: -width * 0.5 + 40,
                        y: 0,
                    },
                    circle: {
                        type: "tm.display.RoundRectangleShape",
                        init: {
                            width: 60,
                            height: 60,
                            fillStyle: "black",
                            strokeStyle: "transparent",
                        },
                        x: -width * 0.5 + 40 + 80,
                        y: 0,
                    },
                    icon: {
                        type: "tm.display.Sprite",
                        init: [tm.google.LeaderboardScene.Item.DEFAULT_TEXTURE, 60, 60],
                        x: -width * 0.5 + 40 + 80,
                        y: 0,
                    },
                    playerName: {
                        type: "tm.display.Label",
                        init: [score.player.displayName, 24],
                        fillStyle: "rgb(20, 20, 20)",
                        align: "left",
                        fontWeight: "bold",
                        x: -width * 0.5 + 40 + 80 + 50,
                        y: -12,
                    },
                    score: {
                        type: "tm.display.Label",
                        init: [score.formattedScore, 18],
                        fillStyle: "rgb(120, 120, 120)",
                        align: "left",
                        x: -width * 0.5 + 40 + 80 + 50,
                        y: 16,
                    },
                },
            });

            if (score.player.avatarImageUrl) {
                tm.asset.Texture(score.player.avatarImageUrl)
                    .on("load", function() {
                        self.icon.image = this;
                    });
            }

            // this.on("pointingstart", function(e) {
            //     this.initialY = e.pointing.y;
            // });
            // this.on("pointingend", function(e) {
            //     if (Math.abs(this.initialY - e.pointing.y) < 10) {
            //         e.app.pushScene(tm.google.RankingScene(leaderboard, sceneParam));
            //     }
            // });
        },
    });

})();
