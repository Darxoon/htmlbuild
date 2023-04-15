export function waitTimeout(milliseconds: number): Promise<void> {
	return new Promise((resolve, reject) => {
		try {
			setTimeout(resolve, milliseconds)
		} catch (e) {
			reject(e)
		}
	})
}
