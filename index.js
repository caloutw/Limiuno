import fs, { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import { Client, GatewayIntentBits, MessageFlags, Partials, PermissionsBitField, ChannelType, AuditLogEvent, REST, Routes, EmbedBuilder } from "discord.js";
import nodePinyin from "node-pinyin";
import nzhhk from "nzh/hk";

const __dirname = fileURLToPath(dirname(import.meta.url));

const config = JSON.parse(fs.readFileSync(path.join(__dirname, "config.json")));
const client = new Client({
    intents: Object.keys(GatewayIntentBits).map(v => GatewayIntentBits[v]),
    partials: Object.keys(Partials).map(v => Partials[v])
});

//intialization the data file
const data = [
    { name: "dvc.json", type: "object" },
    { name: "_temporary-dvc.json", type: "object" },
    { name: "tone.json", type: "object" },
    { name: "checkToneList.json", type: "object" },
    { name: "alreadyToneReport.json", type: "array" },
    { name: "coin.json", type: "object" },
    { name: "daily.json", type: "object" }
];

data.forEach(v => {
    if (!fs.existsSync(path.join(__dirname, "data", v.name))) {
        fs.mkdirSync(path.join(__dirname, "data"), { recursive: true });
        fs.writeFileSync(path.join(__dirname, "data", v.name), v.type == "object" ? "{}" : "[]");
    }

    try { JSON.parse(readFileSync(path.join(__dirname, "data", v.name))); }
    catch { fs.writeFileSync(path.join(__dirname, "data", v.name), v.type == "object" ? "{}" : "[]"); }
})

let dvc = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "dvc.json")));
let dvcTemporary = fs.existsSync(path.join(__dirname, "data", "_temporary-dvc.json")) ? JSON.parse(fs.readFileSync(path.join(__dirname, "data", "_temporary-dvc.json"))) : {};
let tone = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "tone.json")));
let checkToneList = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "checkToneList.json")));
let alreadyToneReport = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "alreadyToneReport.json")));
let coin = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "coin.json")));
let daily = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "daily.json")));

function reloadData(){
    dvc = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "dvc.json")));
    dvcTemporary = fs.existsSync(path.join(__dirname, "data", "_temporary-dvc.json")) ? JSON.parse(fs.readFileSync(path.join(__dirname, "data", "_temporary-dvc.json"))) : {};
    tone = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "tone.json")));
    checkToneList = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "checkToneList.json")));
    alreadyToneReport = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "alreadyToneReport.json")));
    coin = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "coin.json")));
    daily = JSON.parse(fs.readFileSync(path.join(__dirname, "data", "daily.json")));
}

async function reloadCommand() {
    const command = JSON.parse(fs.readFileSync(path.join(__dirname, "commands.json")));

    const rest = new REST({ version: '10' }).setToken(config["discord-token"]);

    await rest.put(Routes.applicationCommands(client.user.id), {
        body: command
    });

    return true;
}

async function coinManager(user, count = null, set = null) {
    if (count === null && set === null) return coin[user];

    if (!coin[user]) coin[user] = 0;

    if (coin[user] + count < 0 && set === null) return false;

    if(set === null) coin[user] += count;
    else coin[user] = set || 0;

    fs.writeFileSync(path.join(__dirname, "data", "coin.json"), JSON.stringify(coin));
    return true;
}

let msg;

