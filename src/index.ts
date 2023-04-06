#!/usr/bin/env node

import { readFile, writeFile } from "fs/promises"
import { build } from "./build.js"
import { watchFiles } from "./watch.js"
import { exit } from "process"
import { resolve } from "path"
import json5 from "json5"

{
	let [,, method, configFile] = process.argv

	if (method == '-h' || method == '--help') {
		printHelpMessage()
		exit()
	}

	if (method == '-v' || method == '--version') {
		console.log('v1.0.0')
		exit()
	}
	
	if (method == "init") {
		const file = `{
	// path to directory containing HTML files
	"sourceDirectory": "src/",
	
	// path to directory containing static files to copy into out directory.
	// Must not be equal to the source directory.
	"staticDirectory": "static/",
	
	// The target directory to place the built and copied files into.
	"outDirectory": "dist/",
}
`
		await writeFile("htmlbuild.config.json", file, 'utf8')
		exit()
	}
	
	configFile ||= "htmlbuild.config.json"
	
	let { sourceDirectory, staticDirectory, outDirectory } = json5.parse(await readFile(configFile, 'utf8'))
	
	if (resolve(sourceDirectory) == resolve(staticDirectory)) {
		throw new Error("Source and Static directory are not allowed to be equal.")
	}
	
	if (method == "build") {
		await build(sourceDirectory, staticDirectory, outDirectory)
	}
	else if (method == "watch") {
		await watchFiles(sourceDirectory, staticDirectory, outDirectory)
	}
	else {
		throw new Error("Unknown method " + method)
	}
}

function printHelpMessage() {
	console.log(`
Usage: htmlbuild build|watch [<config>]
Simple HTML build tool

build: Generate the target directory once and quit.
watch: Generate the target directory and update it every time the source and static directory change.
<config>: Path to the config JSON file. If left empty, it will check for htmlbuild.config.json in the root directory.

Structure of config JSON file: {
    // path to directory containing HTML files
    sourceDirectory: string 
	
    // path to directory containing static files to copy into out directory.
    // Must not be equal to the source directory.
    staticDirectory: string
	
    // The target directory to place the built and copied files into.
    outDirectory: string
}

Arguments:
  -h, --help     Print this message.
  -v, --version  Print the current version.
`.trim())
}