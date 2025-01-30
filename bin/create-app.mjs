#!/usr/bin/env node
import { argv, chdir, cwd } from "node:process";
import { join } from "node:path";
import { existsSync, mkdirSync, opendir, cpSync } from "node:fs";
import { execSync } from "node:child_process";
import { checkbox } from "@inquirer/prompts"

const projectname = argv[2];

if (!projectname) {
    throw new Error("Please specify a project name. Syntax: npx @yhwh-script/create-app {your_project_name}");
}

const answers = await checkbox({
    message: 'Select your packages (checking examples + sqlite is recommended for demonstration purposes)',
    choices: [
        { name: 'elements', value: 'elements', disabled: '(will be installed)' },
        { name: 'examples', value: 'examples' },
        { name: 'sqlite', value: 'sqlite' },
    ],
});

const directory = join(cwd(), projectname);

if (existsSync(directory)) {
    throw new Error("Foldername already exists. Please use another folder.");
}

console.log("Creating new project...");
mkdirSync(directory);

opendir(directory, (err, dir) => {
    if (err) {
        console.log("Error:", err);
    } else {
        chdir(dir.path);
        console.log("Initializing project...");
        execSync("npm init -y");
        execSync(`npm pkg delete scripts.test`);
        execSync(`npm pkg set type=module`);

        let path = '../default'
        if (answers.includes('sqlite')) {
            console.log("Installing SQLite...");
            execSync("npm install @sqlite.org/sqlite-wasm --save");
            if (answers.includes('examples')) {
                path = '../sqlite-examples';
                console.log("...with examples. Great choice!");
            } else {
                console.log("...without recommended examples");
                path = '../sqlite';
            }
        } else if (answers.includes('examples')) {
            console.log("Examples (without recommended SQLite)");
            path = '../examples';
        } else {
            console.log("OK, let's go vanilla.");
        }

        const defaultPath = join(import.meta.dirname, path);
        const targetPath = join(dir.path);
        cpSync(defaultPath, targetPath, { recursive: true });

        console.log("Installing Vite...");
        execSync(`npm install vite @vitejs/plugin-basic-ssl --save`);
        execSync(
            `npm pkg set scripts.gen="node gen.cjs" scripts.dev="npm run gen && vite" scripts.build="npm run gen && vite build" scripts.preview="npm run gen && vite preview"`
        );

        console.log("Closing the directory");
        dir.closeSync();

        console.log("Thanks for using yhwh-script. Have fun!");
    }
});