client.on("clientReady", async () => {
    await reloadCommand();
    console.clear();
    console.log(`Discord bot client is logged use ${client.user.displayName}.`);

    /*
    let targetDate = 1768612800; // 2025/01/15 08:00:00 GMT+8
    const channel = await client.channels.cache.get("1460941921269579929");
    msg = await channel.messages.fetch("1462696765722460305");

    let testList = [
        { startDate: 1768815000, endDate: 1768827600, note: "郭胖X50 舞萌DX 預約局", isTest: true, nextDay: true },
    ];

    const replyInterval = async () => {
        let nowDate = Math.floor(Date.now() / 1000);

        let remainTime = targetDate - nowDate;

        const colorRAND = (() => {
            let colorList = [];

            for(let i = 0; i < 3; i++){
                colorList[i] = (Math.floor(Math.random() * ((255 + 0) - 0)) + 0).toString(16).toString().padStart(2, "0");
            }

            return colorList.join("");
        })();

        const day = Math.floor(remainTime / 86400);
        const hours = Math.floor((remainTime % 86400) / 3600);
        const minutes = Math.floor((remainTime % 3600) / 60);
        const seconds = remainTime % 60;

        const nowTest = testList.find(v => nowDate >= v.startDate && nowDate < v.endDate) || null;
        const nextAct = testList.find(v => nowDate < v.startDate) || null;
        const nextTest = testList.find(v => nowDate < v.startDate && v.isTest) || null;

        if (!nowTest && !nextAct) return;

        const leftTestList = testList.filter(v => v.startDate > nowDate);

        const embed = new EmbedBuilder()
            .setTitle("該死的倒數計時器")
            .setURL("https://youtu.be/dQw4w9WgXcQ?si=2JwScOgaDAJgq6xC")
            .setDescription((remainTime >= 0) ? `倒數 **${day.toString().padStart(2, "0")} 天 ${hours.toString().padStart(2, "0")} 時 ${minutes.toString().padStart(2, "0")} 分 ${seconds.toString().padStart(2, "0")} 秒 **\n倒數 **${remainTime}** 秒` : `正在進行中`)
            .addFields(
                {
                    name: "目前還剩",
                    value: (nowTest?.isTest) ? `**${(nowTest) ? (nowTest.endDate - nowDate) : (targetDate - nowDate)}** 秒` : "目前沒有活動",
                    inline: true
                },
                {
                    name: "",
                    value: "",
                    inline: true
                },
                {
                    name: "距離下個活動",
                    value: `**${(nextTest?.isTest) ? (nextTest.startDate - nowDate) + " 秒" : "找不到活動"}**`,
                    inline: true
                },
                {
                    name: "",
                    value: "",
                    inline: false
                },
                {
                    name: "目前狀況",
                    value: `${nowTest?.isTest ? "📝" : "💤"} ${nowTest ? nowTest.note : "沒有活動"}`,
                    inline: true
                },
                {
                    name: "",
                    value: "",
                    inline: true
                },
                {
                    name: "接下來",
                    value: `${nextAct?.isTest ? "📝" : "💤"} ${nextAct ? nextAct.note : "沒有活動"}`,
                    inline: true
                },
                {
                    name: "剩餘的行程表",
                    value: leftTestList.map(v => {
                        let testStartDate = new Date(v.startDate * 1000);
                        let testEndDate = new Date(v.endDate * 1000);

                        //UTC+8
                        testStartDate = new Date(testStartDate.getTime() + (8 * 60 * 60 * 1000));
                        testEndDate = new Date(testEndDate.getTime() + (8 * 60 * 60 * 1000));

                        const testStartDateD = `${testStartDate.getDate().toString().padStart(2, "0")}`;
                        const testStartDateHMS = `${testStartDate.getHours().toString().padStart(2, "0")}:${testStartDate.getMinutes().toString().padStart(2, "0")}`;
                        const testEndDateHMS = `${testEndDate.getHours().toString().padStart(2, "0")}:${testEndDate.getMinutes().toString().padStart(2, "0")}`;

                        return `${v?.nextDay ? `\n${testStartDateD} 號的行程表\n` : ""} ${v?.isTest ? "📝" : "💤"} ${testStartDateHMS} - ${testEndDateHMS} ${v.note}`;
                    }).join("\n"),
                    inline: false
                }
            )
            .setColor(`#${colorRAND}`)
            .setFooter({
                text: "Limiuno",
            })
            .setTimestamp();

        //{ embeds: [embed] }

        if (msg) await msg.edit({ embeds: [embed], content: "" });
        else msg = await channel.send({ embeds: [embed], content: "" });

        //console.log(`該死的學測還剩 ${hours} 小時 ${minutes} 分 ${seconds} 秒！`);
        await new Promise(resolve => setTimeout(resolve, 3000));
        replyInterval();
    }
    replyInterval();
    */
});

