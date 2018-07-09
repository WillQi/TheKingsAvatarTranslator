const config = require("./config.json");

const fs = require("fs");
const path = require("path");
const Translator = require("./src/Translator");

const T = new Translator(config.GOOGLE_TRANSLATE_TOKEN, config.USER_AGENT);

const translateChapters = async (start, end) => {
    end = end + 1;
    for (let cur = start; cur < end; cur++) {
        if (fs.existsSync(path.join(__dirname, "translated", `Chapter-${cur}.txt`))) continue;
        const translated = await T.translateChapter(cur);
        await new Promise((resolve, reject) => {
            fs.writeFile(path.join(__dirname, "translated", `Chapter-${cur}.txt`), translated, err => {
                if (err) return reject(err);
                resolve();  
            });
        }).catch(err => {
            console.error(err);
            throw new Error(`Failed to save chapter ${cur}.`);  
        });
        console.log(`Translated Chapter ${cur}.`);
    }
    console.log("Finished translating requested chapters.");
};

translateChapters(1, 10);