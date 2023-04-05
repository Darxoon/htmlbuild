import { watch } from "chokidar"
import { SourceFile, StaticFile, getSourceFiles, getStaticFiles } from "./html.js"
import { resolve } from "path"
import { buildSourceFile, buildStaticFile } from "./build.js"
import colors from "colors"

export async function watchFiles(srcDir: string, staticDir: string, distDir: string) {
	createSourceWatcher(srcDir, distDir)
	createStaticFileWatcher(staticDir, distDir)
}

function createSourceWatcher(sourceDir: string, distDir: string) {
	let watcher = watch(sourceDir)
	
	let sourceFiles: SourceFile[]
	
	async function prepareFile(path: string) {
		sourceFiles = await getSourceFiles(sourceDir)
		
		let totalPath = resolve(path)
		const relevantFile = sourceFiles.find(source => source.totalPath == totalPath)
		
		if (!relevantFile)
			throw new Error("Could not find the source file " + path)
		
		console.log(colors.blue('Updating source file'), colors.yellow(`'${relevantFile.relativePath}'`))
		
		await buildSourceFile(relevantFile, distDir).catch(e => {
			console.error('Could not update file ' + relevantFile.relativePath)
			console.error(e)
		})
		
		// Update dependants
		for (const file of sourceFiles) {
			if (file != relevantFile && file.dependencies.includes(relevantFile)) {
				console.log(colors.green('  Updating dependant'), colors.yellow(`'${file.relativePath}'`))
				
				await buildSourceFile(file, distDir).catch(e => {
					console.error('Could not update file ' + file.relativePath)
					console.error(e)
				})
			}
		}
	}
	
	async function deleteFile(path: string) {
		let totalPath = resolve(path)
		const relevantFile = sourceFiles.find(source => source.totalPath == totalPath)
		
		if (!relevantFile)
			throw new Error("Could not find the source file " + path)
		
		relevantFile.isDeleted = true
		
		console.log(colors.red('Deleting file'), colors.yellow(`'${relevantFile.relativePath}'`))
		
		await buildSourceFile(relevantFile, distDir).catch(e => {
			console.error('Could not update file ' + relevantFile.relativePath)
			console.error(e)
		})
		
		// Collect all dependants to update them after source file list was updated
		let dependants = sourceFiles.filter(file => file.dependencies.includes(relevantFile)).map(file => file.relativePath)
		
		sourceFiles = await getSourceFiles(sourceDir)
		
		for (const file of sourceFiles) {
			if (!dependants.includes(file.relativePath))
				continue
			
			console.log(colors.green('  Updating dependant'), colors.yellow(`'${file.relativePath}'`))
			
			await buildSourceFile(file, distDir).catch(e => {
				console.error('Could not update file ' + file.relativePath)
				console.error(e)
			})
		}
	}
	
	watcher.on('add', prepareFile)
	watcher.on('change', prepareFile)
	watcher.on('unlink', deleteFile)
}

function createStaticFileWatcher(staticDir: string, distDir: string) {
	let watcher = watch(staticDir)
	
	let files: StaticFile[]
	
	async function prepareFile(path: string) {
		files = await getStaticFiles(staticDir)
		
		let totalPath = resolve(path)
		const relevantFile = files.find(source => source.totalPath == totalPath)
		
		if (!relevantFile)
			throw new Error("Could not find the static file " + path)
		
		console.log(colors.cyan('Updating static file'), colors.yellow(`'${relevantFile.relativePath}'`))
		
		await buildStaticFile(relevantFile, distDir).catch(e => {
			console.error('Could not update file ' + relevantFile.relativePath)
			console.error(e)
		})
	}
	
	async function deleteFile(path: string) {
		let totalPath = resolve(path)
		const relevantFile = files.find(source => source.totalPath == totalPath)
		
		if (!relevantFile)
			throw new Error("Could not find the source file " + path)
		
		relevantFile.isDeleted = true
		
		console.log(colors.magenta('Deleting static file'), colors.yellow(`'${relevantFile.relativePath}'`))
		
		await buildStaticFile(relevantFile, distDir).catch(e => {
			console.error('Could not update file ' + relevantFile.relativePath)
			console.error(e)
		})
	}
	
	watcher.on('add', prepareFile)
	watcher.on('change', prepareFile)
	watcher.on('unlink', deleteFile)
}