client.on("messageCreate", async (message) => {
    const reference = await (async () => {
        if (message.reference === null) return undefined;

        try {
            let guild = await client.guilds.fetch(message.reference.guildId);
            let channel = await guild.channels.fetch(message.reference.channelId);
            let refMessage = await channel.messages.fetch(message.reference.messageId);

            return refMessage;
        } catch (error) {
            return false;
        }

        return undefined;
    })();

    if (message.author.id == client.user.id) return;
    if (message.author.bot) return;

    if (["533626245871697940", "783836181544173579"].includes(message.author.id) && message.content === "1145141919810-RELOAD-YOUR-MOM"){
        reloadData();
        message.reply("IM YOUR HOME.")
        return;
    }

    if (checkToneList.length === 0) {
        checkToneList = ["114514", "12345", "54321", "1111", "2222", "3333", "4444", "5555", "1234", "4321"];
        fs.writeFileSync(path.join(__dirname, "data", "checkToneList.json"), JSON.stringify(checkToneList));
    }

    async function messagePinyinChecker() {
        let checkPinyinList = [{
            pinyin: ["ji", "ba"],
            reply: "對了，說到{_WORD_}"
        }];

        let messageRename = message.content.replace(/<@!?[0-9]+>/g, "").replace(/https?:\/\/\S+/g, "").replace(/<a?:\w+:\d+>/g, "").replace(/\s+/g, " ").replaceAll("\n", "").replaceAll(" ", "").trim();
        let messageBuffer = messageRename.split("").map(v => nzhhk.encodeS(v)).join("");
        let messagePinyin = nodePinyin(messageBuffer, { style: "toneWithNumber" });

        let flag = 0;

        for (let i in messagePinyin) {
            const wordForm = { word: "", pinyin: "", tone: -1 };
            if (messageBuffer.slice(flag, messageBuffer.length).startsWith(messagePinyin[i])) {
                wordForm.word = messagePinyin[i][0];
                wordForm.pinyin = "_";
                wordForm.tone = 0;
                flag += messagePinyin[i][0].length;
            } else {
                wordForm.word = messageRename[flag];
                wordForm.pinyin = (messagePinyin[i][0].endsWith("undefined")) ? messagePinyin[i][0].replaceAll("undefined", "") : messagePinyin[i][0].slice(0, -1);
                wordForm.tone = (messagePinyin[i][0].endsWith("undefined")) ? 5 : parseInt(messagePinyin[i][0].at(-1));
                flag++;
            }

            messagePinyin[i] = wordForm;
        }

        for (let v of checkToneList) {
            const messagePinyinTone = messagePinyin.map(x => x.tone).join("");
            const messagePosition = messagePinyinTone.indexOf(v);
            if (messagePosition >= 0) {
                let findContent = messagePinyin.slice(messagePosition, messagePosition + v.length);
                if (findContent.filter(v => v.word == findContent[0].word).length == v.length) return;

                const coin = (parseInt(Math.random() * (15 - 1 + 1)) + 1) + 1;
                let coinStatus = await coinManager(message.author.id, -coin);
                if(!coinStatus) await coinManager(message.author.id, 0, 0);
            
                if(!coinStatus){
                    await message.channel.send({
                        content: `<@${message.author.id}>非常抱歉，由於您現在沒有金錢，因此無法有效地發出該訊息，訊息將在 **5** 秒鐘後移除，還請您注意聲調 ! `
                    });
                    try {
                        setTimeout(async () => await message.delete(), 5 * 1000);
                    } catch (e) { console.log("訊息已經刪除"); }
                } else await message.reply(`⚠️你正在說聲調笑話，聲調數: **${v}**，對映的單詞是: **${messagePinyin.slice(messagePosition, messagePosition + v.length).map(x => x.word).join("")}** (金額 -${coin}$，你還剩下 ${await coinManager(message.author.id)}$)`);
            }
        }

        for (let v of checkPinyinList) {
            const messagePinyinPinyin = messagePinyin.map(v => v.pinyin);
            for (let x = 0; x < messagePinyinPinyin.length - (v.pinyin.length - 1); x++) {
                for (let o = 0; o < v.pinyin.length; o++) {
                    if (messagePinyinPinyin[x + o] !== v.pinyin[o]) break;

                    if (o == v.pinyin.length - 1) {
                        message.reply(v.reply.replaceAll("{_WORD_}", messagePinyin.slice(x, x + v.pinyin.length).map(z => z.word).join("")));
                    }
                }
            }
        }

        return;
    }

    async function messagePinyinReport() {
        let banned = ["868033492825546752", "783836181544173579"];

        const messageList = message.content.split(" ");
        if (messageList.length < 2) return;

        if (reference === false) {
            message.reply("有點問題，請重新舉報一次");
            return;
        }

        if (!reference) {
            message.reply("請先使用「回應訊息」");
            return;
        }

        if (reference.author.id == client.user.id) {
            message.reply("舉報失敗，你不能舉報我");
            return;
        }

        if (reference.author.id == message.author.id) {
            message.reply("舉報失敗，你不能舉報自己");
            return;
        }

        if (banned.includes(reference.author.id) || banned.includes(message.author.id)) {
            message.reply("無法使用這項功能！");
            return;
        }

        if (messageList[1] == "強舉報" && message.author.id === "783836181544173579") {
            let newReply = await reference.reply(`你已被標記。`);
            message.delete();

            alreadyToneReport.push(reference.id);
            alreadyToneReport.push(newReply.id);

            fs.writeFileSync(path.join(__dirname, "data", "alreadyToneReport.json"), JSON.stringify(alreadyToneReport));
            return;
        }

        if (isNaN(parseInt(messageList[1]))) {
            reference.reply(`來自 <@${message.member.id}>: ${messageList[1]}`);
            message.delete();
            return;
        }

        if (alreadyToneReport.includes(reference.id)) {
            message.reply("舉報失敗，這個訊息已經被舉報過了");
            return;
        }

        if (!checkToneList.includes(messageList[1])) {
            message.reply("舉報失敗，不在聲調清單中");
            return;
        }

        if (!coinManager(message.member.id, -5)) {
            message.reply("你的錢包需要有 5$ 才能舉報！ (使用 `/錢包` 查看餘額 或者 `/每日獎勵` 獲得金幣)");
            return;
        }

        let messageRename = reference.content.replace(/<@.*>/gm, "").replace(/<:\w+:\d+>/g, "");
        let messageBuffer = messageRename.split("").map(v => nzhhk.encodeS(v)).join("");
        let messagePinyin = nodePinyin(messageBuffer, { style: "toneWithNumber" });

        let flag = 0;

        for (let i in messagePinyin) {
            const wordForm = { word: "", pinyin: "", tone: -1 };
            if (messageBuffer.slice(flag, messageBuffer.length).startsWith(messagePinyin[i])) {
                wordForm.word = messagePinyin[i][0];
                wordForm.pinyin = "_";
                wordForm.tone = 0;
                flag += messagePinyin[i][0].length;
            } else {
                wordForm.word = messageRename[flag];
                wordForm.pinyin = (messagePinyin[i][0].endsWith("undefined")) ? messagePinyin[i][0].replaceAll("undefined", "") : messagePinyin[i][0].slice(0, -1);
                wordForm.tone = (messagePinyin[i][0].endsWith("undefined")) ? 5 : parseInt(messagePinyin[i][0].at(-1));
                flag++;
            }

            messagePinyin[i] = wordForm;
        }

        const messagePinyinTone = messagePinyin.map(x => x.tone).join("");
        const messagePosition = messagePinyinTone.indexOf(messageList[1]);
        console.log(messagePinyin, messageList[1]);
        const findContent = messagePinyin.slice(messagePosition, messagePosition + messageList[1].length);
        if (messagePosition >= 0) {
            if (findContent.filter(v => v.word == findContent[0].word).length == messageList[1].length) {
                message.reply("舉報失敗，扣 **5$**，這是重複疊詞");
                return;
            }

            const coin = (parseInt(Math.random() * (10 - 1 + 1)) + 1) + 5;
            let newReply = await reference.reply(`⚠️你已被舉報，聲調數: **${messageList[1]}**，對映的單詞是: **${findContent.map(x => x.word).join("")}**，舉報者獲得: **${coin}$**`);
            await message.delete();

            alreadyToneReport.push(reference.id);
            alreadyToneReport.push(newReply.id);
            coinManager(message.author.id, coin);
        } else {
            message.reply("舉報失敗，扣 **5$**，找不到該聲調組合！");
            return;
        }

        fs.writeFileSync(path.join(__dirname, "data", "alreadyToneReport.json"), JSON.stringify(alreadyToneReport));
        return;
    }

    async function newTest() {
        msg = null;
        return;
    }


    //if (!tone[message.guild.id]) messagePinyinChecker(message.content);
    //if (tone[message.guild.id] && message.content.startsWith("-舉報")) messagePinyinReport();
    //if (message.content == "1145141919810-newTestList") newTest();
});

