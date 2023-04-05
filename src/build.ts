import { SourceFile, StaticFile, getSourceFiles, getStaticFiles, resolveSourceFiles, resolveStaticFiles } from "./html.js";
import fs from "fs/promises";
import path from "path";
import colors from "colors"

export async function build(srcDir: string, staticDir: string, distDir: string) {
	await fs.rm(distDir, { recursive: true, force: true })
	
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

export async function buildSourceFile(source: SourceFile, distDir: string) {
	if (!source.isPublic)
		return
	
	let destinationPath = path.join(distDir, source.relativePath)
	let destinationDir = path.dirname(destinationPath)
	
	if (source.isDeleted) {
		// delete destination file
		
		try {
			await fs.unlink(destinationPath)
		} catch (e) {
			console.error("Could not delete file " + destinationPath)
			console.error(e)
		}
		
		return
	}
	
	// compose destination file out of dependency chain
	let files = [...source.dependencies, source]
	let content = ""
	
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
	
	await fs.mkdir(destinationDir, { recursive: true })
	
	await fs.copyFile(file.totalPath, path.join(distDir, file.relativePath))
}
