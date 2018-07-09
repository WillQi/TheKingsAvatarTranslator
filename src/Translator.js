const snekfetch = require("snekfetch");
const robots = require("robots-txt-parser");
const google = require("google-translate");
const {JSDOM} = require("jsdom");

const REPLACE_WORDS = require("./utils/REPLACE.json");

//const GRAMMAR_REGEX = /(\.|\,|\?|\!|\(|\|“|”")/g;

const Translator = function(token, agent) {

    this.token = token;

    this.agent = agent;

    this.BASE_URL = "https://lnmtl.com/";

    this.BASE_CHAPTER_PATH = "chapter/the-king-s-avatar-chapter-";

    this.google = google(this.token);

    this.robot = robots({
        userAgent: this.agent
    });

    this.translateChapter = async chapter => {
        const chapter_url = `${this.BASE_URL}${this.BASE_CHAPTER_PATH}${chapter}`;
        const canScrape = await this._canScrape(chapter_url);
        if (!canScrape) throw new Error("Cannot scrape site.");
        const request = await snekfetch.get(chapter_url, {
            headers: {
                "User-Agent": this.agent
            }
        });
        const contents = request.body;
        const {document} = new JSDOM(contents).window;
        const rawElements = document.querySelectorAll(".original");
        let chapterContents = "";

        for (const element of rawElements) {
            chapterContents += element.textContent+" LINE_BREAK ";
        }
        let translated = await new Promise((resolve, reject) => {
            this.google.translate(chapterContents, "en", (err, translation) => {
                if (err) return reject(err);
                resolve(translation.translatedText);
            });
        }).catch(err => {
            console.error("Failed to translate.", err);  
        });

        //TODO: Replace words from REPLACE.json with their replacement as defined in the file.

        // const spread = translated.split(" ");
        // const entries = [];
        // for (let word of spread) {
        //     const hasGrammar = !!word.match(GRAMMAR_REGEX);
        //     const cleanedWord = word.replace(GRAMMAR_REGEX, "");
        //     let entry = [
        //         cleanedWord,
        //         hasGrammar && word[0].match(GRAMMAR_REGEX) ? word[0] : "",
        //         hasGrammar && word[word.length - 1].match(GRAMMAR_REGEX) ? word[word.length - 1] : "",
        //     ];
        //     entries.push(entry);
        // }

        // let noGrammarStr = entries.map(entry => entry[0]).join(" ");
        // for (const replace_word in REPLACE_WORDS) {
        //     noGrammarStr = noGrammarStr.replace(new RegExp(` ${replace_word}`, "gi"), ` ${REPLACE_WORDS[replace_word]} `);
        // }

        // const noGrammarStrSpread = noGrammarStr.split(" ");
        // for (let wordI = 0; wordI < entries.length; wordI++) {
        //     noGrammarStrSpread[wordI] = `${entries[wordI][1]}${noGrammarStrSpread[wordI]}${entries[wordI][2]}`;
        // }

        //return noGrammarStrSpread.join(" ");
        return translated.replace(/ LINE_BREAK /g, "\n");
    };

    this._canScrape = async chapter_url => {
        await this.robot.useRobotsFor(`${this.BASE_URL}robots.txt`);
        const canScrape = await this.robot.canCrawl(chapter_url);
        return canScrape;
    };

};

module.exports = Translator;