client.on("interactionCreate", async (interaction) => {
    const permissions = interaction.channel.permissionsFor(client.user);
    const userPermissions = interaction.channel.permissionsFor(interaction.member);
    const locale = interaction.locale;
    const options = interaction.options;

    if (interaction.commandName === "random") {
        const
            cant_say_anything = {
                "zh-TW": "我沒辦法在這頻道發言！",
                "ja": "このチャンネルで発言できません！"
            }, min_less_then_0 = {
                "zh-TW": "最低數不可以小於0！",
                "ja": "最小値は0以上である必要があります"
            }, max_less_then_min = {
                "zh-TW": "最大數不可以小於最小數！",
                "ja": "最大値は最小値以上である必要があります"
            }, rand_num_is = {
                "zh-TW": "隨機數是: **{RANDOM}**",
                "ja": "乱数は: **{RANDOM}**"
            };

        if (!permissions.has(PermissionsBitField.Flags.SendMessages)) {
            interaction.reply({ content: cant_say_anything[locale] || "I can't send message on this channel.", flags: MessageFlags.Ephemeral });
            return false;
        }

        const min = options.get("min").value;
        const max = options.get("max").value;

        const toggleType = [
            {
                condition: min < 0,
                message: min_less_then_0[locale] || "Min value can't smaller then 0!"
            },
            {
                condition: max <= min,
                message: max_less_then_min[locale] || "Max value can't smaller then min!"
            }
        ].filter(v => v.condition);

        if (toggleType.length >= 1) {
            interaction.reply({ content: toggleType[0].message, flags: MessageFlags.Ephemeral });
            return false;
        }

        const rand = Math.floor(Math.random() * ((max + 1) - min)) + min;
        interaction.reply({ content: (rand_num_is[locale] || "Random number is: **{RANDOM}**").replaceAll("{RANDOM}", rand) });

        return true;
    }

    if (interaction.commandName === "set-dvc") {
        const channel = options.get("channel");
        const name = options.get("name")?.value || "{USERNAME}";
        const limit = options.get("limit")?.value || 0;

        const parentPermission = channel.channel.parent.permissionsFor(client.user);

        const
            cant_view_channel = {
                "zh-TW": "我不能檢視這個頻道群組！",
                "ja": "このチャンネルグループを表示できません！"
            },
            cant_manage_channel = {
                "zh-TW": "我沒辦法管理這個群組的頻道！",
                "ja": "このグループのチャンネルを管理できません！"
            },
            cant_manage_permission = {
                "zh-TW": "我沒辦法管理這個群組的權限！",
                "ja": "このグループの権限を管理できません！"
            },
            cant_join_cache_channel = {
                "zh-TW": "你不能設定這個臨時分身頻道！",
                "ja": "このチャンネルグループを設定できません！"
            },
            edit_completed = {
                "zh-TW": "頻道 `{CHANNEL}` 修改完畢。",
                "ja": "チャンネル `{CHANNEL}` の修正が完了しました。"
            },
            create_completed = {
                "zh-TW": "頻道 `{CHANNEL}` 設定完畢，可以再次使用本指令來修改本頻道設定。",
                "ja": "チャンネル `{CHANNEL}` の設定が完了しました。再度このコマンドを使用して、このチャンネルの設定を変更できます。"
            };

        if (!parentPermission.has(PermissionsBitField.Flags.ViewChannel)) {
            interaction.reply({ content: cant_view_channel[locale] || "I can't view this channel parent group.", flags: MessageFlags.Ephemeral });
            return false;
        };
        if (!parentPermission.has(PermissionsBitField.Flags.ManageChannels)) {
            interaction.reply({ content: cant_manage_channel[locale] || "I can't manage this group's channel.", flags: MessageFlags.Ephemeral });
            return false;
        };
        if (!parentPermission.has(PermissionsBitField.Flags.ManageRoles)) {
            interaction.reply({ content: cant_manage_permission[locale] || "I can't manage this group's permission.", flags: MessageFlags.Ephemeral });
            return false;
        };
        if (dvcTemporary[interaction.guild.id]) {
            if (dvcTemporary[interaction.guild.id][channel.channel.id]) {
                interaction.reply({ content: cant_join_cache_channel[locale] || "You can't set or edit this temporary channel.", flags: MessageFlags.Ephemeral });
                return false;
            }
        };

        if (!dvc[interaction.guild.id]) dvc[interaction.guild.id] = {};
        if (dvc[interaction.guild.id][channel.channel.id]) {
            dvc[interaction.guild.id][channel.channel.id].name = name || dvc[interaction.guild.id][channel.channel.id].name || "{USERNAME}";
            dvc[interaction.guild.id][channel.channel.id].limit = limit || dvc[interaction.guild.id][channel.channel.id].limit || 0;

            interaction.reply({ content: (edit_completed[locale] || "The `{CHANNEL}` channel setting was changed.").replaceAll("{CHANNEL}", channel.channel.name) });
        } else {
            dvc[interaction.guild.id][channel.channel.id] = { name, limit };
            interaction.reply({ content: (create_completed[locale] || "Channel `{CHANNEL}` create completed, you can try again this command to change setting.").replaceAll("{CHANNEL}", channel.channel.name) });
        }

        fs.writeFileSync(path.join(__dirname, "data", "dvc.json"), JSON.stringify(dvc));

        return true;
    }

    if (interaction.commandName === "remove-dvc") {
        const channel = options.get("channel");

        const
            no_recoder_this_channel = {
                "zh-TW": "這不是動態語音頻道！",
                "ja": "このダイナミックボイスチャンネルがありません！"
            },
            remove_completed = {
                "zh-TW": "已經移除。",
                "ja": "設定した。"
            };

        if (!dvc[interaction.guild.id]) {
            interaction.reply({ content: no_recoder_this_channel[locale] || "This is not dynamic voice channel.", flags: MessageFlags.Ephemeral });
            return false;
        } else if (!dvc[interaction.guild.id][channel.channel.id]) {
            interaction.reply({ content: no_recoder_this_channel[locale] || "This is not dynamic voice channel.", flags: MessageFlags.Ephemeral });
            return false;
        }

        delete dvc[interaction.guild.id][channel.channel.id];
        interaction.reply({ content: remove_completed[locale] || "Channel removed.", flags: MessageFlags.Ephemeral });

        fs.writeFileSync(path.join(__dirname, "data", "dvc.json"), JSON.stringify(dvc));

        return true;
    }

    if (interaction.commandName === "reset-dvc") {
        const channel = options.get("channel");

        const
            no_recoder_this_channel = {
                "zh-TW": "這不是動態語音頻道！",
                "ja": "このダイナミックボイスチャンネルがありません！"
            },
            reset_completed = {
                "zh-TW": "設置完成。",
                "ja": "設定した。"
            };

        if (!dvc[interaction.guild.id]) {
            interaction.reply({ content: no_recoder_this_channel[locale] || "This is not dynamic voice channel.", flags: MessageFlags.Ephemeral });
            return false;
        } else if (!dvc[interaction.guild.id][channel.channel.id]) {
            interaction.reply({ content: no_recoder_this_channel[locale] || "This is not dynamic voice channel.", flags: MessageFlags.Ephemeral });
            return false;
        } else if (!dvc[interaction.guild.id][channel.channel.id].custom) {
            interaction.reply({ content: reset_completed[locale] || "Reset completed.", flags: MessageFlags.Ephemeral });
            return false;
        };

        delete dvc[interaction.guild.id][channel.channel.id].custom[interaction.member.id]
        interaction.reply({ content: reset_completed[locale] || "Reset completed.", flags: MessageFlags.Ephemeral });

        fs.writeFileSync(path.join(__dirname, "data", "dvc.json"), JSON.stringify(dvc));

        return true;
    }

    if (interaction.commandName === "聲調警察.") {
        if (!userPermissions.has(PermissionsBitField.Flags.Administrator)) {
            interaction.reply({ content: "你不是管理員！", flags: MessageFlags.Ephemeral });
            return;
        }

        if (tone[interaction.guild.id] === undefined) {
            tone[interaction.guild.id] = {
                detect: false
            }
        }

        tone[interaction.guild.id] = !tone[interaction.guild.id];

        if (tone[interaction.guild.id] === false) interaction.reply({ content: "聲調偵測轉為主動模式！" });
        else interaction.reply({ content: "聲調偵測轉為被動模式！" });

        fs.writeFileSync(path.join(__dirname, "data", "tone.json"), JSON.stringify(tone));

        return;
    }

    if (interaction.commandName === "錢包.") {
        interaction.reply({ content: `你有: **${coin[interaction.member.id] || 0}$**`, flags: MessageFlags.Ephemeral });
        return;
    }

    if (interaction.commandName === "每日獎勵.") {
        if (daily[interaction.member.id] > (new Date()).getTime()) {
            interaction.reply({ content: `時間還沒到！你還剩下 ${(daily[interaction.member.id] - (new Date()).getTime()) / 1000} 秒！`, flags: MessageFlags.Ephemeral });
            return;
        }

        const coin = parseInt(Math.random() * (100 - 1 + 1)) + 1;
        interaction.reply({ content: `你已獲得: **${coin}$** !` });
        coinManager(interaction.member.id, coin);

        daily[interaction.member.id] = (new Date()).getTime() + (24 * 60 * 60 * 1000);

        fs.writeFileSync(path.join(__dirname, "data", "daily.json"), JSON.stringify(daily));
        return;
    }
});

