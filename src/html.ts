import { glob } from "glob"
import path, { basename, relative, resolve } from "path"

export interface SourceFile {
	relativePath: string
	totalPath: string
	type: 'html'
	isDeleted: boolean
	
	isPublic: boolean
	dependencies: SourceFile[]
}

export async function getSourceFiles(sourceDir: string) {
	let sourcePaths = await glob(path.join(sourceDir, '/**/*.html').replaceAll('\\', '/'))
	
	return resolveSourceFiles(sourcePaths, sourceDir)
}

export function resolveSourceFiles(paths: string[], sourceDir: string): SourceFile[] {
	let output: SourceFile[] = []
	
	for (const path of paths) {
		let relativePath = relative(sourceDir, path).replaceAll('\\', '/')
		let totalPath = resolve(path)
		let fileName = basename(path)
		
		if (relativePath.includes('..'))
			throw new Error(`Path ${path} not a valid source file, it is not contained in the source directory`)
		
		let isPublic = !fileName.startsWith('~')
		
		output.push({ relativePath, totalPath, isDeleted: false, type: 'html', isPublic, dependencies: [] })
	}
	
	// Resolve build dependencies
	let layoutFiles = output.filter(file => path.basename(file.totalPath).startsWith('~layout'))
	
	for (const layout of layoutFiles) {
		for (const file of output) {
			if (layout == file)
				continue
			
			let relativePath = path.relative(path.dirname(layout.relativePath), file.relativePath)
			
			if (!relativePath.includes('..'))
				file.dependencies.push(layout)
		}
	}
	
	return output
}

export interface StaticFile {
	relativePath: string
	totalPath: string
	isDeleted: boolean
}

export async function getStaticFiles(staticDir: string) {
	let staticPaths = await glob(path.join(staticDir, '/**/*').replaceAll('\\', '/'))
	
	return resolveStaticFiles(staticPaths, staticDir)
}

export function resolveStaticFiles(paths: string[], staticDir: string): StaticFile[] {
	let output: StaticFile[] = paths.map(path => {
		let relativePath = relative(staticDir, path).replaceAll('\\', '/')
		let totalPath = resolve(path)
		
		if (relativePath.includes('..'))
			throw new Error(`Path ${path} not a valid static file, it is not contained in the static directory`)
		
		return { relativePath, totalPath, isDeleted: false }
	})
	
	return output
}
