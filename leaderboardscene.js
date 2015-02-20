(function() {

    var ITEM_DEFAULT_TEXTURE = null;
    tm.main(function() {
        ITEM_DEFAULT_TEXTURE = tm.graphics.Canvas()
            .resize(512, 512)
            .setStrokeStyle("hsl(180, 60%, 50%)")
            .setLineStyle(10)
            .strokeCircle(256, 256, 160);
    });

    tm.define("tm.google.LeaderboardScene", {
        superClass: "tm.app.Scene",
        init: function(param) {
            var self = this;
            self.superInit();

            self.param = param = {}.$extend(tm.google.LeaderboardScene.DEFAULT_PARAM, param);

            self.applicationId = param.applicationId;

            self.fromJSON({
                children: {
                    bg: {
                        type: "tm.display.RectangleShape",
                        init: {
                            width: param.width,
                            height: param.height,
                            strokeStyle: "transparent",
                            fillStyle: param.backgroundColor,
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
                            shadowColor: "black",
                            shadowBlur: 5,
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
                            self.app.popScene();
                        },
                    },
                    buttons: {
                        type: "tm.display.CanvasElement",
                        y: 75,
                        children: {
                            leaderboardButton: {
                                type: "tm.google.LeaderboardScene.RadioButton",
                                init: {
                                    text: "Leaderboard",
                                    width: 130,
                                    height: 32,
                                    fontSize: 18,
                                    backgroundColor: "white",
                                    foregroundColor: param.foregroundColor,
                                },
                                x: param.width * 0.5 - 70,
                            },
                            achievementButton: {
                                type: "tm.google.LeaderboardScene.RadioButton",
                                init: {
                                    text: "達成項目",
                                    width: 130,
                                    height: 32,
                                    fontSize: 18,
                                    backgroundColor: "white",
                                    foregroundColor: param.foregroundColor,
                                },
                                x: param.width * 0.5 + 70,
                                onpush: function() {},
                            },
                        },
                    },

                    listView: {
                        type: "tm.ui.ListView",
                        x: param.width * 0.5,
                        y: 100,
                        width: param.width,
                        height: param.height - 100,
                        getView: function(item, view) {
                            if (view) {
                                return view.setItem(item);
                            } else if (item.kind === "games#leaderboard") {
                                return tm.google.LeaderboardScene.Item(400, 80, item);
                            } else {
                                return tm.ui.SimpleListViewItem(400, 40, item);
                            }
                        },
                        onItemClick: function(item, view) {
                            self.app.pushScene(tm.google.RankingScene(item, param));
                        },
                    },
                },
            });

            this.buttons.leaderboardButton.selected = true;
            this.buttons.achievementButton.selected = false;

            Promise.all([
                self._getGameData(),
                self._getLeaderboardData(),
            ]).then(function() {
                self.listView.updateItems();
            });
        },

        _getGameData: function() {
            var self = this;

            return new Promise(function(resolve, reject) {

                var req = gapi.client.games.applications.get({
                    applicationId: self.applicationId,
                    language: "ja",
                });
                req.execute(function(res) {
                    if (!res.error) {
                        self.title.text = res.name;
                        self.listView.items.push("Leaderboard: {0}件".format(res.leaderboard_count));

                        resolve();
                    } else {
                        reject(res.error);
                    }
                });

            });
        },

        _getLeaderboardData: function() {
            var self = this;

            return new Promise(function(resolve, reject) {

                var req = gapi.client.games.leaderboards.list({
                    language: "ja",
                });
                req.execute(function(res) {
                    if (!res.error) {
                        res.items.forEach(function(leaderboard) {
                            self.listView.items.push(leaderboard);
                        });
                        self.listView.updateItems();

                        resolve();
                    } else {
                        reject(res.error);
                    }
                });

            });
        },
    });

    tm.google.LeaderboardScene.DEFAULT_PARAM = {
        applicationId: null,
        width: 640,
        height: 960,
        backgroundColor: "rgba(240, 240, 240, 0.95)",
        foregroundColor: "hsl(180, 60%, 50%)",
    };

    tm.define("tm.google.LeaderboardScene.Item", {
        superClass: "tm.ui.ListViewItem",

        init: function(width, height, leaderboard) {
            var self = this;
            this.superInit(width, height);
            this.fromJSON({
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
                        init: [ITEM_DEFAULT_TEXTURE, 60, 60],
                        x: -width * 0.5 + 40,
                        y: 0,
                    },
                    title: {
                        type: "tm.display.Label",
                        init: ["loading...", 24],
                        fillStyle: "rgb(20, 20, 20)",
                        align: "left",
                        fontWeight: "bold",
                        x: -width * 0.5 + 40 + 50,
                        y: 0,
                    },
                },
            });

            this.setItem(leaderboard);
        },

        setItem: function(item) {
            var self = this;
            self.title.text = item.name;
            if (item.iconUrl) {
                tm.asset.Texture(item.iconUrl)
                    .on("load", function() {
                        self.icon.image = this;
                    });
            }
            return tm.ui.ListViewItem.prototype.setItem.call(self, item);
        },
    });

    tm.define("tm.google.RankingScene", {
        superClass: "tm.app.Scene",

        init: function(leaderboard, param) {
            console.log("ranking scene id = " + leaderboard.id);
            var self = this;
            self.superInit();
            self.fromJSON({
                leaderboard: leaderboard,
                param: param,
                children: {
                    bg: {
                        type: "tm.display.RectangleShape",
                        init: {
                            width: param.width,
                            height: param.height,
                            strokeStyle: "transparent",
                            fillStyle: param.backgroundColor,
                        },
                        originX: 0,
                        originY: 0,
                    },
                    headerBg: {
                        type: "tm.display.RectangleShape",
                        init: {
                            width: param.width,
                            height: 150,
                            strokeStyle: "transparent",
                            fillStyle: "white",
                            shadowColor: "black",
                            shadowBlur: 5,
                        },
                        x: param.width * 0.5,
                        y: 150 * 0.5,
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

                    timeSpanButtons: {
                        type: "tm.google.LeaderboardScene.RadioButtonGroup",
                        y: 75,
                        onchange: function() {
                            self.loadData();
                        },
                        children: {
                            allTimeButton: {
                                type: "tm.google.LeaderboardScene.RadioButton",
                                init: {
                                    text: "すべての時間",
                                    width: 130,
                                    height: 32,
                                    fontSize: 18,
                                    backgroundColor: "white",
                                    foregroundColor: param.foregroundColor,
                                },
                                x: param.width * 0.5 - 140,
                            },
                            dailyButton: {
                                type: "tm.google.LeaderboardScene.RadioButton",
                                init: {
                                    text: "今日",
                                    width: 130,
                                    height: 32,
                                    fontSize: 18,
                                    backgroundColor: "white",
                                    foregroundColor: param.foregroundColor,
                                },
                                x: param.width * 0.5,
                            },
                            weeklyButton: {
                                type: "tm.google.LeaderboardScene.RadioButton",
                                init: {
                                    text: "今週",
                                    width: 130,
                                    height: 32,
                                    fontSize: 18,
                                    backgroundColor: "white",
                                    foregroundColor: param.foregroundColor,
                                },
                                x: param.width * 0.5 + 140,
                                onpush: function() {},
                            },
                        },
                    },

                    windowButtons: {
                        type: "tm.google.LeaderboardScene.RadioButtonGroup",
                        y: 125,
                        onchange: function() {
                            self.loadData();
                        },
                        children: {
                            me: {
                                type: "tm.google.LeaderboardScene.RadioButton",
                                init: {
                                    text: "自分のスコア",
                                    width: 130,
                                    height: 32,
                                    fontSize: 18,
                                    fillStyle: "hsl(180, 60%, 50%)",
                                    strokeStyle: "hsl(180, 60%, 50%)",
                                    textColor: "white",
                                    backgroundColor: "white",
                                    foregroundColor: param.foregroundColor,
                                },
                                x: param.width * 0.5 - 70,
                            },
                            top: {
                                type: "tm.google.LeaderboardScene.RadioButton",
                                init: {
                                    text: "トップスコア",
                                    width: 130,
                                    height: 32,
                                    fontSize: 18,
                                    fillStyle: "white",
                                    strokeStyle: "hsl(180, 60%, 50%)",
                                    textColor: "hsl(180, 60%, 50%)",
                                    backgroundColor: "white",
                                    foregroundColor: param.foregroundColor,
                                },
                                x: param.width * 0.5 + 70,
                            },
                        },
                    },

                    listView: {
                        type: "tm.ui.ListView",
                        width: param.width,
                        height: param.height - 150,
                        x: param.width * 0.5,
                        y: 150,
                        getView: function(item, view) {
                            if (view) {
                                return view.setItem(item);
                            } else if (item.kind === "games#leaderboardEntry") {
                                return tm.google.RankingScene.Item(400, 80, item);
                            } else if (item.kind === "next") {
                                return tm.ui.SimpleListViewItem(400, 40, item.text).setTextColor(item.textColor);
                            } else if (typeof(item) === "string") {
                                return tm.ui.SimpleListViewItem(400, 40, item);
                            }
                        },
                        onItemClick: function(item) {},
                    },
                },
            });

            self.timeSpanButtons.selected = 0;
            self.windowButtons.selected = 0;

            self.loadData();
        },

        loadData: function() {
            var self = this;

            self.listView.items.clear();
            self.listView.updateItems();

            var promise =  new Promise(function(resolve, reject) {

                var method = ["listWindow", "list"][self.windowButtons.selected];

                var req = gapi.client.games.scores[method]({
                    leaderboardId: self.leaderboard.id,
                    collection: "public",
                    timeSpan: ["all_time", "daily", "weekly"][self.timeSpanButtons.selected],
                    maxResults: 20,
                });
                req.execute(function(res) {
                    if (!res.error) {
                        self.listView.items.push("全プレイヤー：{0}人".format(res.numScores));
                        if (res.items && res.items.length) {
                            res.items.forEach(function(item) {
                                self.listView.items.push(item);
                            });

                            self.listView.items.push({
                                kind: "next",
                                text: "さらに表示…",
                                textColor: self.param.foregroundColor,
                            });
                        }
                        resolve();
                    } else {
                        reject(res.error);
                    }
                });

            });

            promise.then(function() {
                self.listView.updateItems();
            });
        },
    });

    tm.define("tm.google.RankingScene.Item", {
        superClass: "tm.ui.ListViewItem",

        init: function(width, height, score) {
            var self = this;
            console.log(score);
            this.superInit(width, height);
            this.fromJSON({
                children: {
                    rank: {
                        type: "tm.display.Label",
                        init: ["?", 32],
                        fillStyle: "rgb(20, 20, 20)",
                        fontWeight: "bold",
                        x: -width * 0.5 + 40,
                        y: 0,
                    },
                    icon: {
                        type: "tm.display.Sprite",
                        init: [ITEM_DEFAULT_TEXTURE, 60, 60],
                        x: -width * 0.5 + 40 + 80,
                        y: 0,
                    },
                    playerName: {
                        type: "tm.display.Label",
                        init: ["loading...", 24],
                        fillStyle: "rgb(20, 20, 20)",
                        align: "left",
                        fontWeight: "bold",
                        x: -width * 0.5 + 40 + 80 + 50,
                        y: -12,
                    },
                    score: {
                        type: "tm.display.Label",
                        init: ["loading...", 18],
                        fillStyle: "rgb(120, 120, 120)",
                        align: "left",
                        fontFamily: "monospace",
                        x: -width * 0.5 + 40 + 80 + 50,
                        y: 16,
                    },
                },
            });

            this.setItem(score);
        },

        setItem: function(item) {
            var self = this;
            self.rank.text = item.scoreRank;
            self.playerName.text = item.player.displayName;
            self.score.text = item.formattedScore;
            if (item.player.avatarImageUrl) {
                tm.asset.Texture(item.player.avatarImageUrl)
                    .on("load", function() {
                        self.icon.image = this;
                    });
            }
            return tm.ui.ListViewItem.prototype.setItem.call(self, item);
        }
    });

    tm.define("tm.google.LeaderboardScene.RadioButton", {
        superClass: "tm.ui.FlatButton",

        init: function(param) {
            this.superInit(param);
            this.param = param;
            this._selected = false;

            var self = this;

            this.on("push", function() {
                if (this.selected) return;

                if (this.parent instanceof tm.google.LeaderboardScene.RadioButtonGroup) {
                    this.parent.flare("change");
                    this.parent.children.filter(function(c) {
                        return c instanceof tm.google.LeaderboardScene.RadioButton;
                    }).forEach(function(b) {
                        b.selected = b === self;
                    });
                }
            });
        },
    });

    tm.google.LeaderboardScene.RadioButton.prototype.accessor("selected", {
        set: function(v) {
            this._selected = v;
            if (v) {
                this.fillStyle = this.param.foregroundColor;
                this.strokeStyle = this.param.foregroundColor;
                this.label.fillStyle = this.param.backgroundColor;
            } else {
                this.fillStyle = this.param.backgroundColor;
                this.strokeStyle = this.param.foregroundColor;
                this.label.fillStyle = this.param.foregroundColor;
            }
        },
        get: function() {
            return this._selected;
        },
    });

    tm.define("tm.google.LeaderboardScene.RadioButtonGroup", {
        superClass: "tm.display.CanvasElement",

        init: function() {
            this.superInit();
        },

        setSelected: function(index) {
            this.children.forEach(function(c, i) {
                c.selected = i === index;
            });
        },
    });

    tm.google.LeaderboardScene.RadioButtonGroup.prototype.accessor("selected", {
        set: function(v) {
            this.setSelected(v);
        },
        get: function() {
            for (var i = 0, end = this.children.length; i < end; i++) {
                if (this.children[i].selected) {
                    return i;
                }
            }
            return -1;
        },
    });
})();