client.on("voiceStateUpdate", async (oldState, newState) => {
    async function dvc_create_v1() {
        const parent = newState.channel.parent;
        const parentPermission = parent.permissionsFor(client.user);

        if (!dvc[newState.guild.id]) return;
        if (!dvc[newState.guild.id][newState.channel.id]) return;

        if (!parentPermission.has(PermissionsBitField.Flags.ViewChannel)) return;
        if (!parentPermission.has(PermissionsBitField.Flags.ManageChannels)) return;
        if (!parentPermission.has(PermissionsBitField.Flags.ManageRoles)) return;

        const dynamicSetting = (() => {
            let serverDefault = {
                "name": dvc[newState.guild.id][newState.channel.id].name || "{USERNAME}",
                "limit": dvc[newState.guild.id][newState.channel.id].limit || null,
                "region": null,
            };

            if (dvc[newState.guild.id][newState.channel.id].custom) {
                if (dvc[newState.guild.id][newState.channel.id].custom[newState.member.id]) {
                    if(Object.keys(dvc[newState.guild.id][newState.channel.id].custom[newState.member.id]).length !== 0) serverDefault = dvc[newState.guild.id][newState.channel.id].custom[newState.member.id];
                }
            }

            serverDefault.name = serverDefault.name.replaceAll("{USERUUID}", newState.member.id);
            serverDefault.name = serverDefault.name.replaceAll("{USERNAME}", newState.member.displayName);
            serverDefault.name = serverDefault.name.replaceAll("{USERNICK}", newState.member.nickname || newState.member.displayName);

            return serverDefault;
        })();

        const newRoom = await newState.guild.channels.create({
            name: dynamicSetting.name,
            type: ChannelType.GuildVoice,
            parent: newState.channel.parent.id,
            reason: "有人碰到動態語音了！",
            userLimit: dynamicSetting.limit,
            rtcRegion: dynamicSetting.region
        });

        await newRoom.permissionOverwrites.create(newState.member.id, {
            ManageChannels: true,
            ManageRoles: true,
            ViewChannel: true
        });

        if (!dvcTemporary[newState.guild.id]) dvcTemporary[newState.guild.id] = {};
        dvcTemporary[newState.guild.id][newRoom.id] = {
            owner: newState.member.id,
            parent: newState.channel.id
        };

        await newState.member.voice.setChannel(newRoom.id);

        fs.writeFileSync(path.join(__dirname, "data", "_temporary-dvc.json"), JSON.stringify(dvcTemporary));

        return true;
    }

    async function dvc_create_v2() {
        const parent = newState.channel.parent;
        const parentPermission = parent.permissionsFor(client.user);

        if (!dvc[newState.guild.id]) return;
        if (!dvc[newState.guild.id][newState.channel.id]) return;

        if (!parentPermission.has(PermissionsBitField.Flags.ViewChannel)) return;
        if (!parentPermission.has(PermissionsBitField.Flags.ManageChannels)) return;
        if (!parentPermission.has(PermissionsBitField.Flags.ManageRoles)) return;

        const newBaseRoom = await newState.channel.clone();

        await newState.channel.permissionOverwrites.create(client.user.id, {
            ManageChannels: true,
            ManageRoles: true,
            ViewChannel: true
        });

        /*
        newState.channel.permissionOverwrites.cache.forEach(v => {
            if (v.id == client.user.id) return;
            newState.channel.permissionOverwrites.delete(v.id);
        });
        */

        await newBaseRoom.setPosition(newState.channel.position);

        const dynamicSetting = (() => {
            let serverDefault = {};

            if (dvc[newState.guild.id][newState.channel.id]?.custom) {
                if (dvc[newState.guild.id][newState.channel.id].custom[newState.member.id]) {
                    serverDefault = dvc[newState.guild.id][newState.channel.id].custom[newState.member.id];
                }
            }

            if (!serverDefault.name) serverDefault.name = dvc[newState.guild.id][newState.channel.id].name || "{USERNAME}";
            if (!serverDefault.limit) serverDefault.limit = dvc[newState.guild.id][newState.channel.id].limit || 0;
            if (!serverDefault.region) serverDefault.region = dvc[newState.guild.id][newState.channel.id].region || null;

            serverDefault.name = serverDefault.name?.replaceAll("{USERUUID}", newState.member.id);
            serverDefault.name = serverDefault.name?.replaceAll("{USERNAME}", newState.member.displayName);
            serverDefault.name = serverDefault.name?.replaceAll("{USERNICK}", newState.member.nickname || newState.member.displayName);

            return serverDefault;
        })();

        try {
            newState.channel.setName(dynamicSetting.name);
            newState.channel.setUserLimit(dynamicSetting.limit);
            newState.channel.setRTCRegion(dynamicSetting.region);

            newState.channel.permissionOverwrites.create(newState.member.id, {
                ManageChannels: true,
                ManageRoles: true,
                ViewChannel: true
            });
        } catch (e) { }

        //Must be first process.
        dvc[newState.guild.id][newBaseRoom.id] = dvc[newState.guild.id][newState.channel.id];
        delete dvc[newState.guild.id][newState.channel.id];
        fs.writeFileSync(path.join(__dirname, "data", "dvc.json"), JSON.stringify(dvc));

        if (!dvcTemporary[newState.guild.id]) dvcTemporary[newState.guild.id] = {};
        dvcTemporary[newState.guild.id][newState.channel.id] = {
            owner: newState.member.id,
            parent: newBaseRoom.id
        };
        fs.writeFileSync(path.join(__dirname, "data", "_temporary-dvc.json"), JSON.stringify(dvcTemporary));
        //End Save.

        return true;
    }

    async function dvc_remove() {
        const parent = oldState.channel.parent;
        const parentPermission = parent.permissionsFor(client.user);

        if (!dvc[oldState.guild.id]) return;

        if (!parentPermission.has(PermissionsBitField.Flags.ViewChannel)) return;
        if (!parentPermission.has(PermissionsBitField.Flags.ManageChannels)) return;
        if (!parentPermission.has(PermissionsBitField.Flags.ManageRoles)) return;

        if (!dvcTemporary[oldState.guild.id]) return;
        if (!dvcTemporary[oldState.guild.id][oldState.channel.id]) {
            //console.log(false);
            return;
        }

        if (oldState.channel.members.size == newState.channel?.members.size) return;

        if (oldState.channel.members.size !== 0 && dvcTemporary[oldState.guild.id][oldState.channel.id].owner == oldState.member.id) {
            dvcTemporary[oldState.guild.id][oldState.channel.id].owner = null;
            oldState.channel.setName("⚠️流浪的房間");

            fs.writeFileSync(path.join(__dirname, "data", "_temporary-dvc.json"), JSON.stringify(dvcTemporary));

            return;
        } else if (oldState.channel.members.size !== 0) return;

        delete dvcTemporary[oldState.guild.id][oldState.channel.id];
        if (Object.keys(dvcTemporary[oldState.guild.id]).length == 0) delete dvcTemporary[oldState.guild.id];
        try { await oldState.channel.delete(); } catch (e) { };

        fs.writeFileSync(path.join(__dirname, "data", "_temporary-dvc.json"), JSON.stringify(dvcTemporary));

        return true;
    }

    if (!oldState.channel && newState.channel) dvc_create_v1();
    else if (oldState.channel && !newState.channel) dvc_remove();
    else {
        await dvc_remove();
        await dvc_create_v1();
    }
});

