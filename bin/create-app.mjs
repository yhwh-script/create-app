#!/usr/bin/env node
import { argv, chdir, cwd } from "node:process";
import { join } from "node:path";
import { existsSync, mkdirSync, opendir, cpSync } from "node:fs";
import { execSync } from "node:child_process";
import { checkbox, Seperator } from "@inquirer/prompts"

const projectname = argv[2];

if (!projectname) {
  throw new Error("Please specify a project name. Syntax: npx @yhwh-script/create-app {your_project_name}");
}

const answers = await checkbox({
  message: 'Select your packages',
  choices: [
    { name: 'elements', value: 'elements', disabled: '(will be installed)' },
    new Seperator(),
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

    let files = 'files';
    if (answers.includes['sqlite']) {
      console.log("Installing SQLite...");
      execSync("npm install @sqlite.org/sqlite-wasm --save");
      if (answers.includes['examples']) {
        files = 'sqlite-examples';
      } else {
        files = 'sqlite';
      }
    } else if (answers.includes['examples']) {
        files = 'examples';
      }
    // kein sqlite, keine examples

    console.log("Copying files...");
    const defaultPath = join(import.meta.dirname, `../${files}`);
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
