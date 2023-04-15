import { SourceFile, StaticFile, getSourceFiles, getStaticFiles, resolveSourceFiles, resolveStaticFiles } from "./html.js";
import fs from "fs/promises";
import path from "path";
import colors from "colors"
import { waitTimeout } from "./util.js";

export async function build(srcDir: string, staticDir: string, distDir: string) {
	console.log(colors.cyan('Building output directory...'))
	
	let sourceFiles = await getSourceFiles(srcDir)
	
	for (const source of sourceFiles) {
		await buildSourceFile(source, distDir)
	}
	
	let staticFiles = await getStaticFiles(staticDir)
	
	for (const file of staticFiles) {
		await buildStaticFile(file, distDir)
	}
}

/**
 * Will try to access all files given as paths to make sure that they can be used.
 * @returns a promise holding a boolean that is true if the files are ok and false if they are not.
 */
async function accessFiles(paths: string[] | string, timeoutMs = 100): Promise<boolean> {
	await waitTimeout(timeoutMs)
	
	if (typeof paths === "string")
		paths = [paths]
	
	let pathsAreOkPromises = paths.map(
		async path => fs.access(path).then(() => true).catch(() => false)
	)
	
	let pathsAreOk = await Promise.all(pathsAreOkPromises)
	let containsErroringFile = pathsAreOk.includes(false)
	
	return !containsErroringFile
}

export async function buildSourceFile(source: SourceFile, distDir: string) {
	if (!source.isPublic)
		return
	
	let destinationPath = path.join(distDir, source.relativePath)
	let destinationDir = path.dirname(destinationPath)
	
	if (source.isDeleted) {
		// delete destination file
		if (await accessFiles(destinationPath) == true)
			try {
				fs.unlink(destinationPath)
			} catch (e) {
				console.error("Could not delete file " + destinationPath)
				console.error(e)
			}
		else
			console.error("Cannot delete file " + destinationPath + ", not enough permissions or file does not exist.")
		
		return
	}
	
	// compose destination file out of dependency chain
	let files = [...source.dependencies, source]
	let content = ""
	
	if (await accessFiles(files.map(file => file.totalPath)) == false) {
		console.error(`Cannot update file ${destinationPath}, not enough permission or source files do not exist.`)
	}
	
	for (const file of files) {
		let dependencyContent = prepareContent(await fs.readFile(file.totalPath, 'utf8'), path.join(distDir, file.relativePath), destinationPath)
		
		if (content == "") {
			content = dependencyContent
		} else if (content.includes(contentEscapeCharacter)) {
			content = content.replace(contentEscapeCharacter, dependencyContent)
		} else {
			throw new Error(`File ${file.dependencies[file.dependencies.length - 1].relativePath} does not contain '%{content}'`)
		}
	}
	
	if (content.includes(contentEscapeCharacter))
		throw new Error(`File ${source.totalPath} contains %{content} even though it is not a layout file`)
	
	try {
		await fs.mkdir(destinationDir, { recursive: true })
		await fs.writeFile(destinationPath, content, 'utf8')
	} catch (e) {
		console.error("Could not update file " + destinationPath)
		console.error(e)
	}
}

const regex = /%{{|%{([^}]*)}/g
const contentEscapeCharacter = '𝌖'

function prepareContent(content: string, filePath: string, destinationPath: string): string {
	return content.replaceAll(regex, (match: string, matchValue: string) => {
		switch (match) {
			case '%{{':
				return '%{'
			default: {
				let args = matchValue.trim().split(' ')
				
				if (args[0] == "content")
					return contentEscapeCharacter
				else if (args[0] == "path") {
					let basePath = path.dirname(destinationPath)
					let targetPath = path.join(path.dirname(filePath), args.slice(1).join(' '))
					
					return path.relative(basePath, targetPath).replaceAll('\\', '/')
				} else
					throw new Error('Unknown escape command ' + args[0])
			}	
		}
	})
}

export async function buildStaticFile(file: StaticFile, distDir: string) {
	let destinationPath = path.join(distDir, file.relativePath)
	let destinationDir = path.dirname(destinationPath)
	
	if (await accessFiles(file.totalPath) == false) {
		console.error(`Cannot update ${destinationPath}, not enough permission or source file does not exist.`)
	}
	
	await fs.mkdir(destinationDir, { recursive: true })
	
	await fs.copyFile(file.totalPath, path.join(distDir, file.relativePath))
}