client.on("channelUpdate", async (oldChannel, newChannel) => {
    const newChannelPermission = newChannel.permissionsFor(client.user);

    if (!newChannelPermission.has(PermissionsBitField.Flags.ViewAuditLog)) return;

    const fetchedLogs = await newChannel.guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelUpdate });
    const channelUpdateLog = fetchedLogs.entries.first();
    if (!channelUpdateLog) return;
    const { executor, target } = channelUpdateLog;

    function dvc_protect() {
        if (executor.id == client.user.id || executor.bot) return;

        if (!dvcTemporary[newChannel.guild.id]) return;
        if (!dvcTemporary[newChannel.guild.id][newChannel.id]) return;

        if (dvcTemporary[newChannel.guild.id][newChannel.id].owner !== executor.id) return;

        let target_dvc = dvc[newChannel.guild.id][dvcTemporary[newChannel.guild.id][newChannel.id].parent];
        //console.log(dvc[newChannel.guild.id], dvcTemporary[newChannel.guild.id][newChannel.id].parent);
        if (!target_dvc?.custom) target_dvc.custom = {};

        if (!target_dvc?.custom[dvcTemporary[newChannel.guild.id][newChannel.id].owner]) target_dvc.custom[dvcTemporary[newChannel.guild.id][newChannel.id].owner] = {};
        let target_dvcCustom = target_dvc.custom[dvcTemporary[newChannel.guild.id][newChannel.id].owner];

        if (oldChannel.name !== newChannel.name) target_dvcCustom.name = newChannel.name;
        if (oldChannel.userLimit !== newChannel.userLimit) target_dvcCustom.limit = newChannel.userLimit;
        if (oldChannel.rtcRegion !== newChannel.rtcRegion) target_dvcCustom.region = newChannel.rtcRegion;

        fs.writeFileSync(path.join(__dirname, "data", "dvc.json"), JSON.stringify(dvc));
    }

    try{
        dvc_protect();
    } catch (e){
        console.log(e);
    }
    
});

client.login(config["discord-token"]);